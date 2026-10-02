"""
FootGuard AI -- Balanced Dataset v8 Training Pipeline
======================================================
Dataset source : Patches/Normal(Healthy skin)  (543 images, some duplicates)
                 Patches/Abnormal(Ulcer)        (512 images, some duplicates)

Selection rule : Pick exactly 240 UNIQUE images from each class.
                 Uniqueness is determined by MD5 hash (file content).

Balanced total : 240 Normal  +  240 Abnormal  = 480 images

Split (per class, deterministic seed=42):
    Train      : 168  Normal + 168  Abnormal = 336
    Validation :  36  Normal +  36  Abnormal =  72
    Test       :  36  Normal +  36  Abnormal =  72

Creates:
    dataset_balanced/
        train/normal/        train/abnormal/
        validation/normal/   validation/abnormal/
        test/normal/         test/abnormal/

Outputs:
    dataset_balanced_report.txt
    dfu_model_cache.json          (replaces existing model -- loaded by server.ts)
    models/preprocessing_config.json
    models/feature_config.json
    models/classification_report.txt
    models/metrics.json
    models/confusion_matrix_data.json
    models/threshold_report.txt

RESEARCH PROTOTYPE -- NOT A MEDICAL DIAGNOSTIC DEVICE.
"""

import os
import sys
import json
import shutil
import hashlib
import random
import numpy as np
from pathlib import Path
from PIL import Image, ImageEnhance

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report, roc_curve
)

# ---------------------------------------------------------------------------
# Reproducibility
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR      = Path(os.getcwd())
PATCHES_DIR   = BASE_DIR / "Patches"
NORMAL_SRC    = PATCHES_DIR / "Normal(Healthy skin)"
ABNORMAL_SRC  = PATCHES_DIR / "Abnormal(Ulcer)"
BALANCED_DIR  = BASE_DIR / "dataset_balanced"
MODELS_DIR    = BASE_DIR / "models"
MODELS_DIR.mkdir(exist_ok=True)

IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# ---------------------------------------------------------------------------
# Target counts (as specified)
# ---------------------------------------------------------------------------
TARGET_PER_CLASS  = 240   # unique images to select from each class
TRAIN_PER_CLASS   = 168
VAL_PER_CLASS     = 36
TEST_PER_CLASS    = 36
assert TRAIN_PER_CLASS + VAL_PER_CLASS + TEST_PER_CLASS == TARGET_PER_CLASS

# ---------------------------------------------------------------------------
# Preprocessing config (must match dfuClassifier.ts exactly)
# ---------------------------------------------------------------------------
PREPROCESSING_CONFIG = {
    "resize_width":        128,
    "resize_height":       128,
    "resize_method":       "BILINEAR",
    "color_mode":          "RGB",
    "normalize":           True,
    "skin_mask":           "eroded_4neighbor",
    "eroded_min_pixels":   200,
    "version":             "v8"
}

FEATURE_NAMES = [
    "mean_r",    "mean_g",    "mean_b",
    "std_r",     "std_g",     "std_b",
    "mean_luma", "std_luma",
    "redness_ratio", "nri", "exr",
    "skin_contrast",
    "dark_in_skin", "ulcer_red_spots",
    "edge_energy", "edge_std",
    "mean_block_var", "max_block_var",
    "center_diff"
]

FEATURE_CONFIG = {
    "n_features":    19,
    "feature_names": FEATURE_NAMES,
    "description":   "19 eroded-skin biomarker features matching dfuClassifier.ts v8",
    "version":       "v8"
}


# ===========================================================================
# STEP 1 -- UNIQUE IMAGE SELECTION
# ===========================================================================

def md5_of_file(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def select_unique_images(source_dir: Path, n: int, label_name: str):
    """
    Scan source_dir for image files.
    De-duplicate by MD5 hash.
    Randomly select exactly n unique images (deterministic seed).
    Returns list of Path objects (length == n).
    Raises ValueError if fewer than n unique images are available.
    """
    all_files = sorted([
        f for f in source_dir.iterdir()
        if f.suffix.lower() in IMAGE_EXTS and f.is_file()
    ])

    print(f"  [{label_name}] Scanning {len(all_files)} files for duplicates...")
    seen_hashes: dict = {}
    unique: list = []
    dup_count = 0
    for fpath in all_files:
        h = md5_of_file(fpath)
        if h not in seen_hashes:
            seen_hashes[h] = fpath
            unique.append(fpath)
        else:
            dup_count += 1

    print(f"  [{label_name}] Unique: {len(unique)}  |  Duplicates skipped: {dup_count}")

    if len(unique) < n:
        raise ValueError(
            f"[{label_name}] Only {len(unique)} unique images available; "
            f"need {n}. Cannot proceed."
        )

    # Deterministic shuffle then take first n
    rng = np.random.default_rng(RANDOM_SEED)
    indices = rng.permutation(len(unique)).tolist()
    selected = [unique[i] for i in indices[:n]]
    return selected, dup_count


def create_balanced_dataset():
    """
    Create dataset_balanced/ with train/val/test splits.
    Returns split metadata.
    """
    print("\n" + "=" * 65)
    print("  STEP 1 -- Creating Balanced Dataset")
    print("=" * 65)

    if BALANCED_DIR.exists():
        print(f"  Removing existing {BALANCED_DIR} ...")
        shutil.rmtree(BALANCED_DIR)

    # Select unique images
    normal_selected, normal_dups   = select_unique_images(NORMAL_SRC,   TARGET_PER_CLASS, "Normal")
    abnormal_selected, abnormal_dups = select_unique_images(ABNORMAL_SRC, TARGET_PER_CLASS, "Abnormal")

    print(f"\n  Selected: {len(normal_selected)} Normal  +  {len(abnormal_selected)} Abnormal")

    # Deterministic split per class
    rng = np.random.default_rng(RANDOM_SEED)

    def split_list(lst):
        arr = list(lst)
        rng.shuffle(arr)  # in-place shuffle
        train = arr[:TRAIN_PER_CLASS]
        val   = arr[TRAIN_PER_CLASS: TRAIN_PER_CLASS + VAL_PER_CLASS]
        test  = arr[TRAIN_PER_CLASS + VAL_PER_CLASS:]
        return train, val, test

    n_train, n_val, n_test = split_list(normal_selected)
    a_train, a_val, a_test = split_list(abnormal_selected)

    # Verify no overlap between splits (within class)
    for cls_name, tr, va, te in [("Normal", n_train, n_val, n_test),
                                   ("Abnormal", a_train, a_val, a_test)]:
        all_paths = set(str(p) for p in tr + va + te)
        assert len(all_paths) == TARGET_PER_CLASS, \
            f"[{cls_name}] Overlap detected between splits!"

    # Cross-class duplicate check (same file in both classes)
    normal_set   = set(str(p) for p in normal_selected)
    abnormal_set = set(str(p) for p in abnormal_selected)
    cross_dups = normal_set & abnormal_set
    assert len(cross_dups) == 0, f"Cross-class duplicates found: {cross_dups}"

    # Copy files into dataset_balanced/
    def copy_split(files, split_name, class_name):
        dest = BALANCED_DIR / split_name / class_name
        dest.mkdir(parents=True, exist_ok=True)
        for fpath in files:
            shutil.copy2(fpath, dest / fpath.name)

    print("\n  Copying files to dataset_balanced/ ...")
    copy_split(n_train, "train",      "normal")
    copy_split(n_val,   "validation", "normal")
    copy_split(n_test,  "test",       "normal")
    copy_split(a_train, "train",      "abnormal")
    copy_split(a_val,   "validation", "abnormal")
    copy_split(a_test,  "test",       "abnormal")

    split_info = {
        "source_normal_total":   543,
        "source_abnormal_total": 512,
        "normal_duplicates_in_source":   normal_dups,
        "abnormal_duplicates_in_source": abnormal_dups,
        "selected_normal":    TARGET_PER_CLASS,
        "selected_abnormal":  TARGET_PER_CLASS,
        "total_selected":     TARGET_PER_CLASS * 2,
        "train_normal":   TRAIN_PER_CLASS,
        "train_abnormal": TRAIN_PER_CLASS,
        "train_total":    TRAIN_PER_CLASS * 2,
        "val_normal":     VAL_PER_CLASS,
        "val_abnormal":   VAL_PER_CLASS,
        "val_total":      VAL_PER_CLASS * 2,
        "test_normal":    TEST_PER_CLASS,
        "test_abnormal":  TEST_PER_CLASS,
        "test_total":     TEST_PER_CLASS * 2,
        "split_ratio":    "70/15/15",
        "random_seed":    RANDOM_SEED,
        "class_balance":  "1:1 (perfectly balanced)",
        "cross_class_duplicates": 0,
    }

    print(f"\n  Train:      {split_info['train_total']}  "
          f"(Normal={TRAIN_PER_CLASS}, Abnormal={TRAIN_PER_CLASS})")
    print(f"  Validation: {split_info['val_total']}  "
          f"(Normal={VAL_PER_CLASS}, Abnormal={VAL_PER_CLASS})")
    print(f"  Test:       {split_info['test_total']}  "
          f"(Normal={TEST_PER_CLASS}, Abnormal={TEST_PER_CLASS})")

    return split_info, n_train + a_train, n_val + a_val, n_test + a_test


# ===========================================================================
# STEP 2 -- PREPROCESSING  (matches dfuClassifier.ts extractBiomarkerFeatures)
# ===========================================================================

def preprocess_image(img_or_path):
    """
    Single centralized preprocessing.
    Matches dfuClassifier.ts extractBiomarkerFeatures() resize step exactly.
    """
    W = PREPROCESSING_CONFIG["resize_width"]
    H = PREPROCESSING_CONFIG["resize_height"]
    if isinstance(img_or_path, (str, Path)):
        img = Image.open(img_or_path).convert("RGB").resize((W, H), Image.Resampling.BILINEAR)
    elif isinstance(img_or_path, Image.Image):
        img = img_or_path.convert("RGB").resize((W, H), Image.Resampling.BILINEAR)
    else:
        raise ValueError("Unsupported input type")
    return np.array(img, dtype=np.float32)


# ===========================================================================
# STEP 3 -- FEATURE EXTRACTION  (19 eroded-skin biomarkers)
# ===========================================================================

def extract_features(arr: np.ndarray) -> list:
    """
    Extract 19 clinical biomarker features from a preprocessed (128x128x3) float32 array.
    Must match dfuClassifier.ts extractBiomarkerFeatures() exactly.
    """
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b

    # Raw skin mask
    raw_skin = (r > g * 0.78) & (r > b * 0.78) & (luma > 40) & (luma < 248) & (r > 50)

    # 4-neighbor morphological erosion
    eroded = np.zeros_like(raw_skin)
    eroded[1:-1, 1:-1] = (
        raw_skin[1:-1, 1:-1] &
        raw_skin[:-2,  1:-1] &
        raw_skin[2:,   1:-1] &
        raw_skin[1:-1, :-2]  &
        raw_skin[1:-1, 2:]
    )

    min_px = PREPROCESSING_CONFIG["eroded_min_pixels"]
    if np.sum(eroded) >= min_px:
        skin = eroded
    elif np.sum(raw_skin) >= min_px:
        skin = raw_skin
    else:
        skin = np.ones_like(luma, dtype=bool)

    r_s  = r[skin];  g_s = g[skin];  b_s = b[skin];  lu_s = luma[skin]

    # 1. Color means & stds
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

    # 4. Percentile contrast
    skin_contrast = float((np.percentile(lu_s, 95) - np.percentile(lu_s, 5)) / 255.0)

    # 5. Dark tissue & ulcer spots
    dark_thresh    = max(35.0, mean_luma * 255.0 * 0.45)
    dark_in_skin   = float(np.mean(lu_s < dark_thresh))
    ulcer_red_spots = float(np.mean(r_s > 1.25 * (g_s + b_s + 5.0)))

    # 6. Gradients across skin pixels
    h, w = arr.shape[:2]
    grad_x = np.abs(luma[:, 1:] - luma[:, :-1])
    grad_y = np.abs(luma[1:, :] - luma[:-1, :])
    mx = skin[:, 1:] & skin[:, :-1]
    my = skin[1:, :] & skin[:-1, :]
    gx = grad_x[mx] if np.sum(mx) > 50 else grad_x.ravel()
    gy = grad_y[my] if np.sum(my) > 50 else grad_y.ravel()
    edge_energy = float((np.mean(gx) + np.mean(gy)) / 255.0)
    edge_std    = float((np.std(gx)  + np.std(gy))  / 255.0)

    # 7. Block texture (16x16)
    bvars = []
    for by in range(0, h, 16):
        for bx in range(0, w, 16):
            bm = skin[by:by+16, bx:bx+16]
            if np.sum(bm) > 32:
                bvars.append(np.std(luma[by:by+16, bx:bx+16][bm]))
    if not bvars:
        bvars = [np.std(lu_s)]
    mean_block_var = float(np.mean(bvars) / 255.0)
    max_block_var  = float(np.max(bvars)  / 255.0)

    # 8. Center-to-skin luminance diff
    ch1, ch2 = h // 4, 3 * h // 4
    cw1, cw2 = w // 4, 3 * w // 4
    cm = skin[ch1:ch2, cw1:cw2]
    center_mean = float(np.mean(luma[ch1:ch2, cw1:cw2][cm]) / 255.0) if np.sum(cm) > 50 else mean_luma
    center_diff = float(abs(center_mean - mean_luma))

    return [
        mean_r,   mean_g,   mean_b,
        std_r,    std_g,    std_b,
        mean_luma, std_luma,
        redness_ratio, nri, exr,
        skin_contrast,
        dark_in_skin, ulcer_red_spots,
        edge_energy, edge_std,
        mean_block_var, max_block_var,
        center_diff
    ]


def extract_features_from_path(p: Path) -> list:
    return extract_features(preprocess_image(p))


# ===========================================================================
# STEP 4 -- AUGMENTATION  (realistic only, training set only)
# ===========================================================================

def augment_image(img: Image.Image) -> list:
    """
    9 realistic augmented variants per image.
    No aggressive distortions.
    """
    augs = []
    augs.append(img.transpose(Image.FLIP_LEFT_RIGHT))
    augs.append(img.transpose(Image.FLIP_TOP_BOTTOM))
    augs.append(img.transpose(Image.ROTATE_90))
    augs.append(img.transpose(Image.ROTATE_180))
    augs.append(img.transpose(Image.ROTATE_270))
    augs.append(ImageEnhance.Brightness(img).enhance(1.10))
    augs.append(ImageEnhance.Brightness(img).enhance(0.90))
    augs.append(ImageEnhance.Contrast(img).enhance(1.10))
    augs.append(ImageEnhance.Contrast(img).enhance(0.90))
    return augs


# ===========================================================================
# STEP 5 -- FEATURE MATRIX BUILDING
# ===========================================================================

def build_feature_matrix(items: list, augment: bool = False, desc: str = ""):
    """
    items: list of (Path, label) where label in {0, 1}
    augment: if True, apply augmentation (training set only)
    """
    X, y = [], []
    n = len(items)
    for i, (fpath, label) in enumerate(items):
        if (i + 1) % 50 == 0 or i == n - 1:
            print(f"  [{desc}] {i+1}/{n} processed...", end="\r")
        try:
            feats = extract_features_from_path(fpath)
            X.append(feats);  y.append(label)
            if augment:
                img = Image.open(fpath).convert("RGB")
                for aug in augment_image(img):
                    arr = preprocess_image(aug)
                    X.append(extract_features(arr));  y.append(label)
        except Exception as e:
            print(f"\n  [WARN] Skipped {fpath}: {e}")
    print()
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ===========================================================================
# STEP 6 -- THRESHOLD CALIBRATION (Youden's J)
# ===========================================================================

def calibrate_threshold(y_val, prob_val):
    fpr, tpr, thresholds = roc_curve(y_val, prob_val)
    j       = tpr - fpr
    best    = int(np.argmax(j))
    thresh  = float(thresholds[best])
    sens    = float(tpr[best])
    spec    = float(1 - fpr[best])
    auc     = float(roc_auc_score(y_val, prob_val))

    # Uncertain zone: always thresh - half_width  to  thresh + half_width,
    # clamped to [0, 1], and guaranteed uncert_low < thresh < uncert_high.
    # Use a tighter half-width (0.05) to avoid inversion near boundaries.
    HALF = 0.05
    uncert_low  = max(0.0, thresh - HALF)
    uncert_high = min(1.0, thresh + HALF)
    # Safety guard: ensure ordering
    if uncert_low >= uncert_high:
        uncert_low  = max(0.0, thresh - 0.02)
        uncert_high = min(1.0, thresh + 0.02)

    print(f"\n--- Threshold Calibration (Youden's J on Validation Set) ---")
    print(f"  ROC-AUC:     {auc*100:.2f}%")
    print(f"  Best Thresh: {thresh:.4f}")
    print(f"  Youden's J:  {j[best]:.4f}")
    print(f"  Sensitivity: {sens*100:.1f}%")
    print(f"  Specificity: {spec*100:.1f}%")
    print(f"  Uncertain zone: [{uncert_low:.4f}, {uncert_high:.4f}]")

    report = {
        "optimal_threshold": thresh,
        "uncertain_low":  uncert_low,
        "uncertain_high": uncert_high,
        "youden_j":   float(j[best]),
        "sensitivity": sens,
        "specificity": spec,
        "roc_auc":    auc,
        "method": "Youden's J on balanced validation set"
    }

    with open(MODELS_DIR / "threshold_report.txt", "w") as f:
        f.write("FootGuard AI -- Threshold Calibration Report (v8)\n")
        f.write("=" * 55 + "\n")
        f.write(f"Method:            Youden's J on Balanced Validation Set\n")
        f.write(f"Optimal threshold: {thresh:.4f}\n")
        f.write(f"Uncertain zone:    [{uncert_low:.4f}, {uncert_high:.4f}]\n")
        f.write(f"Youden's J:        {j[best]:.4f}\n")
        f.write(f"Sensitivity (TPR): {sens*100:.1f}%\n")
        f.write(f"Specificity (TNR): {spec*100:.1f}%\n")
        f.write(f"ROC-AUC:           {auc*100:.2f}%\n")
        f.write(f"\nThreshold chosen to maximize Youden's J on balanced val set.\n")
        f.write(f"NOT chosen to bias toward either Normal or Abnormal.\n")

    return thresh, uncert_low, uncert_high, report


# ===========================================================================
# STEP 7 -- EVALUATION
# ===========================================================================

def evaluate(clf, X, y, thresh, split_name):
    probs = clf.predict_proba(X)[:, 1]
    preds = (probs >= thresh).astype(int)
    acc   = float(accuracy_score(y, preds))
    prec  = float(precision_score(y, preds, zero_division=0))
    rec   = float(recall_score(y, preds, zero_division=0))
    f1    = float(f1_score(y, preds, zero_division=0))
    cm    = confusion_matrix(y, preds)
    tn, fp, fn, tp = cm.ravel()
    spec  = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    auc   = float(roc_auc_score(y, probs)) if len(np.unique(y)) > 1 else float("nan")
    rep   = classification_report(y, preds, target_names=["Normal", "Abnormal"])

    print(f"\n{'='*55}")
    print(f"  Evaluation -- {split_name}")
    print(f"{'='*55}")
    print(f"  Accuracy:     {acc*100:.2f}%")
    print(f"  Precision:    {prec*100:.2f}%")
    print(f"  Recall (TPR): {rec*100:.2f}%")
    print(f"  Specificity:  {spec*100:.2f}%")
    print(f"  F1-Score:     {f1*100:.2f}%")
    if not np.isnan(auc):
        print(f"  ROC-AUC:      {auc*100:.2f}%")
    print(f"  Confusion Matrix:")
    print(f"               Pred Normal   Pred Abnormal")
    print(f"  True Normal      {tn:<13} {fp}")
    print(f"  True Abnormal    {fn:<13} {tp}")
    print(f"\n  Classification Report:\n{rep}")

    return {
        "split":       split_name,
        "accuracy":    acc,
        "precision":   prec,
        "recall":      rec,
        "specificity": float(spec),
        "f1":          f1,
        "roc_auc":     float(auc) if not np.isnan(auc) else None,
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
        "threshold_used":      thresh,
        "classification_report": rep
    }


# ===========================================================================
# STEP 8 -- EXPORT MODEL JSON  (consumed by dfuClassifier.ts)
# ===========================================================================

def export_model_json(clf, thresh, uncert_low, uncert_high,
                      split_info, val_m, test_m, n_train_samples):
    trees = []
    for est in clf.estimators_:
        t = est[0].tree_
        trees.append({
            "children_left":  t.children_left.tolist(),
            "children_right": t.children_right.tolist(),
            "feature":        t.feature.tolist(),
            "threshold":      [float(v) for v in t.threshold],
            "value":          [float(v[0][0]) for v in t.value]
        })

    if hasattr(clf.init_, "prior"):
        init_val = float(clf.init_.prior)
    else:
        y_mean = clf.init_.class_prior_[1] if hasattr(clf.init_, "class_prior_") else 0.5
        init_val = float(np.log(y_mean / (1.0 - y_mean + 1e-9)))

    model_json = {
        "version":       8,
        "modelType":     "GradientBoostingClassifier_BalancedV8_240x240",
        "learningRate":  float(clf.learning_rate),
        "initValue":     init_val,
        "featureNames":  FEATURE_NAMES,
        "trees":         trees,
        "trainedOn":     int(n_train_samples),
        "normalCount":   int(split_info["selected_normal"]),
        "abnormalCount": int(split_info["selected_abnormal"]),
        "threshold":     float(thresh),
        "uncertainLow":  float(uncert_low),
        "uncertainHigh": float(uncert_high),
        "metrics": {
            "accuracy":       val_m["accuracy"],
            "precision":      val_m["precision"],
            "recall":         val_m["recall"],
            "f1Score":        val_m["f1"],
            "rocAuc":         val_m["roc_auc"],
            "recallNormal":   val_m["specificity"],
            "recallAbnormal": val_m["recall"],
            "specificity":    val_m["specificity"],
            "thresholdCalibration": "Youden's J on balanced validation set"
        },
        "testMetrics": {
            "accuracy": test_m["accuracy"],
            "f1Score":  test_m["f1"],
            "rocAuc":   test_m["roc_auc"]
        },
        "datasetReport": split_info,
        "prototype_disclaimer": (
            "FootGuard AI is a preliminary research prototype for image-based "
            "screening awareness. It is not a medical diagnostic device and "
            "should not replace professional medical evaluation."
        )
    }

    out = BASE_DIR / "dfu_model_cache.json"
    with open(out, "w") as f:
        json.dump(model_json, f)
    print(f"\n[OK] Model exported --> {out}")
    return model_json


# ===========================================================================
# MAIN
# ===========================================================================

def main():
    print("\n" + "=" * 65)
    print("  FootGuard AI -- Balanced Dataset v8 Training Pipeline")
    print("  Research Prototype. Not a Medical Device.")
    print("=" * 65)

    # Verify source dirs exist
    for d, name in [(NORMAL_SRC, "Patches/Normal(Healthy skin)"),
                    (ABNORMAL_SRC, "Patches/Abnormal(Ulcer)")]:
        if not d.exists():
            print(f"\nERROR: {name} not found at {d}")
            sys.exit(1)

    # ── Step 1: Create balanced dataset ──────────────────────────────────────
    split_info, train_items_raw, val_items_raw, test_items_raw = create_balanced_dataset()

    # Attach labels: items are (Path, label)
    def tag_items(paths_list, n_normal):
        """paths_list is concatenation of [normal_paths] + [abnormal_paths]"""
        return paths_list  # already tagged tuples from create_balanced_dataset()

    # Build labelled tuples from dataset_balanced/
    def load_from_balanced(split_name):
        items = []
        for cls, label in [("normal", 0), ("abnormal", 1)]:
            d = BALANCED_DIR / split_name / cls
            for f in sorted(d.iterdir()):
                if f.suffix.lower() in IMAGE_EXTS:
                    items.append((f, label))
        return items

    train_items = load_from_balanced("train")
    val_items   = load_from_balanced("validation")
    test_items  = load_from_balanced("test")

    print(f"\n  Loaded from dataset_balanced/:")
    print(f"  Train:      {len(train_items)}")
    print(f"  Validation: {len(val_items)}")
    print(f"  Test:       {len(test_items)}")

    # Save dataset balanced report
    with open(BASE_DIR / "dataset_balanced_report.txt", "w", encoding="utf-8") as f:
        f.write("FootGuard AI -- Balanced Dataset Report (v8)\n")
        f.write("=" * 50 + "\n")
        for k, v in split_info.items():
            f.write(f"{k}: {v}\n")
        f.write("\nCLASS BALANCE VERIFICATION:\n")
        f.write(f"  train/normal:       {sum(1 for _, l in train_items if l == 0)}\n")
        f.write(f"  train/abnormal:     {sum(1 for _, l in train_items if l == 1)}\n")
        f.write(f"  validation/normal:  {sum(1 for _, l in val_items if l == 0)}\n")
        f.write(f"  validation/abnormal:{sum(1 for _, l in val_items if l == 1)}\n")
        f.write(f"  test/normal:        {sum(1 for _, l in test_items if l == 0)}\n")
        f.write(f"  test/abnormal:      {sum(1 for _, l in test_items if l == 1)}\n")

    # ── Step 2: Extract features ──────────────────────────────────────────────
    print("\n[Step 2] Extracting features from training set (with augmentation)...")
    X_train, y_train = build_feature_matrix(train_items, augment=True, desc="Train")
    print(f"  Augmented train samples: {len(X_train)} "
          f"(Normal={sum(y_train==0)}, Abnormal={sum(y_train==1)})")

    print("\n[Step 3] Extracting features from validation set (NO augmentation)...")
    X_val, y_val = build_feature_matrix(val_items, augment=False, desc="Val")

    print("\n[Step 4] Extracting features from test set (NO augmentation)...")
    X_test, y_test = build_feature_matrix(test_items, augment=False, desc="Test")

    # ── Step 3: 5-Fold Cross Validation ──────────────────────────────────────
    print("\n[Step 5] 5-Fold CV on original (non-augmented) training images...")
    X_orig, y_orig = build_feature_matrix(train_items, augment=False, desc="CV")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    cv_true, cv_pred, cv_prob = [], [], []
    for fold, (tr_i, vl_i) in enumerate(skf.split(X_orig, y_orig), 1):
        clf_f = GradientBoostingClassifier(
            n_estimators=150, max_depth=4,
            learning_rate=0.08, subsample=0.85,
            min_samples_leaf=5, random_state=RANDOM_SEED
        )
        clf_f.fit(X_orig[tr_i], y_orig[tr_i])
        p = clf_f.predict_proba(X_orig[vl_i])[:, 1]
        cv_true.extend(y_orig[vl_i]);  cv_pred.extend((p >= 0.5).astype(int));  cv_prob.extend(p)
        print(f"  Fold {fold}: Acc={accuracy_score(y_orig[vl_i], (p>=0.5).astype(int))*100:.1f}%")
    cv_acc = float(accuracy_score(cv_true, cv_pred))
    cv_auc = float(roc_auc_score(cv_true, cv_prob))
    print(f"  5-Fold CV Accuracy: {cv_acc*100:.2f}%  |  AUC: {cv_auc*100:.2f}%")

    # ── Step 4: Train final model ─────────────────────────────────────────────
    print("\n[Step 6] Training final GBDT on augmented training set...")
    final_clf = GradientBoostingClassifier(
        n_estimators=150, max_depth=4,
        learning_rate=0.08, subsample=0.85,
        min_samples_leaf=5, random_state=RANDOM_SEED
    )
    final_clf.fit(X_train, y_train)
    print("  Training complete.")

    # ── Step 5: Threshold calibration ────────────────────────────────────────
    print("\n[Step 7] Calibrating threshold on balanced validation set...")
    val_probs = final_clf.predict_proba(X_val)[:, 1]
    thresh, uncert_low, uncert_high, thresh_report = calibrate_threshold(y_val, val_probs)

    # ── Step 6: Evaluation ────────────────────────────────────────────────────
    val_m  = evaluate(final_clf, X_val,  y_val,  thresh, "Validation Set (Balanced)")
    test_m = evaluate(final_clf, X_test, y_test, thresh, "Test Set (Balanced)")

    # ── Step 7: Save config artifacts ─────────────────────────────────────────
    with open(MODELS_DIR / "preprocessing_config.json", "w") as f:
        json.dump(PREPROCESSING_CONFIG, f, indent=2)

    with open(MODELS_DIR / "feature_config.json", "w") as f:
        json.dump(FEATURE_CONFIG, f, indent=2)

    with open(MODELS_DIR / "classification_report.txt", "w", encoding="utf-8") as f:
        f.write("FootGuard AI -- Classification Report (Test Set, Balanced v8)\n")
        f.write("=" * 55 + "\n")
        f.write(f"Threshold used: {thresh:.4f} (Youden's J on balanced val)\n\n")
        f.write(test_m["classification_report"])

    all_metrics = {
        "validation": val_m,
        "test":       test_m,
        "cv_accuracy": cv_acc,
        "cv_auc":      cv_auc,
        "threshold":   thresh_report,
        "dataset":     split_info
    }
    with open(MODELS_DIR / "metrics.json", "w") as f:
        json.dump(all_metrics, f, indent=2)

    cm_data = {
        "validation": val_m["confusion_matrix"],
        "test":       test_m["confusion_matrix"],
        "labels":     ["Normal", "Abnormal"]
    }
    with open(MODELS_DIR / "confusion_matrix_data.json", "w") as f:
        json.dump(cm_data, f, indent=2)

    # ── Step 8: Export model JSON ─────────────────────────────────────────────
    print("\n[Step 8] Exporting model to dfu_model_cache.json ...")
    export_model_json(
        final_clf, thresh, uncert_low, uncert_high,
        split_info, val_m, test_m, len(X_train)
    )

    # ── Final summary ─────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  TRAINING COMPLETE")
    print("=" * 65)
    print(f"  Source dataset:    543 Normal  +  512 Abnormal  (from Patches/)")
    print(f"  Selected (unique): {TARGET_PER_CLASS} Normal  +  {TARGET_PER_CLASS} Abnormal")
    print(f"  Normal dups in source:   {split_info['normal_duplicates_in_source']}")
    print(f"  Abnormal dups in source: {split_info['abnormal_duplicates_in_source']}")
    print(f"  Class balance:     1:1 (perfectly balanced)")
    print(f"")
    print(f"  Train:       {TRAIN_PER_CLASS*2}  (Normal={TRAIN_PER_CLASS}, Abnormal={TRAIN_PER_CLASS})")
    print(f"  Validation:  {VAL_PER_CLASS*2}  (Normal={VAL_PER_CLASS},  Abnormal={VAL_PER_CLASS})")
    print(f"  Test:        {TEST_PER_CLASS*2}  (Normal={TEST_PER_CLASS},  Abnormal={TEST_PER_CLASS})")
    print(f"  (Augmented train: {len(X_train)} samples)")
    print(f"")
    print(f"  5-Fold CV Accuracy: {cv_acc*100:.2f}%  |  AUC: {cv_auc*100:.2f}%")
    print(f"  Threshold:         {thresh:.4f}")
    print(f"  Uncertain zone:    [{uncert_low:.4f}, {uncert_high:.4f}]")
    print(f"")
    print(f"  Validation Metrics:")
    print(f"    Accuracy:    {val_m['accuracy']*100:.2f}%")
    print(f"    F1-Score:    {val_m['f1']*100:.2f}%")
    print(f"    ROC-AUC:     {(val_m['roc_auc'] or 0)*100:.2f}%")
    print(f"    Sensitivity: {val_m['recall']*100:.2f}%")
    print(f"    Specificity: {val_m['specificity']*100:.2f}%")
    print(f"")
    print(f"  Test Metrics:")
    print(f"    Accuracy:    {test_m['accuracy']*100:.2f}%")
    print(f"    F1-Score:    {test_m['f1']*100:.2f}%")
    print(f"    ROC-AUC:     {(test_m['roc_auc'] or 0)*100:.2f}%")
    print(f"    Sensitivity: {test_m['recall']*100:.2f}%")
    print(f"    Specificity: {test_m['specificity']*100:.2f}%")
    print(f"")
    print(f"  Confusion Matrix (Test):")
    cm = test_m["confusion_matrix"]
    print(f"               Pred Normal   Pred Abnormal")
    print(f"  True Normal      {cm['tn']:<13} {cm['fp']}")
    print(f"  True Abnormal    {cm['fn']:<13} {cm['tp']}")
    print(f"")
    print(f"  Model:  dfu_model_cache.json (v8)")
    print(f"  Report: dataset_balanced_report.txt")
    print(f"  Artifacts in: models/")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
