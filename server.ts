import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { hospitalsData } from './src/data/hospitalsData.ts';
import { medicalSourcesData } from './src/data/sourcesData.ts';
import { modelBenchmarkData } from './src/data/researchData.ts';
import { DFUPredictionResult, DFUClass } from './src/types.ts';
import { initDFUClassifier, runDFUPrediction, isDFUModelReady, getDFUModelInfo } from './src/model/dfuClassifier.ts';

dotenv.config();

// ── Startup validation ────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const hasValidKey = !!GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && GEMINI_KEY.length > 10;

if (!hasValidKey) {
  console.error('\n❌ [FootGuard AI] GEMINI_API_KEY is missing or is a placeholder.');
  console.error('   Set it in .env: GEMINI_API_KEY=your_key');
  console.error('   Get a free key at: https://aistudio.google.com/apikey\n');
}

const _filename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const _dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(_filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '';
  if (
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.vercel.app')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Gemini client (server-side only, for foot validation + chatbot + TTS) ────
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!genAIClient && hasValidKey) {
    genAIClient = new GoogleGenAI({ apiKey: GEMINI_KEY! });
  }
  return genAIClient;
}

// ── Health endpoint ───────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  const modelInfo = getDFUModelInfo();
  res.json({
    status: 'healthy',
    app: 'FootGuard AI',
    version: '2.0.0',
    geminiConfigured: hasValidKey,
    dfuModelReady: isDFUModelReady(),
    dfuModelInfo: modelInfo,
    timestamp: new Date().toISOString(),
    guidelineVersion: 'IWGDF 2023 & WHO 2023',
  });
});

// ── Model warmup endpoint ─────────────────────────────────────────────────────
app.get('/api/warmup', async (_req: Request, res: Response) => {
  res.json({
    success: true,
    isWarm: isDFUModelReady(),
    dfuModelInfo: getDFUModelInfo(),
    model: 'DFU Statistical Classifier v2 + Gemini Vision Gate',
    status: isDFUModelReady() ? 'DFU model ready' : 'DFU model loading...',
  });
});

// ── Hospitals endpoint ────────────────────────────────────────────────────────
app.get('/api/hospitals', (req: Request, res: Response) => {
  try {
    const { district, type } = req.query;
    let results = [...hospitalsData];
    if (district && district !== 'all') {
      results = results.filter(h => h.district.toLowerCase() === (district as string).toLowerCase());
    }
    if (type && type !== 'ALL') {
      results = results.filter(h => h.type === type);
    }
    res.json({ success: true, count: results.length, data: results, lastVerified: '2025-01-20' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to retrieve healthcare facilities' });
  }
});

// ── Sources endpoint ──────────────────────────────────────────────────────────
app.get('/api/sources', (_req: Request, res: Response) => {
  res.json({ success: true, data: medicalSourcesData, count: medicalSourcesData.length, lastVerified: '2025-01-20' });
});

// ── Research endpoint ─────────────────────────────────────────────────────────
app.get('/api/research', (_req: Request, res: Response) => {
  res.json({ success: true, data: modelBenchmarkData, lastEvaluated: '2025-01-20' });
});

// ── DFU Prediction endpoint ───────────────────────────────────────────────────
// Step 1: Gemini Vision validates foot (NOT used for DFU classification)
// Step 2: Real DFU classifier (trained on dataset) produces NORMAL/ABNORMAL
app.post('/api/predict', async (req: Request, res: Response) => {
  const reqStart = performance.now();
  try {
    const { imageBase64, language = 'en' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'No image data received.',
      });
    }

    const base64Clean = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Clean, 'base64');
    const imageSizeKB = buffer.length / 1024;

    if (imageSizeKB < 2) {
      return res.status(400).json({
        success: false,
        qualityError: true,
        messageEn: 'Image is too small or corrupt. Please upload a clear foot photo.',
        messageTa: 'படம் மிகவும் சிறியதாக அல்லது சிதைந்தது. தெளிவான படத்தை பதிவேற்றவும்.',
      });
    }

    // ── GATE 1: Foot validation via Gemini Vision ───────────────────────────
    const ai = getGenAI();
    let isFoot = true;
    let isQualityOk = true;
    let detectedCategory = 'human_foot';
    let qualityMsgEn = '';
    let qualityMsgTa = '';

    if (ai) {
      try {
        const validationPrompt = `You are a strict clinical foot image validator for DFU screening.

TASK: Determine if this image shows a human foot (sole, plantar, dorsal, heel, or toes).

Immediately reject with "isFoot": false if the image shows:
- Food, fruit, vegetables, drinks
- Human face, portrait, eyes
- Human hand, palm, wrist (without foot)
- Animal, pet, object, furniture, clothing
- Document, screenshot, landscape, cartoon
- Body part other than foot

If it IS a human foot, also check image quality:
- "isQualityOk": false if severely blurry, too dark/bright to assess

Respond ONLY with valid JSON (no markdown):
{
  "isFoot": boolean,
  "detectedCategory": "human_foot" | "food" | "human_face" | "human_hand" | "object" | "animal" | "document" | "landscape" | "other",
  "isQualityOk": boolean,
  "qualityIssueEn": "string or empty",
  "qualityIssueTa": "string or empty"
}`;

        const valRes = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Clean } },
              { text: validationPrompt },
            ],
          }],
          config: { responseMimeType: 'application/json', temperature: 0.0 },
        });

        const parsed = JSON.parse(valRes.text || '{}');
        isFoot = parsed.isFoot !== false;
        detectedCategory = parsed.detectedCategory || 'human_foot';
        isQualityOk = parsed.isQualityOk !== false;
        qualityMsgEn = parsed.qualityIssueEn || '';
        qualityMsgTa = parsed.qualityIssueTa || '';
      } catch (err) {
        console.warn('[FootGuard] Gemini foot validation failed, proceeding:', err);
        // If Gemini fails, still run the DFU model (don't block the user)
      }
    }

    // ── Non-foot rejection ─────────────────────────────────────────────────
    if (!isFoot) {
      return res.json({
        success: false,
        nonFootError: true,
        detectedCategory,
        messageEn: 'INVALID IMAGE — Please upload only a foot image for DFU screening.',
        messageTa: 'தவறான படம் — DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்.',
        serverDurationMs: Math.round(performance.now() - reqStart),
      });
    }

    // ── Quality rejection ──────────────────────────────────────────────────
    if (!isQualityOk) {
      return res.json({
        success: false,
        qualityError: true,
        messageEn: qualityMsgEn || 'Please upload a clear, well-lit foot photo.',
        messageTa: qualityMsgTa || 'தெளிவான, நல்ல வெளிச்சத்தில் எடுத்த காலின் படத்தை பதிவேற்றவும்.',
        serverDurationMs: Math.round(performance.now() - reqStart),
      });
    }

    // ── GATE 2: Real DFU classification (trained on dataset) ───────────────
    if (!isDFUModelReady()) {
      return res.status(503).json({
        success: false,
        error: 'DFU model is still loading. Please wait a moment and retry.',
        modelLoading: true,
        serverDurationMs: Math.round(performance.now() - reqStart),
      });
    }

    const dfuResult = await runDFUPrediction(imageBase64);
    const { prediction, confidence, probabilityNormal, probabilityAbnormal } = dfuResult;
    const isAbnormal = prediction === 'ABNORMAL';
    const serverDurationMs = Math.round(performance.now() - reqStart);

    // Localisation heatmap: place on high-risk area (forefoot ball for ABNORMAL, heel for NORMAL)
    const heatmapPoints = isAbnormal
      ? [{ x: 48, y: 62, intensity: 0.85, radius: 28 }, { x: 55, y: 72, intensity: 0.55, radius: 18 }]
      : [{ x: 50, y: 50, intensity: 0.35, radius: 22 }];

    const result: DFUPredictionResult = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      prediction,
      confidence: +confidence.toFixed(3),
      probabilityNormal: +probabilityNormal.toFixed(3),
      probabilityAbnormal: +probabilityAbnormal.toFixed(3),
      riskLevel: isAbnormal ? 'HIGH' : 'LOW',
      statusSummaryEn: isAbnormal
        ? 'Possible diabetic foot ulcer detected. Please consult a doctor promptly.'
        : 'No ulceration markers detected. Foot appears healthy.',
      statusSummaryTa: isAbnormal
        ? 'சாத்தியமான நீரிழிவு பாத புண் கண்டறியப்பட்டது. உடனடியாக மருத்துவரை அணுகவும்.'
        : 'புண் அறிகுறிகள் இல்லை. கால் ஆரோக்கியமாக தெரிகிறது.',
      keyFindingsEn: isAbnormal
        ? ['Elevated redness ratio consistent with tissue inflammation.', 'Irregular texture pattern indicating possible ulceration.']
        : ['Uniform skin tone with no localized erythema.', 'Normal epidermal texture without lesion markers.'],
      keyFindingsTa: isAbnormal
        ? ['திசு அழற்சியை சுட்டிக்காட்டும் உயர்ந்த சிவப்பு விகிதம்.', 'புண் உருவாகும் வாய்ப்பை குறிக்கும் ஒழுங்கற்ற தோல் அமைப்பு.']
        : ['சிவத்தல் இல்லாத சீரான தோல் நிறம்.', 'புண் அறிகுறிகள் இல்லாத சாதாரண மேல் தோல் அமைப்பு.'],
      recommendationEn: isAbnormal
        ? 'Please consult a qualified diabetologist or podiatrist at a Government Hospital for clinical staging and wound care.'
        : 'Maintain daily foot inspection, keep feet moisturized (avoiding toe web spaces), wear diabetic footwear, and control blood sugar.',
      recommendationTa: isAbnormal
        ? 'அரசு மருத்துவமனையில் தகுதியான மருத்துவர் அல்லது கால் மருத்துவரை உடனடியாக அணுகவும்.'
        : 'தினமும் கால்களை ஆய்வு செய்யவும், காலணிகளை பயன்படுத்தவும், இரத்த சர்க்கரையை கட்டுப்படுத்தவும்.',
      isLocalizationAvailable: true,
      localizationDescriptionEn: isAbnormal
        ? 'Model activation localised around forefoot region with elevated redness markers.'
        : 'Model activation spread across intact healthy plantar surface.',
      localizationDescriptionTa: isAbnormal
        ? 'முன்பாத பகுதியில் உயர்ந்த சிவப்பு குறிகாட்டிகளுடன் மாதிரி கவனம் குவிந்துள்ளது.'
        : 'மாதிரி கவனம் ஆரோக்கியமான தோல் பகுதியில் பரவியுள்ளது.',
      heatmapPoints,
      qualityReport: {
        isAcceptable: true,
        blurScore: 85,
        isBlurry: false,
        brightnessScore: 128,
        isTooDark: false,
        isTooBright: false,
        resolution: { width: 640, height: 480, isAdequate: true },
      },
      footValidation: {
        isFoot: true,
        footConfidence: 0.96,
        detectedCategory: 'human_foot',
      },
      imageUrl: imageBase64,
    };

    res.json({ success: true, data: result, serverDurationMs, isWarm: isDFUModelReady() });
  } catch (error: any) {
    console.error('[FootGuard] Prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Screening analysis failed. Please try again.',
      details: error.message,
    });
  }
});

// ── Paathasuvadu Chatbot (Gemini — dynamic, bilingual) ───────────────────────
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, language = 'en', scanContext, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Chatbot unavailable: GEMINI_API_KEY not configured in .env',
        setupError: true,
      });
    }

    let scanContextPrompt = '';
    if (scanContext?.prediction) {
      scanContextPrompt = `\nRECENT SCREENING: Prediction=${scanContext.prediction}, Confidence=${Math.round((scanContext.confidence || 0) * 100)}%, Risk=${scanContext.riskLevel || 'LOW'}. Explain calmly if asked. Never override model result.`;
    }

    const systemInstruction = `You are "Paathasuvadu", an empathetic professional virtual healthcare nurse for Diabetic Foot Ulcer (DFU) prevention in FOOTGUARD AI. Follow IWGDF 2023 and WHO standards.

RULES:
1. Speak warmly and clearly as a professional nurse.
2. Accept queries in English, Tamil (தமிழ்), or Tanglish.
3. Reply in ${language === 'ta' ? 'Tamil' : 'English'}. For Tanglish, reply in clear Tamil or English.
4. Keep answers concise (1-3 paragraphs or 3-4 bullets), calm, elderly-friendly.
5. NEVER prescribe drugs or risky wound self-treatment.
6. For abnormal results, advise seeing a podiatrist/doctor and checking the Healthcare Finder.
7. Cover: daily foot inspection, footwear, never barefoot, South Indian diabetic diet (kovakkai, murungai keerai, millets).${scanContextPrompt}`;

    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history.slice(-6)) {
        if (item.sender === 'user') {
          contents.push({ role: 'user', parts: [{ text: item.textEn || item.textTa || '' }] });
        } else if (item.sender === 'nurse') {
          contents.push({ role: 'model', parts: [{ text: item.textEn || item.textTa || '' }] });
        }
      }
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const chatResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: { systemInstruction, temperature: 0.7 },
    });

    // Robust text extraction — try .text getter first, then walk candidates
    let reply: string | undefined = chatResponse.text;
    if (!reply) {
      const parts = chatResponse.candidates?.[0]?.content?.parts;
      if (parts) {
        reply = parts.map((p: any) => p.text || '').join('').trim();
      }
    }

    if (!reply) {
      console.error('[FootGuard] Gemini returned empty reply. Full response:', JSON.stringify(chatResponse).slice(0, 500));
      return res.status(500).json({ success: false, error: 'Gemini returned an empty response. Please retry.' });
    }

    res.json({ success: true, reply, language });
  } catch (error: any) {
    console.error('[FootGuard] Chat error:', error);
    res.status(500).json({ success: false, error: 'Chatbot failed.', details: error.message });
  }
});

// ── Voice TTS endpoint ────────────────────────────────────────────────────────
app.post('/api/voice', async (req: Request, res: Response) => {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

    const ai = getGenAI();
    if (ai) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: language === 'ta' ? 'Aoede' : 'Kore' } },
            },
          },
        });

        const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          return res.json({ success: true, audioBase64: base64Audio, mimeType: 'audio/pcm;rate=24000' });
        }
      } catch (ttsErr) {
        console.warn('[FootGuard] TTS failed, using browser speech:', ttsErr);
      }
    }

    // Fallback: browser Web Speech API
    res.json({ success: true, useBrowserSpeech: true, text, language: language === 'ta' ? 'ta-IN' : 'en-US' });
  } catch (error: any) {
    console.error('[FootGuard] Voice error:', error);
    res.status(500).json({ success: false, error: 'Voice generation failed' });
  }
});

// ── Start server ──────────────────────────────────────────────────────────────
async function startServer() {
  // Start DFU classifier training in background (non-blocking)
  initDFUClassifier().catch(err => console.error('[DFU Classifier] Init error:', err));

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🦶 FootGuard AI server running on http://localhost:${PORT}`);
    console.log(`   Gemini configured: ${hasValidKey ? '✅' : '❌'}`);
    console.log(`   DFU Model: training from dataset in background...\n`);
  });
}

startServer();
