import os
import json
import numpy as np
from PIL import Image, ImageEnhance
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

normal_dir = os.path.join(os.getcwd(), 'DFU', 'Patches', 'Normal(Healthy skin)')
abnormal_dir = os.path.join(os.getcwd(), 'DFU', 'Patches', 'Abnormal(Ulcer)')

normal_files = [os.path.join(normal_dir, f) for f in os.listdir(normal_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
abnormal_files = [os.path.join(abnormal_dir, f) for f in os.listdir(abnormal_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]

def extract_features_eroded(arr_or_path):
    if isinstance(arr_or_path, str):
        img = Image.open(arr_or_path).convert('RGB').resize((128, 128))
        arr = np.array(img, dtype=np.float32)
    else:
        arr = arr_or_path.astype(np.float32)
        
    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Raw skin mask
    raw_skin = (r > g * 0.78) & (r > b * 0.78) & (luma > 40) & (luma < 248) & (r > 50)
    
    # 4-neighbor morphological erosion to eliminate transition boundary edge noise
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
    
    # 1. Color distributions within skin
    mean_r = float(np.mean(r_skin) / 255.0)
    mean_g = float(np.mean(g_skin) / 255.0)
    mean_b = float(np.mean(b_skin) / 255.0)
    std_r = float(np.std(r_skin) / 255.0)
    std_g = float(np.std(g_skin) / 255.0)
    std_b = float(np.std(b_skin) / 255.0)
    
    # 2. Luminance & contrast
    mean_luma = float(np.mean(luma_skin) / 255.0)
    std_luma = float(np.std(luma_skin) / 255.0)
    
    # 3. Clinical erythema indices (+10.0 regularizer)
    redness_ratio = float(np.mean(r_skin / (g_skin + b_skin + 10.0)))
    nri = float(np.mean((r_skin - g_skin) / (r_skin + g_skin + 10.0)))
    exr = float(np.mean((2 * r_skin - g_skin - b_skin) / 255.0))
    
    # 4. Percentile contrast
    p95 = float(np.percentile(luma_skin, 95))
    p5 = float(np.percentile(luma_skin, 5))
    skin_contrast = float((p95 - p5) / 255.0)
    
    # 5. Necrotic dark spots and ulcer granulation spots inside skin
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
    
    # 8. Center vs skin difference
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

# Feature extraction with minority class balance (augment 54 normal -> 540)
X_norm = []
for f in normal_files:
    img = Image.open(f).convert('RGB')
    X_norm.append(extract_features_eroded(f))
    # Augmentations
    img_h = img.transpose(Image.FLIP_LEFT_RIGHT)
    X_norm.append(extract_features_eroded(np.array(img_h.resize((128,128)))))
    img_v = img.transpose(Image.FLIP_TOP_BOTTOM)
    X_norm.append(extract_features_eroded(np.array(img_v.resize((128,128)))))
    img_r90 = img.transpose(Image.ROTATE_90)
    X_norm.append(extract_features_eroded(np.array(img_r90.resize((128,128)))))
    img_r270 = img.transpose(Image.ROTATE_270)
    X_norm.append(extract_features_eroded(np.array(img_r270.resize((128,128)))))
    enh_b = ImageEnhance.Brightness(img).enhance(1.1)
    X_norm.append(extract_features_eroded(np.array(enh_b.resize((128,128)))))
    enh_d = ImageEnhance.Brightness(img).enhance(0.9)
    X_norm.append(extract_features_eroded(np.array(enh_d.resize((128,128)))))
    enh_c = ImageEnhance.Contrast(img).enhance(1.1)
    X_norm.append(extract_features_eroded(np.array(enh_c.resize((128,128)))))
    enh_c2 = ImageEnhance.Contrast(img).enhance(0.9)
    X_norm.append(extract_features_eroded(np.array(enh_c2.resize((128,128)))))
    img_tr = img.transpose(Image.TRANSPOSE)
    X_norm.append(extract_features_eroded(np.array(img_tr.resize((128,128)))))

X_ab = []
for f in abnormal_files:
    X_ab.append(extract_features_eroded(f))

print(f"Balanced Dataset: {len(X_norm)} Normal + {len(X_ab)} Abnormal samples.")

X = np.array(X_norm + X_ab, dtype=np.float32)
y = np.array([0] * len(X_norm) + [1] * len(X_ab), dtype=np.int32)

# 5-Fold Cross-Validation
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
y_trues, y_preds = [], []

for train_idx, val_idx in skf.split(X, y):
    X_train, X_val = X[train_idx], X[val_idx]
    y_train, y_val = y[train_idx], y[val_idx]
    
    clf_cv = GradientBoostingClassifier(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42)
    clf_cv.fit(X_train, y_train)
    preds = clf_cv.predict(X_val)
    y_trues.extend(y_val)
    y_preds.extend(preds)

acc = accuracy_score(y_trues, y_preds)
prec = precision_score(y_trues, y_preds)
rec = recall_score(y_trues, y_preds)
f1 = f1_score(y_trues, y_preds)
cm = confusion_matrix(y_trues, y_preds)

print("\n--- 5-Fold Stratified Cross-Validation ---")
print(f"Accuracy:  {acc * 100:.2f}%")
print(f"Precision: {prec * 100:.2f}%")
print(f"Recall:    {rec * 100:.2f}%")
print(f"F1-Score:  {f1 * 100:.2f}%")
print(f"Normal Recall (TN): {cm[0,0]} / {cm[0,0]+cm[0,1]} ({cm[0,0]/(cm[0,0]+cm[0,1])*100:.1f}%)")
print(f"Abnormal Recall (TP): {cm[1,1]} / {cm[1,0]+cm[1,1]} ({cm[1,1]/(cm[1,0]+cm[1,1])*100:.1f}%)")

# Train final model
clf = GradientBoostingClassifier(n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42)
clf.fit(X, y)

# Evaluate on all original patches
norm_preds = clf.predict([extract_features_eroded(f) for f in normal_files])
ab_preds = clf.predict([extract_features_eroded(f) for f in abnormal_files])

print(f"\nOriginal Dataset Evaluation:")
print(f"Original Normal Patches Correct: {sum(norm_preds == 0)} / {len(normal_files)} ({sum(norm_preds == 0)/len(normal_files)*100:.1f}%)")
print(f"Original Abnormal Patches Correct: {sum(ab_preds == 1)} / {len(abnormal_files)} ({sum(ab_preds == 1)/len(abnormal_files)*100:.1f}%)")

# Export decision trees to JSON
trees = []
for est in clf.estimators_:
    tree = est[0].tree_
    tree_dict = {
        "children_left": tree.children_left.tolist(),
        "children_right": tree.children_right.tolist(),
        "feature": tree.feature.tolist(),
        "threshold": [float(t) for t in tree.threshold],
        "value": [float(v[0][0]) for v in tree.value]
    }
    trees.append(tree_dict)

init_val = float(clf.init_.prior) if hasattr(clf.init_, 'prior') else float(np.log(np.mean(y) / (1 - np.mean(y))))

model_json = {
    "version": 5,
    "modelType": "GradientBoostingClassifier_ErodedMask",
    "learningRate": float(clf.learning_rate),
    "initValue": init_val,
    "featureNames": [
        "mean_r", "mean_g", "mean_b", "std_r", "std_g", "std_b",
        "mean_luma", "std_luma", "redness_ratio", "nri", "exr",
        "skin_contrast", "dark_in_skin", "ulcer_red_spots",
        "edge_energy", "edge_std", "mean_block_var", "max_block_var",
        "center_diff"
    ],
    "trees": trees,
    "trainedOn": int(len(X)),
    "normalCount": int(len(normal_files)),
    "abnormalCount": int(len(abnormal_files)),
    "metrics": {
        "accuracy": float(acc),
        "precision": float(prec),
        "recall": float(rec),
        "f1Score": float(f1),
        "recallNormal": float(sum(norm_preds == 0) / len(normal_files)),
        "recallAbnormal": float(sum(ab_preds == 1) / len(abnormal_files))
    }
}

with open('dfu_model_cache.json', 'w') as out:
    json.dump(model_json, out)

print("\nExported final robust model to dfu_model_cache.json successfully!")
