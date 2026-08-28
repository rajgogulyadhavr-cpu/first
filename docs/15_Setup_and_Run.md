# 15. Setup and Local Run Guide — FootGuard AI

## Prerequisites
- Node.js v18+ or v20+
- npm or bun
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/apikey)

## Environment Configuration
Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
PORT=3000
```

## Installation & Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Local Development Mode** (starts Vite dev server and Express backend concurrently):
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

3. **Production Build**:
   ```bash
   npm run build
   npm start
   ```
