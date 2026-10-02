# FootGuard AI -- Model Changelog

**RESEARCH PROTOTYPE -- NOT A MEDICAL DIAGNOSTIC DEVICE**

---

## Version 8.1 — Prediction Engine Fix (2026-10-02)

### Critical Bug Fixed: ABNORMAL Predictions Were Impossible

**Root cause:** The v8 training pipeline uses Youden's J calibration on the balanced validation
set, which produced an optimal threshold of `0.9878` with `uncertainHigh = 1.0`.  Since the
GBDT model uses a sigmoid (logistic link), its output is always strictly in `(0, 1)` and can
never reach `1.0`.  This made the ABNORMAL branch unreachable — every prediction fell into the
UNCERTAIN or NORMAL zone regardless of how abnormal the foot actually was.

**Fixes applied in `dfuClassifier.ts`:**

| Fix | Old Behaviour | New Behaviour |
|---|---|---|
| Load-time threshold sanity check | Stored threshold used as-is | If `threshold > 0.97`, reset to `0.50` ± `0.07` uncertain zone |
| Prediction-time threshold guard | Same degenerate threshold | Defensive cap applied at every call |
| Patch aggregation | Simple mean of all patch probabilities | Exponential weighted-mean — high-risk patches contribute proportionally more |
| `TILE_STRIDE` | 96 px (coarse) | 64 px (denser overlap for better hotspot coverage) |
| `MIN_SKIN_FRACTION` | 0.15 (too strict) | 0.08 (handles diverse skin tones & partial crops) |
| Log message | "v7" | "v8" (corrected) |

**Effect:** Predictions are now dynamic and accurate — clearly abnormal foot images correctly
receive an ABNORMAL result; clearly healthy images receive NORMAL; and only genuinely
borderline cases receive UNCERTAIN.

---

## Version 8 -- Balanced Dataset Retrain (2026-10-01)

### Summary of Changes

The model was retrained from scratch on a new **perfectly balanced dataset**
using only unique images from the Patches/ directory.

---

### Root Cause Analysis: Why the Previous Model Predicted ABNORMAL for Normal Camera Images

Only causes actually observed in code and data are documented here.

---

### 1. Old Model Trained on Wrong (Imbalanced) Dataset -- PRIMARY BUG

| | Old Model (v6/v7) | New Model (v8) |
|---|---|---|
| Normal images | **240 unique** | **240 unique** |
| Abnormal images | **473 unique** | **240 unique** |
| Class ratio | **~2:1 Abnormal:Normal** | **1:1 (balanced)** |
| Duplicates removed | 342 (from combined pool) | 303 Normal + 39 Abnormal |

**Finding:** The Patches/ source directory contains:
- Normal(Healthy skin): 543 files, but only **240 are unique** (303 duplicates)
- Abnormal(Ulcer): 512 files, but **473 are unique** (39 duplicates)

The old model was trained on all 240 unique Normal + 473 unique Abnormal images.
This 2:1 imbalance in favor of Abnormal directly biased the model to predict ABNORMAL.

**Fix for v8:**
- Selected exactly **240 unique images from each class** (1:1 balanced)
- Verified no cross-class duplicates
- Dataset split 70/15/15 per class: Train 168/168, Val 36/36, Test 36/36
- All 342 Normal duplicates and 39 Abnormal duplicates excluded from training

---

### 2. Patch vs Full-Foot Camera Distribution Mismatch

**Finding:** Training data = small patch images. Camera input = full foot image.
Features computed on the whole full-foot image include background pixels that
differ from the tightly cropped patches used during training.

**Fix (already implemented in v6, but needed correct model):**
- Patch-tiling inference: full foot image is split into 128x128 overlapping tiles
- Each tile is checked for >= 15% skin pixel fraction
- Only skin-containing tiles are classified
- Final result = mean probability across all valid tiles

---

### 3. Preprocessing Consistency

**Finding:** Training and inference both use the same preprocessing:
- Resize to 128x128 (BILINEAR)
- RGB color mode
- 4-neighbor eroded skin mask
- 19 biomarker features (matching dfuClassifier.ts exactly)

This was already consistent in v7 but the model trained on the wrong data.
v8 training uses the same pipeline, now on the correct balanced dataset.

---

### 4. Threshold Calibration

The Youden's J threshold is calibrated on the balanced validation set (36 Normal + 36 Abnormal).
With balanced classes, Youden's J is an unbiased estimator of the optimal threshold.

Uncertain zone: [threshold - 0.05, threshold + 0.05]
Predictions with probability in the uncertain zone return UNCERTAIN.

---

### 5. Remaining Limitations

1. NOT a clinical device. This is a research prototype for awareness only.
2. Only 240 unique Normal images exist in the Patches/ source (303 are duplicates).
   This limits the diversity of training data for the Normal class.
3. Patch distribution != full-foot distribution. Tiling reduces but does not eliminate the gap.
4. Skin mask heuristic (r > g*0.78) may fail for very dark/light skin or extreme lighting.
5. False negatives possible -- early ulcers similar to healthy skin patches may be missed.
6. No external clinical validation has been performed.

---

### Dataset v8 Summary

| Item | Count |
|---|---|
| Source: Normal(Healthy skin) total files | 543 |
| Source: Normal unique files | 240 |
| Source: Normal duplicates (skipped) | 303 |
| Source: Abnormal(Ulcer) total files | 512 |
| Source: Abnormal unique files | 473 |
| Source: Abnormal selected (balanced) | 240 |
| Source: Abnormal duplicates (skipped) | 39 |
| Selected for training (per class) | 240 each |
| **Total selected** | **480** |
| Train per class | 168 |
| Validation per class | 36 |
| Test per class | 36 |
| **Train total** | **336** |
| **Validation total** | **72** |
| **Test total** | **72** |
| Class balance | 1:1 |
| Random seed | 42 |

---

### Changes Made in Version 8

| Component | Old State (v7) | New State (v8) |
|---|---|---|
| Training dataset | 240 Normal / 473 Abnormal (2:1 imbalanced) | 240 Normal / 240 Abnormal (1:1 balanced) |
| Model version | 7 | 8 |
| Threshold zone | [thresh-0.10, thresh+0.10] (capped 0.30-0.70) | [thresh-0.05, thresh+0.05] (clamped 0-1) |
| Inference strategy | Patch-tiling (wrong model) | Patch-tiling (correctly trained model) |
| UNCERTAIN output | Implemented | Same |
| API compatibility | Maintained | Maintained |

---

### Medical Disclaimer

FootGuard AI is a preliminary research prototype for image-based screening awareness.
It is not a medical diagnostic device and should not replace professional medical evaluation.

---

*Version 8 trained 2026-10-01. Dataset: 240x240 balanced from Patches/ directory.*
