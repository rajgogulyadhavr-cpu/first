# 02. System Architecture — FootGuard AI

```
[ USER INTERFACE (React + Vite + TailwindCSS) ]
              │
              ├── Audio / Web Speech API (Voice Input & Synthesis)
              ├── Camera / HTML5 File API (Foot Image Capture)
              │
              ▼
[ NETLIFY FRONTEND HOSTING (SPA Redirects) ]
              │
              │  HTTP / REST API (JSON + Base64)
              ▼
[ RENDER EXPRESS BACKEND HOSTING ]
              │
              ├── CORS & Security Middleware
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

## System Components
1. **Frontend**: Vite Single Page Application built with React, TypeScript, and TailwindCSS. Hosted on Netlify.
2. **Backend**: Node.js & Express server handling CORS, static caching, model loading, and API endpoints. Hosted on Render.
3. **ML Classifier**: Sharp image processing + 12-feature extraction + class-weighted Logistic Regression.
4. **LLM Engine**: Google Gemini 3.6 Flash server-side integration for foot validation and Paathasuvadu chatbot.
