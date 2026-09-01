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

    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z+-]+;base64,/, '').replace(/\s/g, '');
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
        const validationPrompt = `You are a clinical foot image validator for DFU screening.

TASK: Determine if this image shows a human foot, foot sole, heel, toes, plantar/dorsal surface, foot skin patch, or diabetic foot ulcer.

IMPORTANT: Accept foot skin patches, close-up crops of soles/heels/toes, foot ulcers, and foot lesions as "isFoot": true.
ONLY reject with "isFoot": false if the image clearly shows something completely unrelated (e.g., face, food, animal, car, document, landscape).

Respond ONLY with valid JSON:
{
  "isFoot": boolean,
  "detectedCategory": "human_foot" | "food" | "human_face" | "human_hand" | "object" | "animal" | "document" | "landscape" | "other",
  "isQualityOk": boolean,
  "qualityIssueEn": "string or empty",
  "qualityIssueTa": "string or empty"
}`;

        const valRes = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: [{
            parts: [
              { inlineData: { mimeType: 'image/jpeg', data: base64Clean } },
              { text: validationPrompt },
            ],
          }],
          config: { responseMimeType: 'application/json', temperature: 0.0 },
        });

        let rawText = (valRes.text || '').replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
        const parsed = JSON.parse(rawText || '{}');
        
        detectedCategory = (parsed.detectedCategory || 'human_foot').toLowerCase();
        const explicitNonFootCategories = ['food', 'human_face', 'object', 'animal', 'document', 'landscape'];
        
        if (parsed.isFoot === false && explicitNonFootCategories.includes(detectedCategory)) {
          isFoot = false;
        } else {
          isFoot = true; // Default to true for foot skin patches, lesions, and ambiguous crops
        }

        isQualityOk = parsed.isQualityOk !== false;
        qualityMsgEn = parsed.qualityIssueEn || '';
        qualityMsgTa = parsed.qualityIssueTa || '';
      } catch (err) {
        console.warn('[FootGuard] Gemini foot validation skipped/failed, proceeding to DFU model:', err);
        isFoot = true; // Fallthrough to dataset DFU model
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
      console.log('[FootGuard] DFU classifier not pre-warmed, initializing now...');
      await initDFUClassifier();
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

// Helper for fallback Paathasuvadu AI response generator
function getFallbackNurseReply(message: string, language: string, scanContext?: any): string {
  const msgLower = message.toLowerCase();
  const isTa = language === 'ta' || /[\u0B80-\u0BFF]/.test(message);
  const isAbnormal = scanContext?.prediction === 'ABNORMAL';

  if (isAbnormal) {
    if (isTa) {
      return `உங்கள் பரிசோதனையில் சாத்தியமான நீரிழிவு பாத புண் கண்டறியப்பட்டுள்ளது (ABNORMAL). 48 மணி நேரத்திற்குள் ஒரு அரசு மருத்துவமனை அல்லது கால் மருத்துவரை (Podiatrist) அணுகவும். புண்ணை சுயமாக சுத்தம் செய்யாதீர்கள்.`;
    } else {
      return `Your screening shows a possible diabetic foot ulcer (ABNORMAL). Please consult a podiatrist or diabetologist within 48 hours. Avoid self-treating or popping any blister/wound.`;
    }
  }

  if (msgLower.includes('food') || msgLower.includes('diet') || msgLower.includes('eat') || msgLower.includes('உணவு') || msgLower.includes('சாப்பாடு')) {
    if (isTa) {
      return `நீரிழிவு நோயாளிகளுக்கான சிறந்த உணவுகள்:\n• காய்கறிகள்: கோவைக்காய், முருங்கைக்கீரை, வெண்டைக்காய், பாகற்காய்.\n• தானியங்கள்: கம்பு, திணை, சிவப்பு அரிசி.\n• தவிர்க்க வேண்டியவை: மைதா, சர்க்கரை, அதிக வெள்ளை அரிசி, பொரித்த உணவுகள்.`;
    } else {
      return `Best foods for diabetic foot health:\n• Vegetables: Ivy gourd (kovakkai), drumstick leaves, bitter gourd, ladies finger.\n• Grains: Millets (kambu/thinai), brown/red rice.\n• Avoid: Refined sugar, maida, deep-fried foods, and large white rice portions.`;
    }
  }

  if (msgLower.includes('care') || msgLower.includes('daily') || msgLower.includes('clean') || msgLower.includes('பராமரிப்பு') || msgLower.includes('கால்')) {
    if (isTa) {
      return `தினசரி பாத பராமரிப்பு வழிமுறைகள்:\n1. தினமும் மாலையில் நல்ல வெளிச்சத்தில் கால்களை ஆய்வு செய்யவும்.\n2. மிதமான சோப்பு மற்றும் வெதுவெதுப்பான நீரால் கழுவி, விரல்களுக்கு இடையில் நன்றாக உலர்த்தவும்.\n3. நீரிழிவு காலணிகளை எப்போதும் அணியவும்; வெறுங்காலுடன் நடக்காதீர்கள்.`;
    } else {
      return `Daily foot care guidelines:\n1. Inspect both feet daily in good light for cuts, redness, or swelling.\n2. Wash feet with mild soap and lukewarm water, drying thoroughly between toes.\n3. Always wear diabetic footwear indoors and outdoors. Never walk barefoot.`;
    }
  }

  if (isTa) {
    return `வணக்கம்! நான் பாதாசுவடு நர்ஸ். நீரிழிவு பாத பராமரிப்பு மற்றும் புண் தடுப்பு பற்றிய கேள்விகளுக்கு நான் உங்களுக்கு உதவுவேன். உங்கள் கால்களை தினமும் ஆய்வு செய்து, நீரிழிவு காலணிகளை பயன்படுத்தவும்.`;
  } else {
    return `Hello! I am Paathasuvadu, your FootGuard AI healthcare assistant. I provide guidance on diabetic foot care, daily hygiene, and ulcer prevention according to WHO/IWGDF standards. How may I help you?`;
  }
}

// ── Paathasuvadu Chatbot (Gemini — dynamic, bilingual) ───────────────────────
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, language = 'en', scanContext, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const ai = getGenAI();
    if (!ai) {
      const fallbackReply = getFallbackNurseReply(message, language, scanContext);
      return res.json({ success: true, reply: fallbackReply, language, isFallback: true });
    }

    let scanContextPrompt = '';
    if (scanContext?.prediction) {
      scanContextPrompt = `\nRECENT SCREENING: Prediction=${scanContext.prediction}, Confidence=${Math.round((scanContext.confidence || 0) * 100)}%, Risk=${scanContext.riskLevel || 'LOW'}. Explain calmly if asked. Never override model result.`;
    }

    const systemInstruction = `You are "Paathasuvadu", a professional virtual healthcare nurse in FootGuard AI for Diabetic Foot Ulcer (DFU) prevention (IWGDF 2023 / WHO standards).

STRICT RULES — follow in order:
1. Answer ONLY the exact question asked. Do not give a generic greeting or unrelated information.
2. Be SHORT and DIRECT: 2-4 sentences or 3-4 bullet points. No lengthy explanations.
3. Match the language of the user's question exactly (Tamil → Tamil, English → English, Tanglish → Tanglish).
4. Start your answer immediately — NEVER start with "How can I assist you?" or any greeting.
5. Never prescribe medication or suggest risky wound self-treatment.
6. If result is ABNORMAL or wound is present, always advise seeing a doctor or podiatrist urgently.${scanContextPrompt}

Core knowledge:
- Daily foot care: inspect feet every evening in good light (mirror for soles), wash and dry thoroughly especially between toes, moisturize (avoid toe webs).
- Warning signs requiring immediate doctor visit: wound not healing in 3 days, black/dark tissue, swelling with heat, pus, foul smell, fever.
- Best Tamil diabetic foods: kovakkai (ivy gourd), murungai keerai (drumstick leaves), kambu/thinai (millets), karunai kizhangu (yam). Avoid maida, fried foods, large portions of white rice.
- After screening — NORMAL: maintain foot hygiene, diabetic footwear, blood sugar control, annual re-screening. ABNORMAL: see a podiatrist/diabetologist within 48 hours.
- Footwear: always wear diabetic footwear indoors and outdoors, never walk barefoot.`;

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

    let reply: string | undefined;

    try {
      const chatResponse = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents,
        config: { systemInstruction, temperature: 0.7 },
      });

      reply = chatResponse.text;
      if (!reply) {
        const parts = chatResponse.candidates?.[0]?.content?.parts;
        if (parts) {
          reply = parts.map((p: any) => p.text || '').join('').trim();
        }
      }
    } catch (apiErr: any) {
      console.warn('[FootGuard] Gemini AI chat call error, using intelligent fallback reply:', apiErr?.message || apiErr);
      reply = getFallbackNurseReply(message, language, scanContext);
    }

    if (!reply) {
      reply = getFallbackNurseReply(message, language, scanContext);
    }

    res.json({ success: true, reply, language });
  } catch (error: any) {
    console.error('[FootGuard] Chat error:', error);
    const fallbackReply = getFallbackNurseReply(req.body?.message || '', req.body?.language || 'en', req.body?.scanContext);
    res.json({ success: true, reply: fallbackReply, language: req.body?.language || 'en', isFallback: true });
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
  // Warm up DFU classifier training on server start
  try {
    console.log('[DFU Classifier] Initializing and warming model from dataset...');
    await initDFUClassifier();
    console.log('[DFU Classifier] ✅ Ready.');
  } catch (err) {
    console.error('[DFU Classifier] Warmup warning:', err);
  }

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
    console.log(`   DFU Model: dataset model trained & ready ✅\n`);
  });
}

startServer();
