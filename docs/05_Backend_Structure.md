# 05. Backend Structure — FootGuard AI

## Overview
The backend is an Express Node.js application (`server.ts`) written in TypeScript and bundled into `dist/server.cjs` for production execution.

## Express Endpoints
- `GET /api/health`: Returns server status, Gemini key configuration state, and ML classifier accuracy metrics.
- `GET /api/warmup`: Pre-warms the server and returns model readiness.
- `POST /api/predict`: Accepts a base64 foot image, performs Gemini vision validation (Gate 1), runs the local DFU ML classifier (Gate 2), and returns `NORMAL` or `ABNORMAL` with confidence.
- `POST /api/chat`: Handles Paathasuvadu nurse queries using `gemini-3.6-flash`.
- `POST /api/voice`: Generates spoken audio response using Gemini TTS (`gemini-2.5-flash-preview-tts`).
- `GET /api/hospitals`: Returns filtered list of Tamil Nadu DFU medical centers.
- `GET /api/sources`: Returns medical literature citations (IWGDF, WHO, ICMR).
- `GET /api/research`: Returns benchmark accuracy metrics.

## Middleware & Security
- `cors()`: Handles cross-origin requests from Netlify and local dev servers.
- `express.json({ limit: '15mb' })`: Allows image base64 uploads up to 15MB.
- `GEMINI_API_KEY`: Strictly read from `process.env.GEMINI_API_KEY` (never exposed to client).
