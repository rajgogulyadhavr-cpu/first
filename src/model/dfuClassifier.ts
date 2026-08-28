/**
 * FootGuard AI — Real DFU Binary Classifier
 * Trains a logistic regression classifier on-the-fly from the local DFU dataset patches.
 * Uses statistical image features (color, texture, redness) extracted via sharp.
 * No hardcoded predictions. No Gemini for DFU classification.
 * Classes: NORMAL (0) | ABNORMAL (1)
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ── Feature vector (8 dimensions) ──────────────────────────────────────────
// [meanR, meanG, meanB, stdR, stdG, stdB, rednessRatio, textureVariance]
type FeatureVector = number[];

interface TrainedModel {
  weights: number[];  // logistic regression weights (8 features + 1 bias)
  trainedOn: number;
  normalCount: number;
  abnormalCount: number;
  accuracy: number;
}

let model: TrainedModel | null = null;
let modelLoading = false;
const MODEL_CACHE_PATH = path.join(process.cwd(), 'dfu_model_cache.json');

// ── Image feature extraction ─────────────────────────────────────────────────
async function extractFeatures(imageBuffer: Buffer): Promise<FeatureVector> {
  // Resize to 64×64 RGB for fast, consistent feature extraction
  const { data, info } = await sharp(imageBuffer)
    .resize(64, 64, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = info.width * info.height;
  let sumR = 0, sumG = 0, sumB = 0;
  let sumR2 = 0, sumG2 = 0, sumB2 = 0;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    sumR += r; sumG += g; sumB += b;
    sumR2 += r * r; sumG2 += g * g; sumB2 += b * b;
  }

  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;
  const stdR = Math.sqrt(Math.max(0, sumR2 / pixels - meanR * meanR));
  const stdG = Math.sqrt(Math.max(0, sumG2 / pixels - meanG * meanG));
  const stdB = Math.sqrt(Math.max(0, sumB2 / pixels - meanB * meanB));

  // Redness ratio: key DFU biomarker (ulcers show elevated red channel relative to green/blue)
  const rednessRatio = meanR / (meanG + meanB + 1);

  // Texture variance: DFU lesions have high local pixel variance (irregular texture)
  const brightness = data.reduce((acc, v, i) => i % 3 === 0 ? acc + (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114) : acc, 0) / pixels;
  let textureSum = 0;
  for (let i = 0; i < data.length; i += 3) {
    const lum = data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114;
    textureSum += (lum - brightness) ** 2;
  }
  const textureVariance = Math.sqrt(textureSum / pixels);

  return [meanR / 255, meanG / 255, meanB / 255, stdR / 255, stdG / 255, stdB / 255, rednessRatio, textureVariance / 255];
}

// ── Sigmoid ───────────────────────────────────────────────────────────────────
function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

// ── Logistic regression predict ───────────────────────────────────────────────
function predict(features: FeatureVector, weights: number[]): number {
  // weights has length features.length + 1 (last = bias)
  let z = weights[weights.length - 1]; // bias
  for (let i = 0; i < features.length; i++) {
    z += features[i] * weights[i];
  }
  return sigmoid(z);
}

// ── Logistic regression training (gradient descent) ──────────────────────────
function trainLogisticRegression(
  X: FeatureVector[],
  y: number[],
  epochs = 500,
  lr = 0.1
): number[] {
  const nFeatures = X[0].length;
  const weights = new Array(nFeatures + 1).fill(0.0); // +1 for bias

  for (let e = 0; e < epochs; e++) {
    const gradients = new Array(nFeatures + 1).fill(0.0);

    for (let i = 0; i < X.length; i++) {
      const p = predict(X[i], weights);
      const err = p - y[i];
      for (let j = 0; j < nFeatures; j++) {
        gradients[j] += err * X[i][j];
      }
      gradients[nFeatures] += err; // bias gradient
    }

    for (let j = 0; j <= nFeatures; j++) {
      weights[j] -= (lr / X.length) * gradients[j];
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

  console.log(`[DFU Classifier] Training on ${normalFiles.length} NORMAL + ${abnormalFiles.length} ABNORMAL patches...`);

  const X: FeatureVector[] = [];
  const y: number[] = [];
  let loadErrors = 0;

  // Load NORMAL patches (label 0)
  for (const f of normalFiles) {
    try {
      const buf = fs.readFileSync(path.join(normalDir, f));
      const feat = await extractFeatures(buf);
      X.push(feat);
      y.push(0);
    } catch { loadErrors++; }
  }

  // Load ABNORMAL patches (label 1)
  for (const f of abnormalFiles) {
    try {
      const buf = fs.readFileSync(path.join(abnormalDir, f));
      const feat = await extractFeatures(buf);
      X.push(feat);
      y.push(1);
    } catch { loadErrors++; }
  }

  console.log(`[DFU Classifier] Features extracted: ${X.length} samples (${loadErrors} load errors)`);

  // Shuffle training data
  for (let i = X.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [X[i], X[j]] = [X[j], X[i]];
    [y[i], y[j]] = [y[j], y[i]];
  }

  // 80/20 train/val split for accuracy measurement
  const splitAt = Math.floor(X.length * 0.8);
  const Xtrain = X.slice(0, splitAt);
  const ytrain = y.slice(0, splitAt);
  const Xval = X.slice(splitAt);
  const yval = y.slice(splitAt);

  // Train logistic regression
  const weights = trainLogisticRegression(Xtrain, ytrain, 800, 0.15);

  // Measure validation accuracy
  let correct = 0;
  for (let i = 0; i < Xval.length; i++) {
    const prob = predict(Xval[i], weights);
    const pred = prob >= 0.5 ? 1 : 0;
    if (pred === yval[i]) correct++;
  }
  const accuracy = Xval.length > 0 ? correct / Xval.length : 0;

  const trained: TrainedModel = {
    weights,
    trainedOn: X.length,
    normalCount: normalFiles.length,
    abnormalCount: abnormalFiles.length,
    accuracy,
  };

  console.log(`[DFU Classifier] ✅ Training complete. Val accuracy: ${(accuracy * 100).toFixed(1)}% on ${Xval.length} samples`);

  // Cache model weights to disk
  try {
    fs.writeFileSync(MODEL_CACHE_PATH, JSON.stringify(trained));
    console.log('[DFU Classifier] Model weights cached to disk.');
  } catch { /* non-critical */ }

  return trained;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Initialize the classifier (call once at server startup) */
export async function initDFUClassifier(): Promise<void> {
  if (model || modelLoading) return;
  modelLoading = true;

  // Try loading cached model first (instant startup on subsequent runs)
  if (fs.existsSync(MODEL_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(MODEL_CACHE_PATH, 'utf8')) as TrainedModel;
      if (cached.weights && cached.weights.length === 9) {
        model = cached;
        console.log(`[DFU Classifier] ✅ Loaded cached model (trained on ${model.trainedOn} samples, acc: ${(model.accuracy * 100).toFixed(1)}%)`);
        modelLoading = false;
        return;
      }
    } catch { /* retrain */ }
  }

  model = await loadAndTrain();
  modelLoading = false;
}

/** Run DFU prediction on a base64 image buffer. Returns { prediction, confidence } */
export async function runDFUPrediction(imageBase64: string): Promise<{
  prediction: 'NORMAL' | 'ABNORMAL';
  confidence: number;
  probabilityNormal: number;
  probabilityAbnormal: number;
  isModelReady: boolean;
}> {
  if (!model) {
    // Model not ready yet — try to wait briefly
    await new Promise(r => setTimeout(r, 1000));
    if (!model) {
      return { prediction: 'NORMAL', confidence: 0.5, probabilityNormal: 0.5, probabilityAbnormal: 0.5, isModelReady: false };
    }
  }

  const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Clean, 'base64');

  const features = await extractFeatures(buffer);
  const probAbnormal = predict(features, model.weights);
  const probNormal = 1 - probAbnormal;

  const isAbnormal = probAbnormal >= 0.5;
  const confidence = isAbnormal ? probAbnormal : probNormal;

  return {
    prediction: isAbnormal ? 'ABNORMAL' : 'NORMAL',
    confidence: +confidence.toFixed(4),
    probabilityNormal: +probNormal.toFixed(4),
    probabilityAbnormal: +probAbnormal.toFixed(4),
    isModelReady: true,
  };
}

/** Check classifier readiness */
export function isDFUModelReady(): boolean {
  return model !== null;
}

/** Get model info */
export function getDFUModelInfo() {
  return model ? {
    trainedOn: model.trainedOn,
    normalCount: model.normalCount,
    abnormalCount: model.abnormalCount,
    accuracy: model.accuracy,
  } : null;
}
