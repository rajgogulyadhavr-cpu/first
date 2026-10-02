/**
 * FootGuard AI — DFU Classifier v7
 * ============================================================
 * RESEARCH PROTOTYPE — NOT A MEDICAL DIAGNOSTIC DEVICE
 * ============================================================
 *
 * Changes from v6:
 * - Model version bumped to 7 (new clean training on Patches/ dataset)
 * - Threshold read from model JSON (calibrated via Youden's J on validation)
 * - UNCERTAIN output when confidence falls in calibrated uncertain zone
 * - Image quality check before prediction
 * - Patch-tiling inference: full-foot camera images are split into overlapping
 *   patches; each patch is classified; final result is aggregated.
 * - Single centralized preprocessing matching train_new_pipeline.py exactly
 * - Hotspot derived from highest-variance ABNORMAL region
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// ── Type definitions ─────────────────────────────────────────────────────────

export interface DecisionTree {
  children_left: number[];
  children_right: number[];
  feature: number[];
  threshold: number[];
  value: number[];
}

export interface GBDTModel {
  version: number;
  modelType: string;
  learningRate: number;
  initValue: number;
  featureNames: string[];
  trees: DecisionTree[];
  trainedOn: number;
  normalCount: number;
  abnormalCount: number;
  /** Calibrated threshold (Youden's J on validation set). Default 0.5 if missing. */
  threshold?: number;
  /** Lower bound of uncertain zone */
  uncertainLow?: number;
  /** Upper bound of uncertain zone */
  uncertainHigh?: number;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    rocAuc?: number;
    recallNormal: number;
    recallAbnormal: number;
    specificity?: number;
  };
}

export type PredictionLabel = 'NORMAL' | 'ABNORMAL' | 'UNCERTAIN';

export interface DFUFeatureResult {
  features: number[];
  hotspotX: number;
  hotspotY: number;
  maxBlockVariance: number;
}

export interface DFUPredictionOutput {
  prediction: PredictionLabel;
  confidence: number;
  probabilityNormal: number;
  probabilityAbnormal: number;
  isModelReady: boolean;
  hotspotX: number;
  hotspotY: number;
  /** Number of valid patches analyzed (for full-foot images) */
  patchesAnalyzed?: number;
  /** Per-patch probabilities (for transparency) */
  patchProbabilities?: number[];
  qualityIssue?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CLASSIFIER_VERSION = 8;
const MODEL_CACHE_PATH = path.join(process.cwd(), 'dfu_model_cache.json');

/** Input size matching train_new_pipeline.py PREPROCESSING_CONFIG */
const PATCH_SIZE = 128;

/** Tiling: stride for overlapping patch extraction from full-foot images */
const TILE_STRIDE = 64;

/** Minimum skin pixel fraction for a patch to be considered valid.
 *  Lowered from 0.15 → 0.08 to handle real-world images with diverse skin tones
 *  and partial foot crops where the skin mask may be conservatively estimated. */
const MIN_SKIN_FRACTION = 0.08;

/** Default threshold if model JSON doesn't contain a usable calibrated value */
const DEFAULT_THRESHOLD = 0.50;

/** Default uncertain zone half-width around threshold */
const DEFAULT_UNCERTAIN_HALF = 0.07;

/**
 * Maximum raw-probability value that is still considered "reachable" for the
 * uncertain-high boundary.  The stored model has uncertainHigh=1.0 which is
 * the mathematical maximum of a sigmoid and therefore unreachable in practice,
 * effectively making ABNORMAL predictions impossible.  We cap it at 0.97.
 */
const UNCERTAIN_HIGH_CAP = 0.97;

// ── Model state ──────────────────────────────────────────────────────────────

let model: GBDTModel | null = null;
let modelLoading = false;

// ── Image quality thresholds ─────────────────────────────────────────────────

const QUALITY = {
  minResolution: 64,          // px (each dim)
  blurThreshold: 12.0,        // Laplacian variance — below = blurry
  darkLumaThreshold: 30.0,    // mean luma — below = too dark
  brightLumaThreshold: 230.0, // mean luma — above = overexposed
  minSizKB: 2,                // KB — below = tiny/corrupt
};

// ══════════════════════════════════════════════════════════════════════════════
// IMAGE QUALITY CHECK
// ══════════════════════════════════════════════════════════════════════════════

export async function checkImageQuality(imageBuffer: Buffer): Promise<{
  acceptable: boolean;
  reason: string;
  blurScore: number;
  meanLuma: number;
  width: number;
  height: number;
}> {
  const sizeKB = imageBuffer.length / 1024;
  if (sizeKB < QUALITY.minSizKB) {
    return { acceptable: false, reason: 'image_too_small', blurScore: 0, meanLuma: 0, width: 0, height: 0 };
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(imageBuffer).metadata();
  } catch {
    return { acceptable: false, reason: 'unreadable_image', blurScore: 0, meanLuma: 0, width: 0, height: 0 };
  }

  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < QUALITY.minResolution || h < QUALITY.minResolution) {
    return { acceptable: false, reason: 'insufficient_resolution', blurScore: 0, meanLuma: 0, width: w, height: h };
  }

  // Compute mean luma and approximate blur (Laplacian variance on grayscale)
  const { data, info } = await sharp(imageBuffer)
    .resize(256, 256, { fit: 'inside' })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const gw = info.width;
  const gh = info.height;
  const N = gw * gh;

  let sumL = 0;
  for (let i = 0; i < N; i++) sumL += data[i];
  const meanLuma = sumL / N;

  if (meanLuma < QUALITY.darkLumaThreshold) {
    return { acceptable: false, reason: 'image_too_dark', blurScore: 0, meanLuma, width: w, height: h };
  }
  if (meanLuma > QUALITY.brightLumaThreshold) {
    return { acceptable: false, reason: 'image_overexposed', blurScore: 0, meanLuma, width: w, height: h };
  }

  // Laplacian variance (blur score): sum of |center - avg of 4 neighbors|^2
  let lapSum = 0;
  let lapCount = 0;
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const idx = y * gw + x;
      const lap = (
        4 * data[idx]
        - data[idx - 1]
        - data[idx + 1]
        - data[idx - gw]
        - data[idx + gw]
      );
      lapSum += lap * lap;
      lapCount++;
    }
  }
  const blurScore = lapCount > 0 ? lapSum / lapCount : 0;

  if (blurScore < QUALITY.blurThreshold) {
    return { acceptable: false, reason: 'image_too_blurry', blurScore, meanLuma, width: w, height: h };
  }

  return { acceptable: true, reason: 'ok', blurScore, meanLuma, width: w, height: h };
}

// ══════════════════════════════════════════════════════════════════════════════
// FEATURE EXTRACTION  (matches train_new_pipeline.py extract_features() exactly)
// ══════════════════════════════════════════════════════════════════════════════

export async function extractBiomarkerFeatures(imageBuffer: Buffer): Promise<DFUFeatureResult> {
  const { data, info } = await sharp(imageBuffer)
    .resize(PATCH_SIZE, PATCH_SIZE, { fit: 'fill' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = width * height;

  const rArr   = new Float32Array(pixels);
  const gArr   = new Float32Array(pixels);
  const bArr   = new Float32Array(pixels);
  const lumaArr = new Float32Array(pixels);
  const rawSkin = new Uint8Array(pixels);
  const isSkin  = new Uint8Array(pixels);

  for (let i = 0, p = 0; i < data.length; i += 3, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    rArr[p] = r;
    gArr[p] = g;
    bArr[p] = b;
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    lumaArr[p] = luma;
    if (r > g * 0.78 && r > b * 0.78 && luma > 40 && luma < 248 && r > 50) {
      rawSkin[p] = 1;
    }
  }

  // 4-neighbor morphological erosion
  let erodedCount = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (
        rawSkin[idx]         === 1 &&
        rawSkin[idx - 1]     === 1 &&
        rawSkin[idx + 1]     === 1 &&
        rawSkin[idx - width] === 1 &&
        rawSkin[idx + width] === 1
      ) {
        isSkin[idx] = 1;
        erodedCount++;
      }
    }
  }

  // Choose mask
  let rawSkinCount = 0;
  for (let p = 0; p < pixels; p++) rawSkinCount += rawSkin[p];
  const useRaw = erodedCount < 200;
  if (useRaw && rawSkinCount < 200) {
    // Fallback: use all pixels
    for (let p = 0; p < pixels; p++) isSkin[p] = 1;
  } else if (useRaw) {
    for (let p = 0; p < pixels; p++) isSkin[p] = rawSkin[p];
  }

  // --- Skin pixel statistics ---
  let sumR = 0, sumG = 0, sumB = 0;
  let sumR2 = 0, sumG2 = 0, sumB2 = 0;
  let sumLuma = 0, sumLuma2 = 0;
  let sumRedness = 0, sumNri = 0, sumExr = 0;
  let validSkin = 0;
  const hist = new Uint32Array(256);

  for (let p = 0; p < pixels; p++) {
    if (isSkin[p] === 1) {
      const r = rArr[p], g = gArr[p], b = bArr[p], luma = lumaArr[p];
      sumR += r; sumG += g; sumB += b;
      sumR2 += r * r; sumG2 += g * g; sumB2 += b * b;
      sumLuma += luma; sumLuma2 += luma * luma;
      sumRedness += r / (g + b + 10.0);
      sumNri += (r - g) / (r + g + 10.0);
      sumExr += (2 * r - g - b) / 255.0;
      hist[Math.min(255, Math.max(0, Math.round(luma)))]++;
      validSkin++;
    }
  }

  const N = Math.max(validSkin, 1);
  const meanR = (sumR / N) / 255.0;
  const meanG = (sumG / N) / 255.0;
  const meanB = (sumB / N) / 255.0;
  const stdR  = Math.sqrt(Math.max(0, sumR2 / N - Math.pow(sumR / N, 2))) / 255.0;
  const stdG  = Math.sqrt(Math.max(0, sumG2 / N - Math.pow(sumG / N, 2))) / 255.0;
  const stdB  = Math.sqrt(Math.max(0, sumB2 / N - Math.pow(sumB / N, 2))) / 255.0;
  const meanLuma = (sumLuma / N) / 255.0;
  const stdLuma  = Math.sqrt(Math.max(0, sumLuma2 / N - Math.pow(sumLuma / N, 2))) / 255.0;
  const rednessRatio = sumRedness / N;
  const nri = sumNri / N;
  const exr = sumExr / N;

  // Percentile contrast (P95 - P5)
  const c5 = Math.floor(N * 0.05);
  const c95 = Math.floor(N * 0.95);
  let acc2 = 0, p5 = 0, p95 = 255;
  for (let l = 0; l < 256; l++) {
    acc2 += hist[l];
    if (p5 === 0 && acc2 >= c5) p5 = l;
    if (acc2 >= c95) { p95 = l; break; }
  }
  const skinContrast = (p95 - p5) / 255.0;

  // Necrotic / ulcer markers
  let darkCount = 0, ulcerCount = 0;
  const darkThresh = Math.max(35, (meanLuma * 255.0) * 0.45);
  for (let p = 0; p < pixels; p++) {
    if (isSkin[p] === 1) {
      if (lumaArr[p] < darkThresh) darkCount++;
      if (rArr[p] > 1.25 * (gArr[p] + bArr[p] + 5.0)) ulcerCount++;
    }
  }
  const darkInSkin    = darkCount  / N;
  const ulcerRedSpots = ulcerCount / N;

  // Block texture + hotspot
  const blockVars: number[] = [];
  let peakBlockVar = 0, peakX = 50, peakY = 50;
  for (let by = 0; by < height; by += 16) {
    for (let bx = 0; bx < width; bx += 16) {
      let bSum = 0, bSum2 = 0, bPix = 0;
      for (let y = by; y < Math.min(by + 16, height); y++) {
        for (let x = bx; x < Math.min(bx + 16, width); x++) {
          const idx = y * width + x;
          if (isSkin[idx] === 1) {
            const lum = lumaArr[idx];
            bSum += lum; bSum2 += lum * lum; bPix++;
          }
        }
      }
      if (bPix > 32) {
        const bMean = bSum / bPix;
        const bStd = Math.sqrt(Math.max(0, bSum2 / bPix - bMean * bMean));
        blockVars.push(bStd);
        if (bStd > peakBlockVar) {
          peakBlockVar = bStd;
          peakX = Math.round(((bx + 8) / width) * 100);
          peakY = Math.round(((by + 8) / height) * 100);
        }
      }
    }
  }
  if (blockVars.length === 0) blockVars.push(stdLuma * 255.0);
  const meanBlockVar = (blockVars.reduce((a, b) => a + b, 0) / blockVars.length) / 255.0;
  const maxBlockVar  = Math.max(...blockVars) / 255.0;

  // Gradients
  let sGX = 0, sGY = 0, sGX2 = 0, sGY2 = 0, gC = 0;
  for (let y = 0; y < height - 1; y++) {
    for (let x = 0; x < width - 1; x++) {
      const idx = y * width + x;
      if (isSkin[idx] === 1 && isSkin[idx + 1] === 1 && isSkin[idx + width] === 1) {
        const gx = Math.abs(lumaArr[idx + 1] - lumaArr[idx]);
        const gy = Math.abs(lumaArr[idx + width] - lumaArr[idx]);
        sGX += gx; sGX2 += gx * gx;
        sGY += gy; sGY2 += gy * gy;
        gC++;
      }
    }
  }
  const GC = Math.max(gC, 1);
  const mGX = sGX / GC, mGY = sGY / GC;
  const edgeEnergy = (mGX + mGY) / 255.0;
  const edgeStd = (
    Math.sqrt(Math.max(0, sGX2 / GC - mGX * mGX)) +
    Math.sqrt(Math.max(0, sGY2 / GC - mGY * mGY))
  ) / 255.0;

  // Center diff
  const ch1 = Math.floor(height / 4), ch2 = Math.floor(3 * height / 4);
  const cw1 = Math.floor(width / 4),  cw2 = Math.floor(3 * width / 4);
  let cSumLuma = 0, cPix = 0;
  for (let y = ch1; y < ch2; y++) {
    for (let x = cw1; x < cw2; x++) {
      const idx = y * width + x;
      if (isSkin[idx] === 1) { cSumLuma += lumaArr[idx]; cPix++; }
    }
  }
  const centerMean = cPix > 30 ? (cSumLuma / cPix) / 255.0 : meanLuma;
  const centerDiff = Math.abs(centerMean - meanLuma);

  return {
    features: [
      meanR, meanG, meanB, stdR, stdG, stdB,
      meanLuma, stdLuma, rednessRatio, nri, exr,
      skinContrast, darkInSkin, ulcerRedSpots,
      edgeEnergy, edgeStd, meanBlockVar, maxBlockVar,
      centerDiff
    ],
    hotspotX: peakX,
    hotspotY: peakY,
    maxBlockVariance: maxBlockVar
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// GBDT INFERENCE
// ══════════════════════════════════════════════════════════════════════════════

function predictTree(tree: DecisionTree, features: number[]): number {
  let node = 0;
  while (tree.children_left[node] !== -1) {
    const featIdx = tree.feature[node];
    if (features[featIdx] <= tree.threshold[node]) {
      node = tree.children_left[node];
    } else {
      node = tree.children_right[node];
    }
  }
  return tree.value[node];
}

export function predictGBDT(features: number[], m: GBDTModel): { probAbnormal: number; probNormal: number } {
  let raw = m.initValue;
  for (const tree of m.trees) {
    raw += m.learningRate * predictTree(tree, features);
  }
  const probAbnormal = 1 / (1 + Math.exp(-raw));
  return { probAbnormal, probNormal: 1 - probAbnormal };
}

// ══════════════════════════════════════════════════════════════════════════════
// SKIN FRACTION ASSESSMENT  (determines if a patch has enough skin)
// ══════════════════════════════════════════════════════════════════════════════

function computeSkinFraction(data: Buffer): number {
  const n = data.length / 3;
  let skinCount = 0;
  for (let i = 0, p = 0; i < data.length; i += 3, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    if (r > g * 0.78 && r > b * 0.78 && luma > 40 && luma < 248 && r > 50) {
      skinCount++;
    }
  }
  return skinCount / Math.max(n, 1);
}

// ══════════════════════════════════════════════════════════════════════════════
// PATCH-TILING INFERENCE FOR FULL-FOOT IMAGES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * For a full-foot camera image, extract overlapping tiles and classify each.
 * Aggregation: mean probability across valid (skin-containing) patches.
 *
 * This is a research prototype approach.
 * It does NOT convert the patch dataset into a clinically validated full-foot model.
 */
async function runPatchTilingInference(imageBuffer: Buffer): Promise<{
  probAbnormal: number;
  hotspotX: number;
  hotspotY: number;
  patchesAnalyzed: number;
  patchProbabilities: number[];
}> {
  if (!model) throw new Error('Model not loaded');

  // Resize full image to workable size while preserving aspect
  const resized = await sharp(imageBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
    .removeAlpha()
    .toBuffer();

  const fullMeta = await sharp(resized).metadata();
  const fullW = fullMeta.width ?? 512;
  const fullH = fullMeta.height ?? 512;

  const validProbs: number[] = [];
  let bestProbAbnormal = -1;
  let bestHotX = 50, bestHotY = 50;

  const stride = TILE_STRIDE;
  const tileSize = PATCH_SIZE;

  for (let ty = 0; ty + tileSize <= fullH; ty += stride) {
    for (let tx = 0; tx + tileSize <= fullW; tx += stride) {
      try {
        // Extract raw tile pixels for skin check
        const rawTile = await sharp(resized)
          .extract({ left: tx, top: ty, width: tileSize, height: tileSize })
          .raw()
          .toBuffer();

        const skinFrac = computeSkinFraction(rawTile);
        if (skinFrac < MIN_SKIN_FRACTION) continue; // Skip non-skin patches

        // Get the tile as JPEG buffer for feature extraction
        const tileBuf = await sharp(resized)
          .extract({ left: tx, top: ty, width: tileSize, height: tileSize })
          .jpeg({ quality: 95 })
          .toBuffer();

        const { features } = await extractBiomarkerFeatures(tileBuf);
        const { probAbnormal } = predictGBDT(features, model);

        validProbs.push(probAbnormal);

        // Track the patch with highest abnormal probability for hotspot
        if (probAbnormal > bestProbAbnormal) {
          bestProbAbnormal = probAbnormal;
          bestHotX = Math.round(((tx + tileSize / 2) / fullW) * 100);
          bestHotY = Math.round(((ty + tileSize / 2) / fullH) * 100);
        }
      } catch {
        // Skip unprocessable tiles
      }
    }
  }

  if (validProbs.length === 0) {
    // No valid patches found; fall back to whole-image classification
    const { features, hotspotX, hotspotY } = await extractBiomarkerFeatures(imageBuffer);
    const { probAbnormal } = predictGBDT(features, model);
    return { probAbnormal, hotspotX, hotspotY, patchesAnalyzed: 1, patchProbabilities: [probAbnormal] };
  }

  // Aggregation: weighted-mean (higher-risk patches weighted more).
  // This is more clinically conservative than a plain mean — a single high-risk
  // patch should elevate the overall score more than a plain average would allow.
  // Weight = exp(3 * p) so that patches near p=1.0 contribute ~exp(3)≈20× more
  // than patches near p=0.0.  The denominator normalises back to [0,1].
  let weightedSum = 0;
  let weightTotal = 0;
  for (const p of validProbs) {
    const w = Math.exp(3 * p);
    weightedSum += w * p;
    weightTotal += w;
  }
  const aggregatedProb = weightTotal > 0 ? weightedSum / weightTotal : 0.5;

  return {
    probAbnormal: aggregatedProb,
    hotspotX: bestHotX,
    hotspotY: bestHotY,
    patchesAnalyzed: validProbs.length,
    patchProbabilities: validProbs
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// MODEL LOADING
// ══════════════════════════════════════════════════════════════════════════════

export async function initDFUClassifier(): Promise<void> {
  if (model || modelLoading) return;
  modelLoading = true;

  if (fs.existsSync(MODEL_CACHE_PATH)) {
    try {
      const cached = JSON.parse(fs.readFileSync(MODEL_CACHE_PATH, 'utf8')) as GBDTModel;
      if (
        cached.version === CLASSIFIER_VERSION &&
        Array.isArray(cached.trees) &&
        cached.trees.length > 0
      ) {
        model = cached;
        // ── Threshold sanity check ─────────────────────────────────────────
        // The model may have been trained with a threshold calibrated purely on
        // training data, sometimes producing values very close to 1.0 (e.g.
        // 0.9878) with uncertainHigh=1.0 — making ABNORMAL unreachable since
        // sigmoid outputs never actually reach 1.0.  We fix this at load time:
        //   • If threshold > UNCERTAIN_HIGH_CAP, reset to DEFAULT_THRESHOLD.
        //   • If uncertainHigh > UNCERTAIN_HIGH_CAP, cap it.
        if ((model.threshold ?? 0) > UNCERTAIN_HIGH_CAP) {
          console.warn(
            `[DFU Classifier v8] Stored threshold=${model.threshold?.toFixed(4)} is ` +
            `degenerate (>UNCERTAIN_HIGH_CAP=${UNCERTAIN_HIGH_CAP}). ` +
            `Resetting to safe default (${DEFAULT_THRESHOLD}).`
          );
          model.threshold = DEFAULT_THRESHOLD;
          model.uncertainLow  = DEFAULT_THRESHOLD - DEFAULT_UNCERTAIN_HALF;
          model.uncertainHigh = DEFAULT_THRESHOLD + DEFAULT_UNCERTAIN_HALF;
        } else if ((model.uncertainHigh ?? 1) > UNCERTAIN_HIGH_CAP) {
          model.uncertainHigh = Math.min(model.uncertainHigh ?? 1, UNCERTAIN_HIGH_CAP);
        }
        const thresh = model.threshold ?? DEFAULT_THRESHOLD;
        console.log(
          `[DFU Classifier v8] Loaded model | ` +
          `acc=${(model.metrics.accuracy * 100).toFixed(1)}% | ` +
          `threshold=${thresh.toFixed(4)} | ` +
          `uncertainZone=[${(model.uncertainLow ?? thresh - DEFAULT_UNCERTAIN_HALF).toFixed(3)},` +
          `${(model.uncertainHigh ?? thresh + DEFAULT_UNCERTAIN_HALF).toFixed(3)}] | ` +
          `trees=${model.trees.length}`
        );
        modelLoading = false;
        return;
      } else {
        console.warn(
          `[DFU Classifier] Cached model version mismatch. ` +
          `Got v${cached.version}, expected v${CLASSIFIER_VERSION}. ` +
          `Please run: python train_new_pipeline.py`
        );
      }
    } catch (e) {
      console.warn('[DFU Classifier] Cache read error:', e);
    }
  } else {
    console.warn(`[DFU Classifier] No model cache found at ${MODEL_CACHE_PATH}. ` +
      `Please run: python train_new_pipeline.py`);
  }

  modelLoading = false;
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PREDICTION  (used by server.ts /api/predict)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Run DFU prediction on the given base64 image.
 *
 * Strategy:
 *   1. Image quality check
 *   2. If image is large (likely full-foot camera), use patch-tiling inference
 *   3. If image is small (likely a cropped patch), use direct classification
 *   4. Apply calibrated threshold → NORMAL / ABNORMAL / UNCERTAIN
 */
export async function runDFUPrediction(imageBase64: string): Promise<DFUPredictionOutput> {
  if (!model) await initDFUClassifier();

  if (!model) {
    return {
      prediction: 'UNCERTAIN',
      confidence: 0,
      probabilityNormal: 0.5,
      probabilityAbnormal: 0.5,
      isModelReady: false,
      hotspotX: 50,
      hotspotY: 50,
      qualityIssue: 'model_not_loaded'
    };
  }

  // Decode base64
  let buffer: Buffer;
  if (imageBase64.includes('image/svg+xml')) {
    const decoded = decodeURIComponent(imageBase64.replace(/^data:image\/svg\+xml;[^,]*,/, ''));
    buffer = Buffer.from(decoded, 'utf8');
  } else {
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z0-9+-]+;base64,/, '').replace(/\s/g, '');
    buffer = Buffer.from(base64Clean, 'base64');
  }

  // ── Quality check ─────────────────────────────────────────────────────────
  const quality = await checkImageQuality(buffer);
  if (!quality.acceptable) {
    return {
      prediction: 'UNCERTAIN',
      confidence: 0,
      probabilityNormal: 0.5,
      probabilityAbnormal: 0.5,
      isModelReady: true,
      hotspotX: 50,
      hotspotY: 50,
      qualityIssue: quality.reason
    };
  }

  // ── Decide inference strategy ──────────────────────────────────────────────
  // If the image is large (> 2× the training patch size), use tiling.
  const isLargeImage = quality.width > PATCH_SIZE * 2 || quality.height > PATCH_SIZE * 2;

  let probAbnormal: number;
  let hotspotX = 50;
  let hotspotY = 50;
  let patchesAnalyzed = 1;
  let patchProbabilities: number[] = [];

  if (isLargeImage) {
    // Full-foot image → patch tiling inference
    const tileResult = await runPatchTilingInference(buffer);
    probAbnormal      = tileResult.probAbnormal;
    hotspotX          = tileResult.hotspotX;
    hotspotY          = tileResult.hotspotY;
    patchesAnalyzed   = tileResult.patchesAnalyzed;
    patchProbabilities = tileResult.patchProbabilities;
  } else {
    // Small image (likely already a patch) → direct classification
    const { features, hotspotX: hx, hotspotY: hy } = await extractBiomarkerFeatures(buffer);
    const result = predictGBDT(features, model);
    probAbnormal = result.probAbnormal;
    hotspotX = hx;
    hotspotY = hy;
    patchProbabilities = [probAbnormal];
  }

  const probNormal = 1 - probAbnormal;

  // ── Threshold-based decision ───────────────────────────────────────────────
  // Apply a defensive cap: if the calibrated threshold is degenerate (>0.97),
  // fall back to 0.5 here as well (belt-and-suspenders, in addition to the
  // load-time fix in initDFUClassifier).
  const rawThresh = model.threshold ?? DEFAULT_THRESHOLD;
  const thresh = rawThresh > UNCERTAIN_HIGH_CAP ? DEFAULT_THRESHOLD : rawThresh;
  const uncertLow  = thresh - DEFAULT_UNCERTAIN_HALF;
  const uncertHigh = Math.min(thresh + DEFAULT_UNCERTAIN_HALF, UNCERTAIN_HIGH_CAP);

  let prediction: PredictionLabel;
  let confidence: number;

  if (probAbnormal >= uncertHigh) {
    prediction = 'ABNORMAL';
    confidence = probAbnormal;
  } else if (probAbnormal <= uncertLow) {
    prediction = 'NORMAL';
    confidence = probNormal;
  } else {
    // Falls in uncertain zone
    prediction = 'UNCERTAIN';
    confidence = Math.max(probAbnormal, probNormal);
  }

  return {
    prediction,
    confidence: +confidence.toFixed(4),
    probabilityNormal:  +probNormal.toFixed(4),
    probabilityAbnormal: +probAbnormal.toFixed(4),
    isModelReady: true,
    hotspotX,
    hotspotY,
    patchesAnalyzed,
    patchProbabilities,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY
// ══════════════════════════════════════════════════════════════════════════════

export function isDFUModelReady(): boolean {
  return model !== null;
}

export function getDFUModelInfo() {
  if (!model) return null;
  return {
    modelType:    model.modelType,
    trainedOn:    model.trainedOn,
    normalCount:  model.normalCount,
    abnormalCount: model.abnormalCount,
    metrics:      model.metrics,
    version:      model.version,
    threshold:    model.threshold ?? DEFAULT_THRESHOLD,
    uncertainLow:  model.uncertainLow,
    uncertainHigh: model.uncertainHigh,
  };
}
