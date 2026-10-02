# Real-World Camera Test

This folder is reserved for testing the FootGuard AI application with **newly captured images** under real-world conditions.

## IMPORTANT

- Images in this folder **must NOT be used for training**.
- Results from real-world tests are **separate from validation/test set results**.
- This is **NOT clinical validation**.

## Test Conditions to Cover

| Condition | Description |
|-----------|-------------|
| Normal foot — good lighting | Well-lit indoor photo of a healthy foot |
| Normal foot — dim lighting | Low-light capture (tests quality rejection) |
| Normal foot — bright sunlight | Outdoor, direct sunlight |
| Normal foot — far distance | Full foot from ~1 metre away |
| Normal foot — close-up | Close-up of sole/plantar surface |
| Normal foot — different angles | Dorsal, plantar, lateral views |
| Left foot | Specifically the left foot |
| Right foot | Specifically the right foot |
| Background variation | Dark floor, white floor, wooden floor, grass |
| Genuine abnormal/ulcer | Only where legally and ethically appropriate |

## Instructions

1. Capture images using a real phone camera (the same way users would use the app).
2. Upload via the FootGuard AI web app.
3. Record the prediction, confidence, and number of patches analyzed.
4. Record the actual ground truth (normal/abnormal).
5. Document results in `real_world_test/results.md`.

## Expected Behavior

With v7 model + patch-tiling inference:
- Clear, close-up, well-lit foot images → should classify correctly
- Blurry / dark / tiny images → should return UNCERTAIN (quality rejection)
- Normal foot images → should return NORMAL or UNCERTAIN
- Images with genuine ulcer/wound → should return ABNORMAL

## Disclaimer

Real-world performance on camera images may differ from the patch-dataset metrics.
The model was trained on close-up skin patches (128×128 px), not full-foot camera images.
Patch-tiling inference is a research workaround, not a clinically validated approach.
