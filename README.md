# FootGuard AI — Diabetic Foot Ulcer Screening & Prevention System

> **Smart AI-Based Early Prevention and Detection Decision-Support System for Diabetic Foot Ulcers.**  
> *Compliant with IWGDF 2023, WHO 2023, and ICMR Standards.*

---

## 📌 Problem Statement & Objective
Diabetic Foot Ulceration (DFU) is one of the most severe complications of diabetes mellitus, leading to 85% of lower-limb amputations worldwide. Early screening and daily foot hygiene can prevent up to 85% of these amputations.

**FootGuard AI** provides an accessible, non-invasive early screening system combined with a bilingual virtual nurse ("Paathasuvadu") speaking English and Tamil to assist patients and caregivers across Tamil Nadu.

---

## ⚙️ Architecture & Technical Workflow

```
[ USER INTERFACE (React + Vite + TailwindCSS) ]
              │
              ├── Audio / Web Speech API (Voice Input & Synthesis)
              ├── Camera / HTML5 File API (Foot Image Capture)
              │
              ▼
[ NETLIFY FRONTEND HOSTING (SPA Redirects) ]
              │  https://dazzling-bienenstitch-8a5c97.netlify.app/
              │
              ▼
[ RENDER EXPRESS BACKEND HOSTING ]
              │  https://footguard-backend.onrender.com
              │
              ├── GATE 1: Gemini Vision API (Foot Image Gatekeeper & Rejection)
              │
              ├── GATE 2: Statistical ML DFU Classifier (Logistic Regression)
              │           └── Trained on Kaggle DFU Dataset (566 Patches)
              │           └── Weights cached in dfu_model_cache.json
              │
              └── GATE 3: Paathasuvadu Virtual Nurse (Gemini 3.6 Flash LLM)
                          └── Dynamic Tamil/English/Tanglish Healthcare Assistant
```

### 1. DFU Image Screening Workflow
```
USER UPLOADS IMAGE / CAPTURES CAMERA
                 │
                 ▼
     BACKEND API: /api/predict
                 │
                 ▼
       GEMINI FOOT VALIDATION
                 │
        ┌────────┴────────┐
        ▼                 ▼
   [NOT A FOOT]        [VALID FOOT]
        │                 │
        ▼                 ▼
  REJECT IMAGE        DFU ML CLASSIFIER
 (Invalid Warning)   (12 Statistical Features)
                          │
                          ▼
                 CLASSIFICATION RESULT
                 NORMAL  or  ABNORMAL
```

### 2. Paathasuvadu Virtual Nurse Workflow
```
USER QUESTION (Typed or Voice)
                 │
                 ▼
     BACKEND API: /api/chat
                 │
                 ▼
     GEMINI 3.6 FLASH LLM
                 │
                 ▼
      DYNAMIC CONCISE ANSWER
     (English / Tamil / Tanglish)
                 │
                 ▼
     TEXT & VOICE SYNTHESIS
```

---

## 🚀 Key Features
- **Real ML DFU Classification**: 12-feature statistical machine learning classifier trained directly on Kaggle DFU skin patches (`NORMAL` vs `ABNORMAL`).
- **Strict Non-Foot Rejection**: Gemini Vision gatekeeper rejects invalid non-foot images with dual-language warnings.
- **Paathasuvadu Virtual Nurse**: Bilingual AI healthcare assistant answering custom and predefined questions in Tamil, English, and Tanglish.
- **Voice-to-Voice Interaction**: Microphone STT and Gemini TTS audio playback.
- **Grad-CAM Localization**: Plantar heatmap visualization highlighting high-risk areas.
- **Healthcare Finder**: Database of verified Tamil Nadu medical colleges, district hospitals, and podiatrists with interactive district map.
- **Diabetic Nutrition Guide**: South Indian dietary recommendations (Kovakkai, Murungai Keerai, Millets).

---

## 📊 Measured ML Classifier Benchmark Metrics
- **Dataset**: 566 patch images (54 Normal + 512 Abnormal)
- **Accuracy**: **92.1%** (105 / 114 correct on validation set)
- **Normal Recall (Specificity)**: **88.9%**
- **Abnormal Recall (Sensitivity)**: **92.4%**
- **Decision Threshold**: `0.5` (class-weighted model, NORMAL weight = `9.48x`)

---

## 🛠️ Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Lucide Icons, Canvas API.
- **Backend**: Node.js, Express, TypeScript (`esbuild` bundled), `sharp` image processing.
- **AI Models**: Google Gemini 3.6 Flash (`@google/genai`), Custom Logistic Regression DFU Classifier.
- **Hosting**: Netlify (Frontend SPA), Render (Backend Express Service).

---

## 📂 Project Inventory & File Purpose

```
project1-main/
├── .env                           — Local secrets (GEMINI_API_KEY) [Git-ignored]
├── .env.example                   — Template for environment variables
├── netlify.toml                   — Netlify build and SPA routing config
├── server.ts                      — Express backend server & API endpoints
├── dfu_model_cache.json           — Cached ML classifier weights and metrics
├── DFU/Patches/                   — Kaggle DFU image dataset (Normal & Abnormal)
│
├── docs/                          — Full project documentation (16 modules)
│   ├── 01_Project_Overview.md
│   ├── 02_System_Architecture.md
│   ├── 03_Project_Workflow.md
│   ├── 04_Frontend_Structure.md
│   ├── 05_Backend_Structure.md
│   ├── 06_DFU_Dataset_and_Model.md
│   ├── 07_Prediction_Workflow.md
│   ├── 08_Paathasuvadu_Chatbot.md
│   ├── 09_API_Documentation.md
│   ├── 10_Camera_and_Image_Validation.md
│   ├── 11_Hospital_and_Diet_Modules.md
│   ├── 12_Research_and_Guidelines.md
│   ├── 13_Testing_and_Results.md
│   ├── 14_Deployment.md
│   ├── 15_Setup_and_Run.md
│   └── 16_Limitations_and_Future_Work.md
│
└── src/
    ├── App.tsx                    — Main React layout & state manager
    ├── main.tsx                   — Vite React entry point
    ├── model/dfuClassifier.ts     — ML feature extraction & training module
    ├── services/api.ts            — Frontend API client service
    ├── utils/audioPlayer.ts       — Voice synthesis & audio decoder
    └── components/
        ├── Scanner/FootScanner.tsx— Camera capture & DFU screening UI
        ├── Nurse/PaathasuvaduNurse.tsx — Virtual nurse chatbot UI
        ├── Healthcare/HealthcareFinder.tsx — Tamil Nadu hospital finder
        ├── Diet/DietNutrition.tsx — South Indian diabetic diet guide
        ├── Care/DailyFootCare.tsx — 7-step hygiene routine
        └── Visuals/FootAnatomyDiagram.tsx — Biomechanical foot diagram
```

---

## 💻 Local Setup & Development

1. **Clone Repository**:
   ```bash
   git clone https://github.com/rajgogulyadhavr-cpu/first.git
   cd first
   ```

2. **Configure Environment**:
   Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

3. **Install Dependencies & Start**:
   ```bash
   npm install
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   npm start
   ```

---

## 🌐 Live Deployments
- **Frontend App**: [https://dazzling-bienenstitch-8a5c97.netlify.app/](https://dazzling-bienenstitch-8a5c97.netlify.app/)
- **Backend Service**: [https://footguard-backend.onrender.com](https://footguard-backend.onrender.com)
- **GitHub Repository**: [https://github.com/rajgogulyadhavr-cpu/first.git](https://github.com/rajgogulyadhavr-cpu/first.git)

---

## ⚠️ Medical Disclaimer
*FootGuard AI is designed as an early decision-support and screening tool. It does not replace professional medical diagnosis. Patients showing signs of foot ulceration, infection, or discoloration must consult a qualified healthcare professional or visit a hospital immediately.*
