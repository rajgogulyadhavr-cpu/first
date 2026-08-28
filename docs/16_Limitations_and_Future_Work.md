# 16. Limitations and Future Work — FootGuard AI

## Current Limitations
- **Dataset Size**: The local dataset consists of 566 patch images (54 Normal vs 512 Abnormal). While class weighting achieves 92.1% accuracy, expanding the normal patch dataset will improve generalization.
- **2D Image Constraints**: Screening relies on 2D planar RGB photos. Deep tissue pressure or thermal changes require specialized hardware (infrared thermography).

## Future Work
1. **Infrared Thermal Imaging Integration**: Support thermal smartphone cameras (FLIR) to detect sub-surface inflammation before skin breakdown.
2. **Deep Convolutional Network (MobileNetV3)**: Export a lightweight TensorFlow.js model for offline on-device edge inference.
3. **Primary Health Centre (PHC) Portal**: Add a dashboard for Village Health Nurses (VHN) in Tamil Nadu to manage patient records.
