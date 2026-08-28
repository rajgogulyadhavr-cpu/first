# 14. Deployment Architecture — FootGuard AI

## Frontend Deployment (Netlify)
- **Live URL**: `https://dazzling-bienenstitch-8a5c97.netlify.app/`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Configuration**: Configured via `netlify.toml` with SPA wildcard redirects (`/*` -> `/index.html`) and `VITE_API_BASE_URL` pointing to the Render backend.

## Backend Deployment (Render)
- **Live URL**: `https://footguard-backend.onrender.com`
- **Build Command**: `npm run build`
- **Start Command**: `npm start` (`node dist/server.cjs`)
- **Environment Variables**: `GEMINI_API_KEY`, `PORT`, `FRONTEND_URL`.
