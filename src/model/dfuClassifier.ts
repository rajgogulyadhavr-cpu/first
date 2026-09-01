/**
 * FootGuard AI — Real DFU Binary Classifier (FIXED v2)
 * 
 * FIXES APPLIED:
 * 1. Class-weighted logistic regression to handle 54 Normal vs 512 Abnormal imbalance (9.5:1 ratio).
 * 2. Calibrated decision threshold using class-prior probability instead of fixed 0.5.
 * 3. Expanded feature vector (12 features) including saturation, dark-pixel ratio, and contrast range.
 * 4. Feature normalization using per-feature min-max scaling for stable gradient descent.
 * 5. Cache invalidated — retrain uses corrected weighted training loop.
 * 
 * Classes: NORMAL (0) | ABNORMAL (1)
 * Dataset: DFU/Patches/Normal(Healthy skin)/ + DFU/Patches/Abnormal(Ulcer)/
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

type FeatureVector = number[];

interface TrainedModel {
  weights: number[];
  threshold: number;        // class-prior calibrated threshold
  featureMins: number[];    // per-feature min for normalization
  featureMaxs: number[];    // per-feature max for normalization
  trainedOn: number;
  normalCount: number;
  abnormalCount: number;
  accuracy: number;
  recallNormal: number;
  recallAbnormal: number;
  version: number;          // increment to invalidate old cache
}

const CLASSIFIER_VERSION = 3; // v3: use 0.5 threshold (correct with class-weighted training)
let model: TrainedModel | null = null;
let modelLoading = false;
const MODEL_CACHE_PATH = path.join(process.cwd(), 'dfu_model_cache.json');

// ── Feature extraction (12 dimensions) ────────────────────────────────────────
// DFU ulcers:  high redness, dark necrotic regions, irregular texture, low saturation uniformity
// Normal foot: uniform moderate skin tone, consistent saturation, smooth texture
async function extractFeatures(imageBuffer: Buffer): Promise<FeatureVector> {
  const { data, info } = await sharp(imageBuffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  let sumR = 0, sumG = 0, sumB = 0;
  let sumR2 = 0, sumG2 = 0, sumB2 = 0;
  let darkPixels = 0;   // necrotic/dark tissue count
  let brightPixels = 0; // highlight/overexposed count

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sumR += r; sumG += g; sumB += b;
    sumR2 += r * r; sumG2 += g * g; sumB2 += b * b;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < 60) darkPixels++;
    if (lum > 210) brightPixels++;
  }

  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;
  const stdR = Math.sqrt(Math.max(0, sumR2 / pixels - meanR * meanR));
  const stdG = Math.sqrt(Math.max(0, sumG2 / pixels - meanG * meanG));
  const stdB = Math.sqrt(Math.max(0, sumB2 / pixels - meanB * meanB));

  // Feature 1-3: Normalized mean channels
  const fMeanR = meanR / 255;
  const fMeanG = meanG / 255;
  const fMeanB = meanB / 255;

  // Feature 4-6: Normalized std channels (texture/variation)
  const fStdR = stdR / 255;
  const fStdG = stdG / 255;
  const fStdB = stdB / 255;

  // Feature 7: Redness ratio (ulcers elevated R vs G+B)
  const rednessRatio = meanR / (meanG + meanB + 1);

  // Feature 8: Dark pixel ratio (necrotic/black tissue in DFU)
  const darkRatio = darkPixels / pixels;

  // Feature 9: Bright pixel ratio (healthy reflective skin in normal)
  const brightRatio = brightPixels / pixels;

  // Feature 10: Overall texture variance (luma std)
  const meanLuma = (0.299 * sumR + 0.587 * sumG + 0.114 * sumB) / pixels;
  let lumaVar = 0;
  for (let i = 0; i < data.length; i += 3) {
    const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
    lumaVar += (lum - meanLuma) ** 2;
  }
  const textureVar = Math.sqrt(lumaVar / pixels) / 255;

  // Feature 11: Colour contrast range (max-min per channel, indicates lesion borders)
  let maxR = 0, minR = 255, maxG = 0, minG = 255;
  for (let i = 0; i < data.length; i += 3) {
    if (data[i] > maxR) maxR = data[i];
    if (data[i] < minR) minR = data[i];
    if (data[i+1] > maxG) maxG = data[i+1];
    if (data[i+1] < minG) minG = data[i+1];
  }
  const colourRange = ((maxR - minR) + (maxG - minG)) / (2 * 255);

  // Feature 12: Green-Blue imbalance (inflammation pushes R up, suppresses G/B)
  const gbBalance = Math.abs(meanG - meanB) / 255;

  return [fMeanR, fMeanG, fMeanB, fStdR, fStdG, fStdB, rednessRatio, darkRatio, brightRatio, textureVar, colourRange, gbBalance];
}

// ── Feature normalization ─────────────────────────────────────────────────────
function normalizeFeatures(X: FeatureVector[], mins: number[], maxs: number[]): FeatureVector[] {
  return X.map(row => row.map((v, j) => {
    const range = maxs[j] - mins[j];
    return range > 0 ? (v - mins[j]) / range : 0;
  }));
}

function computeMinMax(X: FeatureVector[]): { mins: number[]; maxs: number[] } {
  const nF = X[0].length;
  const mins = new Array(nF).fill(Infinity);
  const maxs = new Array(nF).fill(-Infinity);
  for (const row of X) {
    for (let j = 0; j < nF; j++) {
      if (row[j] < mins[j]) mins[j] = row[j];
      if (row[j] > maxs[j]) maxs[j] = row[j];
    }
  }
  return { mins, maxs };
}

// ── Sigmoid ───────────────────────────────────────────────────────────────────
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
}

// ── Logistic regression predict ───────────────────────────────────────────────
function predictRaw(features: FeatureVector, weights: number[]): number {
  let z = weights[weights.length - 1]; // bias
  for (let i = 0; i < features.length; i++) {
    z += features[i] * weights[i];
  }
  return sigmoid(z);
}

// ── CLASS-WEIGHTED logistic regression training ───────────────────────────────
// w_abnormal = 1.0, w_normal = abnormalCount / normalCount  (compensates imbalance)
function trainWeightedLogisticRegression(
  X: FeatureVector[],
  y: number[],
  classWeightNormal: number,
  epochs = 1000,
  lr = 0.05
): number[] {
  const nFeatures = X[0].length;
  const weights = new Array(nFeatures + 1).fill(0.01);

  for (let e = 0; e < epochs; e++) {
    const gradients = new Array(nFeatures + 1).fill(0.0);
    let totalWeight = 0;

    for (let i = 0; i < X.length; i++) {
      // Apply class weight: NORMAL samples get higher weight to compensate imbalance
      const sampleWeight = y[i] === 0 ? classWeightNormal : 1.0;
      const p = predictRaw(X[i], weights);
      const err = (p - y[i]) * sampleWeight;
      totalWeight += sampleWeight;

      for (let j = 0; j < nFeatures; j++) {
        gradients[j] += err * X[i][j];
      }
      gradients[nFeatures] += err;
    }

    // Adaptive learning rate with L2 regularisation to prevent overfitting
    const adaptiveLr = lr / (1 + e * 0.001);
    const l2Lambda = 0.001;
    for (let j = 0; j <= nFeatures; j++) {
      const l2 = j < nFeatures ? l2Lambda * weights[j] : 0;
      weights[j] -= adaptiveLr * ((gradients[j] / totalWeight) + l2);
    }
  }
  return weights;
}

// ── Load dataset and train ────────────────────────────────────────────────────
async function loadAndTrain(): Promise<TrainedModel> {
  const normalDir = path.join(process.cwd(), 'DFU', 'Patches', 'Normal(Healthy skin)');
  const abnormalDir = path.join(process.cwd(), 'DFU', 'Patches', 'Abnormal(Ulcer)');

  const normalFiles = fs.readdirSync(normalDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));
  const abnormalFiles = fs.readdirSync(abnormalDir).filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  console.log(`[DFU Classifier v2] Training on ${normalFiles.length} NORMAL + ${abnormalFiles.length} ABNORMAL patches...`);

  const Xnormal: FeatureVector[] = [];
  const Xabnormal: FeatureVector[] = [];
  let loadErrors = 0;

  for (const f of normalFiles) {
    try {
      const buf = fs.readFileSync(path.join(normalDir, f));
      Xnormal.push(await extractFeatures(buf));
    } catch { loadErrors++; }
  }

  for (const f of abnormalFiles) {
    try {
      const buf = fs.readFileSync(path.join(abnormalDir, f));
      Xabnormal.push(await extractFeatures(buf));
    } catch { loadErrors++; }
  }

  // Class weight: compensate for imbalance (NORMAL needs higher weight)
  const classWeightNormal = Xabnormal.length / Math.max(Xnormal.length, 1);
  console.log(`[DFU Classifier v2] Class weight for NORMAL: ${classWeightNormal.toFixed(2)}x`);

  // Build full dataset
  const X: FeatureVector[] = [...Xnormal, ...Xabnormal];
  const y: number[] = [...new Array(Xnormal.length).fill(0), ...new Array(Xabnormal.length).fill(1)];

  // Shuffle
  for (let i = X.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [X[i], X[j]] = [X[j], X[i]];
    [y[i], y[j]] = [y[j], y[i]];
  }

  // 80/20 stratified-ish split
  const splitAt = Math.floor(X.length * 0.8);
  const Xtrain = X.slice(0, splitAt);
  const ytrain = y.slice(0, splitAt);
  const Xval = X.slice(splitAt);
  const yval = y.slice(splitAt);

  // Per-feature normalization (fit on training set only)
  const { mins, maxs } = computeMinMax(Xtrain);
  const XtrainNorm = normalizeFeatures(Xtrain, mins, maxs);
  const XvalNorm = normalizeFeatures(Xval, mins, maxs);

  // Train with class weights
  const weights = trainWeightedLogisticRegression(XtrainNorm, ytrain, classWeightNormal, 1200, 0.1);

  // Use 0.5 as the decision threshold — correct for class-weighted logistic regression.
  // Class weights already shift the decision boundary during training so the raw
  // sigmoid output is centred around the true class boundary at p=0.5.
  const threshold = 0.5;
  console.log(`[DFU Classifier v3] Decision threshold: ${threshold} (class-weighted model, no post-hoc shift)`);

  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (let i = 0; i < XvalNorm.length; i++) {
    const prob = predictRaw(XvalNorm[i], weights);
    const pred = prob >= threshold ? 1 : 0;
    if (pred === 1 && yval[i] === 1) tp++;
    else if (pred === 0 && yval[i] === 0) tn++;
    else if (pred === 1 && yval[i] === 0) fp++;
    else fn++;
  }
  const accuracy = (tp + tn) / Math.max(Xval.length, 1);
  const recallNormal = (tn + fp) > 0 ? tn / (tn + fp) : 0;
  const recallAbnormal = (tp + fn) > 0 ? tp / (tp + fn) : 0;

  console.log(`[DFU Classifier v3] ✅ Val accuracy: ${(accuracy * 100).toFixed(1)}% | Normal recall: ${(recallNormal * 100).toFixed(1)}% | Abnormal recall: ${(recallAbnormal * 100).toFixed(1)}%`);
  console.log(`[DFU Classifier v3] Confusion → TP:${tp} TN:${tn} FP:${fp} FN:${fn}`);

  const trained: TrainedModel = {
    weights,
    threshold,
    featureMins: mins,
    featureMaxs: maxs,
    trainedOn: X.length,
    normalCount: normalFiles.length,
    abnormalCount: abnormalFiles.length,
    accuracy,
    recallNormal,
    recallAbnormal,
    version: CLASSIFIER_VERSION,
  };

  try {
    fs.writeFileSync(MODEL_CACHE_PATH, JSON.stringify(trained));
    console.log('[DFU Classifier v2] Model weights cached to disk.');
  } catch { /* non-critical */ }

  return trained;
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function initDFUClassifier(): Promise<void> {
  if (model || modelLoading) return;
  modelLoading = true;

  // Load cache only if version matches
  if (fs.existsSync(MODEL_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(MODEL_CACHE_PATH, 'utf8')) as TrainedModel;
      if (
        cached.version === CLASSIFIER_VERSION &&
        cached.weights?.length === 13 &&
        cached.featureMins?.length === 12 &&
        cached.featureMaxs?.length === 12 &&
        typeof cached.threshold === 'number'
      ) {
        model = cached;
        console.log(`[DFU Classifier v3] ✅ Loaded cached model (acc: ${(model.accuracy * 100).toFixed(1)}%, normalRecall: ${(model.recallNormal * 100).toFixed(1)}%, abnormalRecall: ${(model.recallAbnormal * 100).toFixed(1)}%, threshold: ${model.threshold})`);
        modelLoading = false;
        return;
      }
    } catch { /* retrain */ }
  }

  // Cache invalid/outdated → retrain from dataset
  model = await loadAndTrain();
  modelLoading = false;
}

export async function runDFUPrediction(imageBase64: string): Promise<{
  prediction: 'NORMAL' | 'ABNORMAL';
  confidence: number;
  probabilityNormal: number;
  probabilityAbnormal: number;
  isModelReady: boolean;
}> {
  if (!model) {
    await initDFUClassifier();
  }

  if (!model) {
    return { prediction: 'NORMAL', confidence: 0.5, probabilityNormal: 0.5, probabilityAbnormal: 0.5, isModelReady: false };
  }

  const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+-]+;base64,/, '').replace(/\s/g, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  const rawFeatures = await extractFeatures(buffer);

  // Apply same per-feature normalization used during training
  const normFeatures = rawFeatures.map((v, j) => {
    const range = model!.featureMaxs[j] - model!.featureMins[j];
    return range > 0 ? (v - model!.featureMins[j]) / range : 0;
  });

  const probAbnormal = predictRaw(normFeatures, model.weights);
  const probNormal = 1 - probAbnormal;

  // Use calibrated threshold (not hard-coded 0.5)
  const isAbnormal = probAbnormal >= model.threshold;
  const confidence = isAbnormal ? probAbnormal : probNormal;

  return {
    prediction: isAbnormal ? 'ABNORMAL' : 'NORMAL',
    confidence: +confidence.toFixed(4),
    probabilityNormal: +probNormal.toFixed(4),
    probabilityAbnormal: +probAbnormal.toFixed(4),
    isModelReady: true,
  };
}

export function isDFUModelReady(): boolean {
  return model !== null;
}

export function getDFUModelInfo() {
  return model ? {
    trainedOn: model.trainedOn,
    normalCount: model.normalCount,
    abnormalCount: model.abnormalCount,
    accuracy: model.accuracy,
    recallNormal: model.recallNormal,
    recallAbnormal: model.recallAbnormal,
    threshold: model.threshold,
    version: model.version,
  } : null;
}
