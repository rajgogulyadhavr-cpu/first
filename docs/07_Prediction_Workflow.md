# 07. Prediction Workflow — FootGuard AI

## Detailed Execution Steps
1. **User Action**: The user captures a foot photo using the web camera or uploads an existing image in `FootScanner.tsx`.
2. **Client Compression**: `imageOptimizer.ts` scales the image using canvas if needed to optimize network payload.
3. **API Request**: Image base64 string is sent to `POST /api/predict`.
4. **Gatekeeper (Gemini Vision)**:
   - Evaluates if the image contains a human foot.
   - If a non-foot object (food, animal, car, face) is uploaded, returns an immediate rejection:
     - **English**: `"INVALID IMAGE — Please upload only a foot image for DFU screening."`
     - **Tamil**: `"தவறான படம் — DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்."`
5. **Statistical ML Classifier**:
   - Extracts 12 color/texture features via `sharp`.
   - Normalizes features using `dfu_model_cache.json` min-max bounds.
   - Computes logistic regression sigmoid output: `probabilityAbnormal`.
   - Classifies as `ABNORMAL` if `probabilityAbnormal >= 0.5`, else `NORMAL`.
6. **Response Payload**: Returns prediction, confidence percentage, risk level (`HIGH` or `LOW`), clinical recommendations, and heatmap coordinate points.
7. **UI Rendering**: `FootScanner.tsx` displays prediction banner, confidence progress bar, clinical recommendations, and `GradCamOverlay.tsx` heatmap.
