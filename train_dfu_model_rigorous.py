"""
FootGuard AI — Rigorous Clinical DFU Machine Learning Model Training (v6)

Key Principles:
1. Strict No-Leakage Cross-Validation & Validation Split:
   - Augmentation is applied ONLY to the training splits, NEVER to the validation set.
   - Validation set comprises 100% genuine, unaugmented original dataset patches.
2. Explicit Class Mapping:
   - Class 0: 'Normal(Healthy skin)' (54 original images)
   - Class 1: 'Abnormal(Ulcer)' (512 original images)
3. 19 Biomarker Clinical Features with Eroded Skin Masking:
   - Mathematically identical between Python PIL and Node.js Sharp.
4. Balanced Ensemble:
   - Gradient Boosting Classifier trained on balanced folds.
   - Complete confusion matrix, classification report, and ROC-AUC evaluation.
5. Export format matches dfuClassifier.ts JSON schema.
"""

import os
import json
import numpy as np
from PIL import Image, ImageEnhance
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, roc_auc_score, classification_report
)

def extract_features_eroded(img_or_path):
    """
    Extracts 19 clinical biomarker features with 4-neighbor eroded skin mask.
    Matches src/model/dfuClassifier.ts exactly.
    """
    if isinstance(img_or_path, str):
        img = Image.open(img_or_path).convert('RGB').resize((128, 128), Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32)
    elif isinstance(img_or_path, Image.Image):
        img = img_or_path.convert('RGB').resize((128, 128), Image.Resampling.BILINEAR)
        arr = np.array(img, dtype=np.float32)
    else:
        arr = np.array(img_or_path, dtype=np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b

    # Raw skin mask: Human skin tone range
    raw_skin = (r > g * 0.78) & (r > b * 0.78) & (luma > 40) & (luma < 248) & (r > 50)

    # 4-neighbor morphological erosion
    eroded = np.zeros_like(raw_skin)
    eroded[1:-1, 1:-1] = (
        raw_skin[1:-1, 1:-1] &
        raw_skin[:-2, 1:-1] &
        raw_skin[2:, 1:-1] &
        raw_skin[1:-1, :-2] &
        raw_skin[1:-1, 2:]
    )

    skin_mask = eroded if np.sum(eroded) > 200 else raw_skin
    if np.sum(skin_mask) < 200:
        skin_mask = np.ones_like(luma, dtype=bool)

    r_skin = r[skin_mask]
    g_skin = g[skin_mask]
    b_skin = b[skin_mask]
    luma_skin = luma[skin_mask]

    # 1. Intra-skin color distributions (normalized to 0-1)
    mean_r = float(np.mean(r_skin) / 255.0)
    mean_g = float(np.mean(g_skin) / 255.0)
    mean_b = float(np.mean(b_skin) / 255.0)
    std_r = float(np.std(r_skin) / 255.0)
    std_g = float(np.std(g_skin) / 255.0)
    std_b = float(np.std(b_skin) / 255.0)

    # 2. Luminance distributions
    mean_luma = float(np.mean(luma_skin) / 255.0)
    std_luma = float(np.std(luma_skin) / 255.0)

    # 3. Regularized erythema indices (+10.0 regularizer prevents zero division)
    redness_ratio = float(np.mean(r_skin / (g_skin + b_skin + 10.0)))
    nri = float(np.mean((r_skin - g_skin) / (r_skin + g_skin + 10.0)))
    exr = float(np.mean((2 * r_skin - g_skin - b_skin) / 255.0))

    # 4. Percentile contrast (P95 - P5)
    p95 = float(np.percentile(luma_skin, 95))
    p5 = float(np.percentile(luma_skin, 5))
    skin_contrast = float((p95 - p5) / 255.0)

    # 5. Necrotic dark tissue & ulcer granulation spots in skin
    dark_in_skin = float(np.mean(luma_skin < max(35, mean_luma * 255.0 * 0.45)))
    ulcer_red_spots = float(np.mean(r_skin > 1.25 * (g_skin + b_skin + 5.0)))

    # 6. Gradients across skin
    grad_x = np.abs(luma[:, 1:] - luma[:, :-1])
    grad_y = np.abs(luma[1:, :] - luma[:-1, :])
    skin_mask_x = skin_mask[:, 1:] & skin_mask[:, :-1]
    skin_mask_y = skin_mask[1:, :] & skin_mask[:-1, :]

    grad_x_skin = grad_x[skin_mask_x] if np.sum(skin_mask_x) > 50 else grad_x
    grad_y_skin = grad_y[skin_mask_y] if np.sum(skin_mask_y) > 50 else grad_y
    edge_energy = float((np.mean(grad_x_skin) + np.mean(grad_y_skin)) / 255.0)
    edge_std = float((np.std(grad_x_skin) + np.std(grad_y_skin)) / 255.0)

    # 7. Local block texture heterogeneity (16x16 grid within skin)
    h, w = arr.shape[:2]
    block_vars = []
    for by in range(0, h, 16):
        for bx in range(0, w, 16):
            blk_mask = skin_mask[by:by+16, bx:bx+16]
            if np.sum(blk_mask) > 32:
                blk = luma[by:by+16, bx:bx+16][blk_mask]
                block_vars.append(np.std(blk))
    if len(block_vars) == 0:
        block_vars = [np.std(luma_skin)]
    mean_block_var = float(np.mean(block_vars) / 255.0)
    max_block_var = float(np.max(block_vars) / 255.0)

    # 8. Center-to-skin difference
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
        mean_r, mean_g, mean_b, std_r, std_g, std_b,
        mean_luma, std_luma, redness_ratio, nri, exr,
        skin_contrast, dark_in_skin, ulcer_red_spots,
        edge_energy, edge_std, mean_block_var, max_block_var,
        center_diff
    ]

def augment_image(img_path):
    """Generates 9 diverse augmentations for minority class balance."""
    img = Image.open(img_path).convert('RGB')
    augs = []
    # 1. Flip Left-Right
    augs.append(img.transpose(Image.FLIP_LEFT_RIGHT))
    # 2. Flip Top-Bottom
    augs.append(img.transpose(Image.FLIP_TOP_BOTTOM))
    # 3. Rotate 90
    augs.append(img.transpose(Image.ROTATE_90))
    # 4. Rotate 180
    augs.append(img.transpose(Image.ROTATE_180))
    # 5. Rotate 270
    augs.append(img.transpose(Image.ROTATE_270))
    # 6. Brightness +10%
    augs.append(ImageEnhance.Brightness(img).enhance(1.1))
    # 7. Brightness -10%
    augs.append(ImageEnhance.Brightness(img).enhance(0.9))
    # 8. Contrast +10%
    augs.append(ImageEnhance.Contrast(img).enhance(1.1))
    # 9. Contrast -10%
    augs.append(ImageEnhance.Contrast(img).enhance(0.9))
    return augs

def main():
    normal_dir = os.path.join(os.getcwd(), 'DFU', 'Patches', 'Normal(Healthy skin)')
    abnormal_dir = os.path.join(os.getcwd(), 'DFU', 'Patches', 'Abnormal(Ulcer)')

    if not os.path.exists(normal_dir) or not os.path.exists(abnormal_dir):
        print("Error: Dataset directories not found!")
        return

    normal_files = sorted([os.path.join(normal_dir, f) for f in os.listdir(normal_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
    abnormal_files = sorted([os.path.join(abnormal_dir, f) for f in os.listdir(abnormal_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])

    print("=================================================================")
    print("  FootGuard AI — Rigorous Clinical DFU Model Training & Audit   ")
    print("=================================================================")
    print(f"Dataset Verified:")
    print(f"  • Normal(Healthy skin) Class 0:  {len(normal_files)} images")
    print(f"  • Abnormal(Ulcer)       Class 1:  {len(abnormal_files)} images")
    print(f"  • Total Original Dataset:        {len(normal_files) + len(abnormal_files)} images")
    print("-----------------------------------------------------------------")

    # Step 1: Pre-extract raw original features for all images
    print("Extracting features from all original dataset images...")
    X_raw_norm = [extract_features_eroded(f) for f in normal_files]
    X_raw_ab = [extract_features_eroded(f) for f in abnormal_files]

    # Combine into raw dataset
    all_files = normal_files + abnormal_files
    all_X = np.array(X_raw_norm + X_raw_ab, dtype=np.float32)
    all_y = np.array([0] * len(normal_files) + [1] * len(abnormal_files), dtype=np.int32)

    # Step 2: 5-Fold Stratified Cross-Validation with STRICT NO-LEAKAGE
    print("\nRunning 5-Fold Stratified Cross-Validation (Augmentation inside train folds ONLY)...")
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_y_true = []
    cv_y_pred = []
    cv_y_prob = []

    for fold, (train_idx, val_idx) in enumerate(skf.split(all_X, all_y), 1):
        # Validation fold contains ONLY unaugmented original samples
        X_val_fold = all_X[val_idx]
        y_val_fold = all_y[val_idx]

        # Training fold: Separate normal and abnormal
        train_norm_files = [all_files[i] for i in train_idx if all_y[i] == 0]
        train_ab_files = [all_files[i] for i in train_idx if all_y[i] == 1]

        # Extract features for train normals + augment them within the fold
        X_train_fold = []
        y_train_fold = []

        for f in train_norm_files:
            X_train_fold.append(extract_features_eroded(f))
            y_train_fold.append(0)
            # 9 augmentations per normal in train fold
            for aug_img in augment_image(f):
                X_train_fold.append(extract_features_eroded(aug_img))
                y_train_fold.append(0)

        for f in train_ab_files:
            X_train_fold.append(extract_features_eroded(f))
            y_train_fold.append(1)

        X_train_fold = np.array(X_train_fold, dtype=np.float32)
        y_train_fold = np.array(y_train_fold, dtype=np.int32)

        # Train GBDT on balanced fold
        clf_fold = GradientBoostingClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.08,
            subsample=0.9,
            random_state=42
        )
        clf_fold.fit(X_train_fold, y_train_fold)

        preds = clf_fold.predict(X_val_fold)
        probs = clf_fold.predict_proba(X_val_fold)[:, 1]

        cv_y_true.extend(y_val_fold)
        cv_y_pred.extend(preds)
        cv_y_prob.extend(probs)

        fold_acc = accuracy_score(y_val_fold, preds)
        fold_rec_norm = recall_score(y_val_fold, preds, pos_label=0)
        fold_rec_ab = recall_score(y_val_fold, preds, pos_label=1)
        print(f"  Fold {fold}: Acc={fold_acc*100:.1f}% | Normal Recall={fold_rec_norm*100:.1f}% | Abnormal Recall={fold_rec_ab*100:.1f}%")

    cv_acc = accuracy_score(cv_y_true, cv_y_pred)
    cv_prec = precision_score(cv_y_true, cv_y_pred)
    cv_rec = recall_score(cv_y_true, cv_y_pred)
    cv_f1 = f1_score(cv_y_true, cv_y_pred)
    cv_auc = roc_auc_score(cv_y_true, cv_y_prob)
    cv_cm = confusion_matrix(cv_y_true, cv_y_pred)

    print("\n--- 5-Fold Cross-Validation Results (NO DATA LEAKAGE) ---")
    print(f"Overall Accuracy:  {cv_acc * 100:.2f}%")
    print(f"Ulcer Precision:   {cv_prec * 100:.2f}%")
    print(f"Ulcer Recall (TP): {cv_rec * 100:.2f}%")
    print(f"F1-Score:          {cv_f1 * 100:.2f}%")
    print(f"ROC-AUC:           {cv_auc * 100:.2f}%")
    print(f"Normal Specificity (TN): {cv_cm[0,0]} / {cv_cm[0,0] + cv_cm[0,1]} ({cv_cm[0,0]/(cv_cm[0,0]+cv_cm[0,1])*100:.1f}%)")
    print(f"Abnormal Sensitivity (TP): {cv_cm[1,1]} / {cv_cm[1,0] + cv_cm[1,1]} ({cv_cm[1,1]/(cv_cm[1,0]+cv_cm[1,1])*100:.1f}%)")
    print("\nConfusion Matrix:")
    print(f"                Predicted Normal   Predicted Ulcer")
    print(f"  Actual Normal       {cv_cm[0,0]:<15}    {cv_cm[0,1]}")
    print(f"  Actual Ulcer        {cv_cm[1,0]:<15}    {cv_cm[1,1]}")

    # Step 3: Train Final Production Model on Full Balanced Dataset
    print("\nTraining Final Production Model on all data with balanced augmentation...")
    X_final = []
    y_final = []

    for f in normal_files:
        X_final.append(extract_features_eroded(f))
        y_final.append(0)
        for aug_img in augment_image(f):
            X_final.append(extract_features_eroded(aug_img))
            y_final.append(0)

    for f in abnormal_files:
        X_final.append(extract_features_eroded(f))
        y_final.append(1)

    X_final = np.array(X_final, dtype=np.float32)
    y_final = np.array(y_final, dtype=np.int32)
    print(f"Total training samples: {len(X_final)} ({sum(y_final == 0)} Normal + {sum(y_final == 1)} Abnormal)")

    final_clf = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.9,
        random_state=42
    )
    final_clf.fit(X_final, y_final)

    # Evaluate Final Model on All Original Dataset Patches
    norm_preds = final_clf.predict(X_raw_norm)
    ab_preds = final_clf.predict(X_raw_ab)

    norm_acc = sum(norm_preds == 0) / len(normal_files)
    ab_acc = sum(ab_preds == 1) / len(abnormal_files)

    print("\n--- Final Model Evaluation on Original Dataset ---")
    print(f"Normal Patches Correct:   {sum(norm_preds == 0)} / {len(normal_files)} ({norm_acc * 100:.1f}%)")
    print(f"Abnormal Patches Correct: {sum(ab_preds == 1)} / {len(abnormal_files)} ({ab_acc * 100:.1f}%)")

    # Step 4: Export to JSON for TypeScript Backend
    trees = []
    for est in final_clf.estimators_:
        tree = est[0].tree_
        tree_dict = {
            "children_left": tree.children_left.tolist(),
            "children_right": tree.children_right.tolist(),
            "feature": tree.feature.tolist(),
            "threshold": [float(t) for t in tree.threshold],
            "value": [float(v[0][0]) for v in tree.value]
        }
        trees.append(tree_dict)

    init_val = float(final_clf.init_.prior) if hasattr(final_clf.init_, 'prior') else float(np.log(np.mean(y_final) / (1 - np.mean(y_final))))

    model_json = {
        "version": 6,
        "modelType": "GradientBoostingClassifier_ErodedMask_v6",
        "learningRate": float(final_clf.learning_rate),
        "initValue": init_val,
        "featureNames": [
            "mean_r", "mean_g", "mean_b", "std_r", "std_g", "std_b",
            "mean_luma", "std_luma", "redness_ratio", "nri", "exr",
            "skin_contrast", "dark_in_skin", "ulcer_red_spots",
            "edge_energy", "edge_std", "mean_block_var", "max_block_var",
            "center_diff"
        ],
        "trees": trees,
        "trainedOn": int(len(X_final)),
        "normalCount": int(len(normal_files)),
        "abnormalCount": int(len(abnormal_files)),
        "metrics": {
            "accuracy": float(cv_acc),
            "precision": float(cv_prec),
            "recall": float(cv_rec),
            "f1Score": float(cv_f1),
            "rocAuc": float(cv_auc),
            "recallNormal": float(norm_acc),
            "recallAbnormal": float(ab_acc)
        }
    }

    cache_path = os.path.join(os.getcwd(), 'dfu_model_cache.json')
    with open(cache_path, 'w') as f_out:
        json.dump(model_json, f_out)

    print(f"\n[OK] Successfully exported trained model v6 to: {cache_path}")
    print("=================================================================\n")

if __name__ == '__main__':
    main()
