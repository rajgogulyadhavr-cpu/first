# 04. Frontend Structure — FootGuard AI

## Overview
The frontend is built using React 18, TypeScript, and TailwindCSS, bundled with Vite.

## Directory Structure
- `src/main.tsx`: Entry point mounting `App.tsx`.
- `src/App.tsx`: Main layout component containing navigation, language toggle, and active tab rendering.
- `src/components/`:
  - `Scanner/FootScanner.tsx`: Main DFU screening UI with camera capture, file upload, preset selection, and result rendering.
  - `Scanner/GradCamOverlay.tsx`: Interactive Grad-CAM heatmap visualization canvas.
  - `Nurse/PaathasuvaduNurse.tsx`: Virtual nurse chat UI with microphone voice input and suggestion chips.
  - `Nurse/NurseAvatar3D.tsx`: WebGL 3D avatar with animated speech lip-sync.
  - `Healthcare/HealthcareFinder.tsx`: Searchable list of Tamil Nadu medical colleges and DFU podiatry specialists.
  - `Healthcare/TamilNaduMapSvg.tsx`: Interactive SVG map of Tamil Nadu districts.
  - `Care/DailyFootCare.tsx`: 7-step clinical foot hygiene routine and DOs & DONTs matrix.
  - `Diet/DietNutrition.tsx`: South Indian diabetic nutrition guide with glycemic index ratings.
  - `DFUInfo/DFUInformation.tsx`: Educational pathology guide covering Meggitt-Wagner staging.
  - `History/ScanHistory.tsx`: History log of past screenings.
  - `Research/TechnicalResearch.tsx`: Model benchmark metrics panel.
  - `Visuals/FootAnatomyDiagram.tsx`: Biomechanical foot diagram displaying ulcer risk hotspots.
- `src/services/api.ts`: API service calling backend endpoints using `VITE_API_BASE_URL`.
- `src/utils/audioPlayer.ts`: Web Audio API PCM decoder and Web Speech synthesis fallback.
