"""
FootGuard AI — New Clean Training Pipeline v7
==============================================
Dataset  : Patches/Normal(Healthy skin)  &  Patches/Abnormal(Ulcer)
Split    : 70% train | 15% validation | 15% test  (stratified, seed=42)
Features : Same 19 eroded-skin biomarkers already used in dfuClassifier.ts
Model    : GradientBoostingClassifier (GBDT)
Threshold: Calibrated on validation set (Youden index)
Outputs  :
  - dfu_model_cache.json            (replaces old model, loaded by server)
  - models/preprocessing_config.json
  - models/feature_config.json
  - models/classification_report.txt
  - models/metrics.json
  - models/confusion_matrix_data.json
  - models/threshold_report.txt
  - dataset_report.txt

Research prototype. Not a medical diagnostic device.
"""

import os
import sys
import json
import hashlib
import shutil
import random
import numpy as np
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter

# ── scikit-learn imports ───────────────────────────────────────────────────────
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report,
    roc_curve
)

# ── Reproducibility ────────────────────────────────────────────────────────────
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(os.getcwd())
PATCHES_DIR = BASE_DIR / 'Patches'
NORMAL_DIR  = PATCHES_DIR / 'Normal(Healthy skin)'
ABNORMAL_DIR = PATCHES_DIR / 'Abnormal(Ulcer)'
MODELS_DIR  = BASE_DIR / 'models'
DATASET_DIR = BASE_DIR / 'dataset'
MODELS_DIR.mkdir(exist_ok=True)
DATASET_DIR.mkdir(exist_ok=True)

# ══════════════════════════════════════════════════════════════════════════════
# 1.  IMAGE PREPROCESSING  (SINGLE CENTRALIZED FUNCTION)
#     Must match dfuClassifier.ts  extract_biomarker_features() exactly.
# ══════════════════════════════════════════════════════════════════════════════
PREPROCESSING_CONFIG = {
    "resize_width": 128,
    "resize_height": 128,
    "resize_method": "BILINEAR",
    "color_mode": "RGB",
    "normalize": True,
    "skin_mask": "eroded_4neighbor",
    "eroded_min_pixels": 200,
    "version": "v7"
}

def preprocess_image(img_or_path):
    """
    Single centralized preprocessing function.
    Used for TRAINING, VALIDATION, TESTING, and INFERENCE.
    Matches dfuClassifier.ts extractBiomarkerFeatures() exactly.
    """
    if isinstance(img_or_path, (str, Path)):
        img = Image.open(img_or_path).convert('RGB').resize(
            (PREPROCESSING_CONFIG['resize_width'],
             PREPROCESSING_CONFIG['resize_height']),
            Image.Resampling.BILINEAR
        )
    elif isinstance(img_or_path, Image.Image):
        img = img_or_path.convert('RGB').resize(
            (PREPROCESSING_CONFIG['resize_width'],
             PREPROCESSING_CONFIG['resize_height']),
            Image.Resampling.BILINEAR
        )
    else:
        raise ValueError("img_or_path must be a path string, Path, or PIL Image")

    return np.array(img, dtype=np.float32)


# ══════════════════════════════════════════════════════════════════════════════
# 2.  FEATURE EXTRACTION  (19-feature eroded-skin biomarkers)
#     Matches dfuClassifier.ts extractBiomarkerFeatures() exactly.
# ══════════════════════════════════════════════════════════════════════════════
FEATURE_NAMES = [
    "mean_r", "mean_g", "mean_b",
    "std_r",  "std_g",  "std_b",
    "mean_luma", "std_luma",
    "redness_ratio", "nri", "exr",
    "skin_contrast",
    "dark_in_skin", "ulcer_red_spots",
    "edge_energy", "edge_std",
    "mean_block_var", "max_block_var",
    "center_diff"
]

FEATURE_CONFIG = {
    "n_features": 19,
    "feature_names": FEATURE_NAMES,
    "description": "19 eroded-skin biomarker features matching dfuClassifier.ts",
    "version": "v7"
}

def extract_features(arr):
    """
    Extract 19 clinical biomarker features from a preprocessed (128x128x3) float32 array.
    Must be called AFTER preprocess_image().
    """
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b

    # Raw skin mask
    raw_skin = (r > g * 0.78) & (r > b * 0.78) & (luma > 40) & (luma < 248) & (r > 50)

    # 4-neighbor morphological erosion (eliminates edge noise)
    eroded = np.zeros_like(raw_skin)
    eroded[1:-1, 1:-1] = (
        raw_skin[1:-1, 1:-1] &
        raw_skin[:-2,  1:-1] &
        raw_skin[2:,   1:-1] &
        raw_skin[1:-1, :-2] &
        raw_skin[1:-1, 2:]
    )

    if np.sum(eroded) >= PREPROCESSING_CONFIG['eroded_min_pixels']:
        skin_mask = eroded
    elif np.sum(raw_skin) >= PREPROCESSING_CONFIG['eroded_min_pixels']:
        skin_mask = raw_skin
    else:
        skin_mask = np.ones_like(luma, dtype=bool)

    r_s  = r[skin_mask]
    g_s  = g[skin_mask]
    b_s  = b[skin_mask]
    lu_s = luma[skin_mask]

    # 1. Color distributions
    mean_r = float(np.mean(r_s) / 255.0)
    mean_g = float(np.mean(g_s) / 255.0)
    mean_b = float(np.mean(b_s) / 255.0)
    std_r  = float(np.std(r_s)  / 255.0)
    std_g  = float(np.std(g_s)  / 255.0)
    std_b  = float(np.std(b_s)  / 255.0)

    # 2. Luminance
    mean_luma = float(np.mean(lu_s) / 255.0)
    std_luma  = float(np.std(lu_s)  / 255.0)

    # 3. Erythema / redness indices
    redness_ratio = float(np.mean(r_s / (g_s + b_s + 10.0)))
    nri           = float(np.mean((r_s - g_s) / (r_s + g_s + 10.0)))
    exr           = float(np.mean((2 * r_s - g_s - b_s) / 255.0))

    # 4. Percentile contrast (P95 - P5)
    p95           = float(np.percentile(lu_s, 95))
    p5            = float(np.percentile(lu_s, 5))
    skin_contrast = float((p95 - p5) / 255.0)

    # 5. Necrotic dark tissue & ulcer granulation spots
    dark_thresh      = max(35.0, mean_luma * 255.0 * 0.45)
    dark_in_skin     = float(np.mean(lu_s < dark_thresh))
    ulcer_red_spots  = float(np.mean(r_s > 1.25 * (g_s + b_s + 5.0)))

    # 6. Gradients across skin
    h, w = arr.shape[:2]
    grad_x = np.abs(luma[:, 1:] - luma[:, :-1])
    grad_y = np.abs(luma[1:, :] - luma[:-1, :])
    skin_mask_x = skin_mask[:, 1:] & skin_mask[:, :-1]
    skin_mask_y = skin_mask[1:, :] & skin_mask[:-1, :]
    grad_x_s = grad_x[skin_mask_x] if np.sum(skin_mask_x) > 50 else grad_x.ravel()
    grad_y_s = grad_y[skin_mask_y] if np.sum(skin_mask_y) > 50 else grad_y.ravel()
    edge_energy = float((np.mean(grad_x_s) + np.mean(grad_y_s)) / 255.0)
    edge_std    = float((np.std(grad_x_s)  + np.std(grad_y_s))  / 255.0)

    # 7. Block texture heterogeneity (16x16)
    block_vars = []
    for by in range(0, h, 16):
        for bx in range(0, w, 16):
            blk_mask = skin_mask[by:by+16, bx:bx+16]
            if np.sum(blk_mask) > 32:
                blk = luma[by:by+16, bx:bx+16][blk_mask]
                block_vars.append(np.std(blk))
    if not block_vars:
        block_vars = [np.std(lu_s)]
    mean_block_var = float(np.mean(block_vars) / 255.0)
    max_block_var  = float(np.max(block_vars)  / 255.0)

    # 8. Center-to-skin luminance difference
    ch1, ch2 = h // 4, 3 * h // 4
    cw1, cw2 = w // 4, 3 * w // 4
    center_mask = skin_mask[ch1:ch2, cw1:cw2]
    if np.sum(center_mask) > 50:
        center_luma = luma[ch1:ch2, cw1:cw2][center_mask]
        center_mean = float(np.mean(center_luma) / 255.0)
    else:
        center_mean = mean_luma
    center_diff = float(abs(center_mean - mean_luma))

    return [
        mean_r,  mean_g,  mean_b,
        std_r,   std_g,   std_b,
        mean_luma, std_luma,
        redness_ratio, nri, exr,
        skin_contrast,
        dark_in_skin, ulcer_red_spots,
        edge_energy, edge_std,
        mean_block_var, max_block_var,
        center_diff
    ]


def extract_features_from_path(p):
    arr = preprocess_image(p)
    return extract_features(arr)


# ══════════════════════════════════════════════════════════════════════════════
# 3.  REALISTIC AUGMENTATION  (applied only inside training folds)
# ══════════════════════════════════════════════════════════════════════════════
def augment_image(img):
    """
    Generate realistic augmented variants.
    No aggressive distortions that would create unrealistic medical images.
    """
    augs = []
    # Flips (preserves skin/ulcer appearance)
    augs.append(img.transpose(Image.FLIP_LEFT_RIGHT))
    augs.append(img.transpose(Image.FLIP_TOP_BOTTOM))
    # Rotations (minor)
    augs.append(img.transpose(Image.ROTATE_90))
    augs.append(img.transpose(Image.ROTATE_180))
    augs.append(img.transpose(Image.ROTATE_270))
    # Brightness ±10% (simulate lighting variation)
    augs.append(ImageEnhance.Brightness(img).enhance(1.10))
    augs.append(ImageEnhance.Brightness(img).enhance(0.90))
    # Contrast ±10% (simulate camera settings)
    augs.append(ImageEnhance.Contrast(img).enhance(1.10))
    augs.append(ImageEnhance.Contrast(img).enhance(0.90))
    return augs


def augment_from_path(path):
    img = Image.open(path).convert('RGB')
    return augment_image(img)


# ══════════════════════════════════════════════════════════════════════════════
# 4.  IMAGE INTEGRITY CHECK
# ══════════════════════════════════════════════════════════════════════════════
def check_image_integrity(path):
    """Returns (ok: bool, reason: str)"""
    try:
        img = Image.open(path)
        img.verify()
        return True, "ok"
    except Exception as e:
        return False, str(e)


def file_md5(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(65536), b''):
            h.update(chunk)
    return h.hexdigest()


# ══════════════════════════════════════════════════════════════════════════════
# 5.  DATASET LOADING & SPLIT
# ══════════════════════════════════════════════════════════════════════════════
def load_and_split_dataset():
    """
    Load all images from Patches/, verify integrity, check for duplicates,
    then split 70/15/15 with stratification and seed=42.
    """
    print("=" * 65)
    print("  FootGuard AI — Dataset Loading & Validation")
    print("=" * 65)

    exts = {'.jpg', '.jpeg', '.png', '.bmp', '.webp'}

    def gather(d, label):
        files = sorted([
            str(d / f)
            for f in d.iterdir()
            if f.suffix.lower() in exts and f.is_file()
        ])
        return [(p, label) for p in files]

    normal_raw   = gather(NORMAL_DIR,   0)
    abnormal_raw = gather(ABNORMAL_DIR, 1)

    print(f"\nRaw images found:")
    print(f"  Normal(Healthy skin): {len(normal_raw)}")
    print(f"  Abnormal(Ulcer):      {len(abnormal_raw)}")

    # Integrity check
    corrupted = 0
    good = []
    for path, label in normal_raw + abnormal_raw:
        ok, reason = check_image_integrity(path)
        if ok:
            good.append((path, label))
        else:
            corrupted += 1
            print(f"  [CORRUPTED] {path}: {reason}")

    # Duplicate detection
    seen_hashes = {}
    duplicates  = 0
    deduped = []
    for path, label in good:
        h = file_md5(path)
        if h in seen_hashes:
            duplicates += 1
            print(f"  [DUPLICATE] {path} == {seen_hashes[h]}")
        else:
            seen_hashes[h] = path
            deduped.append((path, label))

    normal_final   = [(p, l) for p, l in deduped if l == 0]
    abnormal_final = [(p, l) for p, l in deduped if l == 1]
    total = len(deduped)

    print(f"\nAfter integrity check:")
    print(f"  Corrupted images:   {corrupted}")
    print(f"  Duplicate images:   {duplicates}")
    print(f"  Normal (label=0):   {len(normal_final)}")
    print(f"  Abnormal (label=1): {len(abnormal_final)}")
    print(f"  Total valid:        {total}")

    # Deterministic shuffle then stratified split 70/15/15
    def stratified_split(items, train_r=0.70, val_r=0.15):
        rng = np.random.default_rng(RANDOM_SEED)
        arr = np.array(items, dtype=object)
        rng.shuffle(arr)
        n = len(arr)
        t = int(n * train_r)
        v = int(n * val_r)
        return arr[:t].tolist(), arr[t:t+v].tolist(), arr[t+v:].tolist()

    n_train, n_val, n_test = stratified_split(normal_final)
    a_train, a_val, a_test = stratified_split(abnormal_final)

    train_items = n_train + a_train
    val_items   = n_val   + a_val
    test_items  = n_test  + a_test

    rng = np.random.default_rng(RANDOM_SEED)
    for lst in [train_items, val_items, test_items]:
        rng.shuffle(lst)

    print(f"\nDataset split (70/15/15, seed={RANDOM_SEED}):")
    print(f"  Train:      {len(train_items)}  "
          f"(Normal={sum(l==0 for _,l in train_items)}, "
          f"Abnormal={sum(l==1 for _,l in train_items)})")
    print(f"  Validation: {len(val_items)}  "
          f"(Normal={sum(l==0 for _,l in val_items)}, "
          f"Abnormal={sum(l==1 for _,l in val_items)})")
    print(f"  Test:       {len(test_items)}  "
          f"(Normal={sum(l==0 for _,l in test_items)}, "
          f"Abnormal={sum(l==1 for _,l in test_items)})")

    # Save dataset report
    report = {
        "total_normal": len(normal_final),
        "total_abnormal": len(abnormal_final),
        "total_valid": total,
        "corrupted": corrupted,
        "duplicates": duplicates,
        "train_normal":     sum(l==0 for _,l in train_items),
        "train_abnormal":   sum(l==1 for _,l in train_items),
        "train_total":      len(train_items),
        "val_normal":       sum(l==0 for _,l in val_items),
        "val_abnormal":     sum(l==1 for _,l in val_items),
        "val_total":        len(val_items),
        "test_normal":      sum(l==0 for _,l in test_items),
        "test_abnormal":    sum(l==1 for _,l in test_items),
        "test_total":       len(test_items),
        "split_ratio":      "70/15/15",
        "random_seed":      RANDOM_SEED
    }
    with open(BASE_DIR / 'dataset_report.txt', 'w') as f:
        f.write("FootGuard AI — Dataset Report\n")
        f.write("=" * 40 + "\n")
        for k, v in report.items():
            f.write(f"{k}: {v}\n")

    return train_items, val_items, test_items, report


# ══════════════════════════════════════════════════════════════════════════════
# 6.  FEATURE MATRIX BUILDING
# ══════════════════════════════════════════════════════════════════════════════
def build_feature_matrix(items, augment=False, desc=""):
    """
    Extract features from all items.
    If augment=True, apply augmentation for training items only.
    """
    X, y = [], []
    n = len(items)
    for i, (path, label) in enumerate(items):
        if (i + 1) % 50 == 0 or i == n - 1:
            print(f"  [{desc}] {i+1}/{n} images processed...", end='\r')
        try:
            feats = extract_features_from_path(path)
            X.append(feats)
            y.append(label)
            if augment:
                for aug_img in augment_from_path(path):
                    arr = preprocess_image(aug_img)
                    X.append(extract_features(arr))
                    y.append(label)
        except Exception as e:
            print(f"\n  [WARN] Skipped {path}: {e}")
    print()
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ══════════════════════════════════════════════════════════════════════════════
# 7.  THRESHOLD CALIBRATION  (Youden's J on validation set)
# ══════════════════════════════════════════════════════════════════════════════
def calibrate_threshold(y_val, prob_val):
    """
    Find the optimal classification threshold using Youden's J statistic
    on the validation set.
    J = Sensitivity + Specificity - 1  (maximizes both)
    """
    fpr, tpr, thresholds = roc_curve(y_val, prob_val)
    j_scores = tpr - fpr  # Youden's J
    best_idx = int(np.argmax(j_scores))
    best_thresh = float(thresholds[best_idx])
    best_j = float(j_scores[best_idx])
    sensitivity = float(tpr[best_idx])
    specificity  = float(1 - fpr[best_idx])
    roc_auc_val  = float(roc_auc_score(y_val, prob_val))

    print(f"\n--- Threshold Calibration (Youden's J on Validation Set) ---")
    print(f"  ROC-AUC:     {roc_auc_val * 100:.2f}%")
    print(f"  Best Thresh: {best_thresh:.4f}")
    print(f"  Youden's J:  {best_j:.4f}")
    print(f"  Sensitivity: {sensitivity * 100:.1f}%")
    print(f"  Specificity: {specificity * 100:.1f}%")

    # UNCERTAIN zone: threshold ± 0.10 (configurable)
    uncertain_low  = max(0.30, best_thresh - 0.10)
    uncertain_high = min(0.70, best_thresh + 0.10)

    report = {
        "optimal_threshold": best_thresh,
        "uncertain_low":  uncertain_low,
        "uncertain_high": uncertain_high,
        "youden_j":       best_j,
        "sensitivity":    sensitivity,
        "specificity":    specificity,
        "roc_auc":        roc_auc_val,
        "method": "Youden's J on validation set"
    }

    with open(MODELS_DIR / 'threshold_report.txt', 'w') as f:
        f.write("FootGuard AI — Threshold Calibration Report\n")
        f.write("=" * 50 + "\n")
        f.write(f"Method:           Youden's J statistic on Validation Set\n")
        f.write(f"Optimal threshold: {best_thresh:.4f}\n")
        f.write(f"Uncertain zone:    [{uncertain_low:.4f}, {uncertain_high:.4f}]\n")
        f.write(f"Youden's J:        {best_j:.4f}\n")
        f.write(f"Sensitivity (TPR): {sensitivity*100:.1f}%\n")
        f.write(f"Specificity (TNR): {specificity*100:.1f}%\n")
        f.write(f"ROC-AUC:           {roc_auc_val*100:.2f}%\n")
        f.write(f"\nIMPORTANT: Threshold is selected to maximize Youden's J\n")
        f.write(f"(= Sensitivity + Specificity - 1) on the validation split.\n")
        f.write(f"It is NOT chosen to bias predictions toward either class.\n")

    return best_thresh, uncertain_low, uncertain_high, report


# ══════════════════════════════════════════════════════════════════════════════
# 8.  FULL EVALUATION
# ══════════════════════════════════════════════════════════════════════════════
def evaluate(clf, X, y, thresh, split_name):
    probs = clf.predict_proba(X)[:, 1]
    preds = (probs >= thresh).astype(int)

    acc    = accuracy_score(y, preds)
    prec   = precision_score(y, preds, zero_division=0)
    rec    = recall_score(y, preds, zero_division=0)
    f1     = f1_score(y, preds, zero_division=0)
    cm     = confusion_matrix(y, preds)
    tn, fp, fn, tp = cm.ravel()
    spec   = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    auc    = roc_auc_score(y, probs) if len(np.unique(y)) > 1 else float('nan')
    report = classification_report(y, preds, target_names=['Normal', 'Abnormal'])

    print(f"\n{'='*55}")
    print(f"  Evaluation — {split_name}")
    print(f"{'='*55}")
    print(f"  Accuracy:    {acc*100:.2f}%")
    print(f"  Precision:   {prec*100:.2f}%")
    print(f"  Recall (TPR):{rec*100:.2f}%")
    print(f"  Specificity: {spec*100:.2f}%")
    print(f"  F1-Score:    {f1*100:.2f}%")
    print(f"  ROC-AUC:     {auc*100:.2f}%" if not np.isnan(auc) else "  ROC-AUC: N/A")
    print(f"  Confusion Matrix:")
    print(f"               Pred Normal   Pred Abnormal")
    print(f"  True Normal      {tn:<13} {fp}")
    print(f"  True Abnormal    {fn:<13} {tp}")
    print(f"\n  Classification Report:")
    print(report)

    return {
        "split": split_name,
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "specificity": float(spec),
        "f1": float(f1),
        "roc_auc": float(auc) if not np.isnan(auc) else None,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "threshold_used": thresh,
        "classification_report": report
    }


# ══════════════════════════════════════════════════════════════════════════════
# 9.  EXPORT MODEL TO JSON  (for dfuClassifier.ts)
# ══════════════════════════════════════════════════════════════════════════════
def export_model_json(clf, thresh, uncertain_low, uncertain_high,
                      dataset_report, val_metrics, test_metrics,
                      X_train_shape):
    trees = []
    for est in clf.estimators_:
        tree = est[0].tree_
        trees.append({
            "children_left":  tree.children_left.tolist(),
            "children_right": tree.children_right.tolist(),
            "feature":        tree.feature.tolist(),
            "threshold":      [float(t) for t in tree.threshold],
            "value":          [float(v[0][0]) for v in tree.value]
        })

    y_mean = clf.init_.class_prior_[1] if hasattr(clf.init_, 'class_prior_') else 0.5
    if hasattr(clf.init_, 'prior'):
        init_val = float(clf.init_.prior)
    else:
        init_val = float(np.log(y_mean / (1.0 - y_mean + 1e-9)))

    model_json = {
        "version":       7,
        "modelType":     "GradientBoostingClassifier_ErodedMask_v7_NewPipeline",
        "learningRate":  float(clf.learning_rate),
        "initValue":     init_val,
        "featureNames":  FEATURE_NAMES,
        "trees":         trees,
        "trainedOn":     int(X_train_shape[0]),
        "normalCount":   int(dataset_report['total_normal']),
        "abnormalCount": int(dataset_report['total_abnormal']),
        "threshold":     float(thresh),
        "uncertainLow":  float(uncertain_low),
        "uncertainHigh": float(uncertain_high),
        "metrics": {
            "accuracy":      val_metrics['accuracy'],
            "precision":     val_metrics['precision'],
            "recall":        val_metrics['recall'],
            "f1Score":       val_metrics['f1'],
            "rocAuc":        val_metrics['roc_auc'],
            "recallNormal":  val_metrics['specificity'],
            "recallAbnormal":val_metrics['recall'],
            "specificity":   val_metrics['specificity'],
            "thresholdCalibration": "Youden's J on validation set",
        },
        "testMetrics": {
            "accuracy":  test_metrics['accuracy'],
            "f1Score":   test_metrics['f1'],
            "rocAuc":    test_metrics['roc_auc'],
        },
        "datasetReport": dataset_report,
        "prototype_disclaimer": (
            "FootGuard AI is a preliminary research prototype for image-based "
            "screening awareness. It is not a medical diagnostic device and "
            "should not replace professional medical evaluation."
        )
    }

    cache_path = BASE_DIR / 'dfu_model_cache.json'
    with open(cache_path, 'w') as f:
        json.dump(model_json, f)
    print(f"\n[OK] Model exported to: {cache_path}")

    return model_json


# ══════════════════════════════════════════════════════════════════════════════
# 10. MAIN TRAINING PIPELINE
# ══════════════════════════════════════════════════════════════════════════════
def main():
    print("\n" + "=" * 65)
    print("  FootGuard AI — New Clean Training Pipeline v7")
    print("  Research Prototype. Not a Medical Device.")
    print("=" * 65 + "\n")

    # Verify dataset paths
    if not NORMAL_DIR.exists() or not ABNORMAL_DIR.exists():
        print(f"ERROR: Dataset directories not found!")
        print(f"  Expected: {NORMAL_DIR}")
        print(f"  Expected: {ABNORMAL_DIR}")
        sys.exit(1)

    # ── Step 1: Load and split dataset ───────────────────────────────────────
    train_items, val_items, test_items, dataset_report = load_and_split_dataset()

    # ── Step 2: Extract features ─────────────────────────────────────────────
    print("\n[Step 2] Extracting features from training set (with augmentation)...")
    X_train_aug, y_train_aug = build_feature_matrix(train_items, augment=True, desc="Train")
    print(f"  Augmented training samples: {len(X_train_aug)} "
          f"(Normal={sum(y_train_aug==0)}, Abnormal={sum(y_train_aug==1)})")

    print("\n[Step 3] Extracting features from validation set (NO augmentation)...")
    X_val, y_val = build_feature_matrix(val_items, augment=False, desc="Val")

    print("\n[Step 4] Extracting features from test set (NO augmentation)...")
    X_test, y_test = build_feature_matrix(test_items, augment=False, desc="Test")

    # ── Step 3: Cross-validation on original (non-augmented) training data ───
    print("\n[Step 5] 5-Fold Cross-Validation on original training images (no augmentation)...")
    X_train_orig, y_train_orig = build_feature_matrix(train_items, augment=False, desc="CV")

    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    cv_y_true, cv_y_pred_05, cv_y_prob = [], [], []

    for fold, (tr_idx, vl_idx) in enumerate(skf.split(X_train_orig, y_train_orig), 1):
        Xf_tr, Xf_vl = X_train_orig[tr_idx], X_train_orig[vl_idx]
        yf_tr, yf_vl = y_train_orig[tr_idx], y_train_orig[vl_idx]

        # Build fold training with augmentation
        Xf_aug, yf_aug = [], list(yf_tr)
        for path_arr in Xf_tr:
            Xf_aug.append(path_arr)
        # Note: for CV we use already-extracted features; apply augmentation would
        # require re-running on images. For a quick CV we use raw features.
        Xf_aug = np.array(Xf_aug, dtype=np.float32)
        yf_aug = np.array(yf_aug, dtype=np.int32)

        clf_fold = GradientBoostingClassifier(
            n_estimators=150, max_depth=4,
            learning_rate=0.08, subsample=0.85,
            min_samples_leaf=5, random_state=RANDOM_SEED
        )
        clf_fold.fit(Xf_aug, yf_aug)
        probs_f = clf_fold.predict_proba(Xf_vl)[:, 1]
        preds_f = (probs_f >= 0.5).astype(int)

        cv_y_true.extend(yf_vl)
        cv_y_pred_05.extend(preds_f)
        cv_y_prob.extend(probs_f)
        fold_acc = accuracy_score(yf_vl, preds_f)
        print(f"  Fold {fold}: Acc={fold_acc*100:.1f}%")

    cv_acc = accuracy_score(cv_y_true, cv_y_pred_05)
    cv_auc = roc_auc_score(cv_y_true, cv_y_prob)
    print(f"  5-Fold CV Accuracy: {cv_acc*100:.2f}% | AUC: {cv_auc*100:.2f}%")

    # ── Step 4: Train final model on full augmented training set ─────────────
    print("\n[Step 6] Training final model on full augmented training set...")
    final_clf = GradientBoostingClassifier(
        n_estimators=150, max_depth=4,
        learning_rate=0.08, subsample=0.85,
        min_samples_leaf=5, random_state=RANDOM_SEED
    )
    final_clf.fit(X_train_aug, y_train_aug)
    print("  Training complete.")

    # ── Step 5: Threshold calibration on validation set ───────────────────────
    print("\n[Step 7] Calibrating classification threshold on validation set...")
    val_probs = final_clf.predict_proba(X_val)[:, 1]
    thresh, uncertain_low, uncertain_high, thresh_report = calibrate_threshold(y_val, val_probs)

    # ── Step 6: Evaluation ────────────────────────────────────────────────────
    val_metrics  = evaluate(final_clf, X_val,  y_val,  thresh, "Validation Set")
    test_metrics = evaluate(final_clf, X_test, y_test, thresh, "Test Set")

    # ── Step 7: Save artifacts ────────────────────────────────────────────────
    # Preprocessing config
    with open(MODELS_DIR / 'preprocessing_config.json', 'w') as f:
        json.dump(PREPROCESSING_CONFIG, f, indent=2)

    # Feature config
    with open(MODELS_DIR / 'feature_config.json', 'w') as f:
        json.dump(FEATURE_CONFIG, f, indent=2)

    # Classification report
    with open(MODELS_DIR / 'classification_report.txt', 'w') as f:
        f.write(f"FootGuard AI — Classification Report (Test Set)\n")
        f.write("=" * 55 + "\n")
        f.write(f"Threshold used: {thresh:.4f} (Youden's J on validation)\n\n")
        f.write(test_metrics['classification_report'])

    # Metrics JSON
    all_metrics = {
        "validation": val_metrics,
        "test": test_metrics,
        "cv_accuracy": float(cv_acc),
        "cv_auc": float(cv_auc),
        "threshold": thresh_report,
        "dataset": dataset_report
    }
    with open(MODELS_DIR / 'metrics.json', 'w') as f:
        json.dump(all_metrics, f, indent=2)

    # Confusion matrix data
    cm_data = {
        "validation": val_metrics['confusion_matrix'],
        "test": test_metrics['confusion_matrix'],
        "labels": ["Normal", "Abnormal"]
    }
    with open(MODELS_DIR / 'confusion_matrix_data.json', 'w') as f:
        json.dump(cm_data, f, indent=2)

    # ── Step 8: Export model JSON ─────────────────────────────────────────────
    print("\n[Step 8] Exporting model to dfu_model_cache.json...")
    model_json = export_model_json(
        final_clf, thresh, uncertain_low, uncertain_high,
        dataset_report, val_metrics, test_metrics,
        X_train_aug.shape
    )

    print("\n" + "=" * 65)
    print("  TRAINING COMPLETE")
    print("=" * 65)
    print(f"  Dataset:        Normal={dataset_report['total_normal']}, "
          f"Abnormal={dataset_report['total_abnormal']}")
    print(f"  Train:          {dataset_report['train_total']} (augmented to {len(X_train_aug)})")
    print(f"  Validation:     {dataset_report['val_total']}")
    print(f"  Test:           {dataset_report['test_total']}")
    print(f"  Threshold:      {thresh:.4f}")
    print(f"  Uncertain zone: [{uncertain_low:.4f}, {uncertain_high:.4f}]")
    print(f"\n  Validation Metrics:")
    print(f"    Accuracy:    {val_metrics['accuracy']*100:.2f}%")
    print(f"    F1-Score:    {val_metrics['f1']*100:.2f}%")
    print(f"    ROC-AUC:     {(val_metrics['roc_auc'] or 0)*100:.2f}%")
    print(f"    Sensitivity: {val_metrics['recall']*100:.2f}%")
    print(f"    Specificity: {val_metrics['specificity']*100:.2f}%")
    print(f"\n  Test Metrics:")
    print(f"    Accuracy:    {test_metrics['accuracy']*100:.2f}%")
    print(f"    F1-Score:    {test_metrics['f1']*100:.2f}%")
    print(f"    ROC-AUC:     {(test_metrics['roc_auc'] or 0)*100:.2f}%")
    print(f"\n  Model saved to: dfu_model_cache.json")
    print(f"  Artifacts in:   models/")
    print("=" * 65 + "\n")


if __name__ == '__main__':
    main()
