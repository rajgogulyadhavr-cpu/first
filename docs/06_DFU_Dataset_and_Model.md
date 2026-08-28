# 06. DFU Dataset and Model — FootGuard AI

## Dataset Overview
The DFU screening model is trained directly on local Kaggle Diabetic Foot Ulcer patch images located at `DFU/Patches/`:
- **Normal (Healthy Skin)**: 54 image patches (`label 0`)
- **Abnormal (Ulcer)**: 512 image patches (`label 1`)
- Total: 566 training samples

## Feature Engineering (12 Features)
Using the `sharp` high-performance image processing library, images are resized to 64×64 pixels and 12 statistical biomarkers are extracted:
1. Mean Red Channel (`meanR / 255`)
2. Mean Green Channel (`meanG / 255`)
3. Mean Blue Channel (`meanB / 255`)
4. Standard Deviation Red Channel (`stdR / 255`)
5. Standard Deviation Green Channel (`stdG / 255`)
6. Standard Deviation Blue Channel (`stdB / 255`)
7. Redness Ratio (`meanR / (meanG + meanB + 1)`)
8. Dark Pixel Ratio (luma < 60)
9. Bright Pixel Ratio (luma > 210)
10. Texture Variance (luminance standard deviation)
11. Colour Contrast Range (`(maxR-minR + maxG-minG) / 510`)
12. Green-Blue Imbalance (`|meanG - meanB| / 255`)

## Classification Algorithm
- **Logistic Regression** with class-weighted gradient descent (`NORMAL` weight = `9.48x` to compensate for class imbalance).
- **Per-feature Min-Max Normalization** fit on training set.
- **Decision Threshold**: `0.5` (standard decision boundary for class-weighted logistic regression).
- **Weight Caching**: Model weights and normalization parameters are cached to `dfu_model_cache.json` for sub-10ms startup.

## Measured Performance Metrics
- **Accuracy**: 92.1%
- **Normal Recall (Specificity)**: 88.9%
- **Abnormal Recall (Sensitivity)**: 92.4%
