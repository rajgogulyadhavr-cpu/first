# 03. Project Workflow — FootGuard AI

## 1. DFU Image Screening Workflow

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
                          │
                          ▼
                 CONFIDENCE & GRAD-CAM
                 HEATMAP DISPLAYED
```

## 2. Paathasuvadu Virtual Nurse Chatbot Workflow

```
USER ASKS QUESTION (Typed or Voice)
                 │
                 ▼
     BACKEND API: /api/chat
                 │
                 ▼
     GEMINI 3.6 FLASH LLM
   (Bilingual System Prompt)
                 │
                 ▼
      DYNAMIC CONCISE ANSWER
     (English / Tamil / Tanglish)
                 │
                 ▼
     TEXT & VOICE SYNTHESIS
    (Gemini TTS / Web Speech)
```
