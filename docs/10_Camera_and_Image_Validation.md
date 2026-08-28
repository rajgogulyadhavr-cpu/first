# 10. Camera and Image Validation — FootGuard AI

## Camera Permission Flow
- The application uses standard HTML5 `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })`.
- Clicking the "Scan with Camera" card or action button in `FootScanner.tsx` directly requests browser camera access without intermediate permission popups or extra confirmation dialogs.
- Supports rear camera (`environment`) and front camera (`user`) switching.

## Image Gatekeeper Validation (Gemini Vision)
- Before executing the statistical DFU classifier, the backend calls Gemini Vision (`gemini-3.6-flash`).
- Rejection rules:
  - Non-foot images (faces, food, objects, animals, text) are immediately flagged.
  - Returns dual-language rejection messages:
    - **English**: `"INVALID IMAGE — Please upload only a foot image for DFU screening."`
    - **Tamil**: `"தவறான படம் — DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்."`
