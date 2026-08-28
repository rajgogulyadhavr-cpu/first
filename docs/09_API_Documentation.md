# 09. API Documentation — FootGuard AI

## 1. System Health
- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "status": "healthy",
  "app": "FootGuard AI",
  "version": "2.0.0",
  "geminiConfigured": true,
  "dfuModelReady": true,
  "dfuModelInfo": {
    "trainedOn": 566,
    "normalCount": 54,
    "abnormalCount": 512,
    "accuracy": 0.921,
    "recallNormal": 0.889,
    "recallAbnormal": 0.924,
    "threshold": 0.5,
    "version": 3
  }
}
```

## 2. DFU Prediction
- **Endpoint**: `POST /api/predict`
- **Request Body**: `{ "imageBase64": "data:image/jpeg;base64,...", "language": "en" | "ta" }`
- **Response**:
```json
{
  "success": true,
  "data": {
    "prediction": "NORMAL" | "ABNORMAL",
    "confidence": 0.926,
    "probabilityNormal": 0.926,
    "probabilityAbnormal": 0.074,
    "riskLevel": "LOW" | "HIGH",
    "statusSummaryEn": "...",
    "statusSummaryTa": "...",
    "keyFindingsEn": ["..."],
    "keyFindingsTa": ["..."],
    "recommendationEn": "...",
    "recommendationTa": "..."
  }
}
```

## 3. Paathasuvadu Chatbot
- **Endpoint**: `POST /api/chat`
- **Request Body**: `{ "message": "...", "language": "en" | "ta", "history": [] }`
- **Response**: `{ "success": true, "reply": "...", "language": "en" }`

## 4. Voice TTS
- **Endpoint**: `POST /api/voice`
- **Request Body**: `{ "text": "...", "language": "en" | "ta" }`
- **Response**: `{ "success": true, "audioBase64": "...", "mimeType": "audio/wav" }`
