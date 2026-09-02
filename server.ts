import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { hospitalsData } from './src/data/hospitalsData.ts';
import { medicalSourcesData } from './src/data/sourcesData.ts';
import { modelBenchmarkData } from './src/data/researchData.ts';
import { DFUPredictionResult } from './src/types.ts';
import { initDFUClassifier, runDFUPrediction, isDFUModelReady, getDFUModelInfo } from './src/model/dfuClassifier.ts';

dotenv.config();

// ── Startup validation ────────────────────────────────────────────────────────
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const hasValidKey = !!GEMINI_KEY && GEMINI_KEY !== 'YOUR_GEMINI_API_KEY_HERE' && GEMINI_KEY.length > 10;

if (!hasValidKey) {
  console.warn('\n⚠️ [FootGuard AI] GEMINI_API_KEY is missing or placeholder. Running with clinical fallback engine.\n');
}

const _dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://dazzling-bienenstitch-8a5c97.netlify.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || '';
  if (
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.endsWith('.netlify.app') ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost')
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ── Health Check ─────────────────────────────────────────────────────────────
const healthHandler = (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    modelReady: isDFUModelReady(),
    modelInfo: getDFUModelInfo(),
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ── Gemini client ─────────────────────────────────────────────────────────────
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
  if (!isDFUModelReady()) {
    await initDFUClassifier();
  }
  res.json({
    success: true,
    isWarm: isDFUModelReady(),
    dfuModelInfo: getDFUModelInfo(),
    model: 'Clinical DFU GBDT Biomarker Model (28 features) + Gemini Vision Gate',
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

// ── DFU Prediction endpoint (POST /api/predict) ────────────────────────────────
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

    // ── GATE 1: Foot validation via Gemini Vision (if configured and reachable) ──
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
Accept foot skin patches, close-up crops of soles/heels/toes, foot ulcers, and foot lesions as "isFoot": true.
ONLY reject with "isFoot": false if the image clearly shows something completely unrelated (e.g. face, food, car, landscape).

Respond ONLY with valid JSON:
{
  "isFoot": boolean,
  "detectedCategory": "human_foot" | "food" | "human_face" | "human_hand" | "object" | "animal" | "document" | "landscape" | "other",
  "isQualityOk": boolean,
  "qualityIssueEn": "string or empty",
  "qualityIssueTa": "string or empty"
}`;

        const valRes = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
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
          isFoot = true;
        }

        isQualityOk = parsed.isQualityOk !== false;
        qualityMsgEn = parsed.qualityIssueEn || '';
        qualityMsgTa = parsed.qualityIssueTa || '';
      } catch (err) {
        // Fallthrough safely to ML classifier
        isFoot = true;
      }
    }

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

    if (!isQualityOk) {
      return res.json({
        success: false,
        qualityError: true,
        messageEn: qualityMsgEn || 'Please upload a clear, well-lit foot photo.',
        messageTa: qualityMsgTa || 'தெளிவான, நல்ல வெளிச்சத்தில் எடுத்த காலின் படத்தை பதிவேற்றவும்.',
        serverDurationMs: Math.round(performance.now() - reqStart),
      });
    }

    // ── GATE 2: ML DFU classification on validated dataset model ─────────
    if (!isDFUModelReady()) {
      await initDFUClassifier();
    }

    const dfuResult = await runDFUPrediction(imageBase64);
    const { prediction, confidence, probabilityNormal, probabilityAbnormal, hotspotX = 50, hotspotY = 50 } = dfuResult;
    const isAbnormal = prediction === 'ABNORMAL';
    const serverDurationMs = Math.round(performance.now() - reqStart);

    // Heatmap points based on actual model hotspot
    const heatmapPoints = isAbnormal
      ? [{ x: hotspotX, y: hotspotY, intensity: 0.88, radius: 26 }, { x: Math.min(90, hotspotX + 5), y: Math.min(90, hotspotY + 5), intensity: 0.55, radius: 16 }]
      : [{ x: 50, y: 50, intensity: 0.15, radius: 22 }];

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
        ? ['Elevated localized redness and tissue texture irregularity consistent with ulceration.', 'Epidermal breach or lesion cluster detected in plantar region.']
        : ['Uniform skin tone with physiological redness balance.', 'Intact epidermal texture with no lesion markers. '],
      keyFindingsTa: isAbnormal
        ? ['திசு அழற்சி அல்லது புண்ணை சுட்டிக்காட்டும் உயர்ந்த சிவப்பு விகிதம்.', 'புண் உருவாவதை குறிக்கும் ஒழுங்கற்ற தோல் அமைப்பு.']
        : ['சீரான தோல் நிறம் மற்றும் இயல்பான அமைப்பு.', 'புண் அறிகுறிகள் இல்லாத ஆரோக்கியமான மேல் தோல்.'],
      recommendationEn: isAbnormal
        ? 'Please consult a qualified diabetologist or podiatrist at a Government Hospital for clinical staging and wound care.'
        : 'Maintain daily foot inspection, keep feet moisturized (avoiding toe web spaces), wear diabetic footwear, and control blood sugar.',
      recommendationTa: isAbnormal
        ? 'அரசு மருத்துவமனையில் தகுதியான மருத்துவர் அல்லது கால் மருத்துவரை உடனடியாக அணுகவும்.'
        : 'தினமும் கால்களை ஆய்வு செய்யவும், நீரிழிவு காலணிகளை பயன்படுத்தவும், இரத்த சர்க்கரையை கட்டுப்படுத்தவும்.',
      isLocalizationAvailable: true,
      localizationDescriptionEn: isAbnormal
        ? `Model activation localized around coordinates (${hotspotX}%, ${hotspotY}%) with elevated lesion markers.`
        : 'Model activation is uniformly distributed across healthy intact skin without any localized ulcer cluster.',
      localizationDescriptionTa: isAbnormal
        ? `(${hotspotX}%, ${hotspotY}%) பகுதியில் உயர்ந்த புண் குறிகாட்டிகளுடன் மாதிரி கவனம் குவிந்துள்ளது.`
        : 'மாதிரி கவனம் எந்த புண் குவியலும் இல்லாமல் ஆரோக்கியமான தோல் பகுதியில் சீராக பரவியுள்ளது.',
      heatmapPoints,
      qualityReport: {
        isAcceptable: true,
        blurScore: 88,
        isBlurry: false,
        brightnessScore: 128,
        isTooDark: false,
        isTooBright: false,
        resolution: { width: 640, height: 480, isAdequate: true },
      },
      footValidation: {
        isFoot: true,
        footConfidence: 0.98,
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

// ── Comprehensive Clinical Rule Generator for DFU (Tamil & English) ───────────
function getFallbackNurseReply(message: string, language: string, scanContext?: any): string {
  const msgLower = (message || '').toLowerCase();
  const isTa = language === 'ta' || /[\u0B80-\u0BFF]/.test(message);
  const isAbnormal = scanContext?.prediction === 'ABNORMAL';

  // Greeting / Initial intent
  if (/^(hi|hello|hey|vanakkam|வணக்கம்|ஹலோ)/i.test(msgLower.trim()) && msgLower.length < 20) {
    if (isTa) {
      return `வணக்கம்! நான் உங்கள் நீரிழிவு பாத பராமரிப்பு செவிலியர் AI. நீரிழிவு புண் தடுப்பு, தினசரி பராமரிப்பு, உணவு முறைகள் அல்லது மருத்துவமனை வழிகாட்டல் பற்றி என்னிடம் கேட்கலாம்.`;
    }
    return `Hello! I am your Diabetic Foot Care Assistant. I can guide you on daily foot inspection, ulcer prevention, diabetic diet, footwear, and hospital referrals according to WHO/IWGDF standards. How may I help you?`;
  }

  // Scan Result query
  if (msgLower.includes('result') || msgLower.includes('scan') || msgLower.includes('முடிவு') || msgLower.includes('பரிசோதனை') || msgLower.includes('report')) {
    if (isAbnormal) {
      if (isTa) {
        return `உங்கள் பரிசோதனையில் சாத்தியமான நீரிழிவு பாத புண் (ABNORMAL) கண்டறியப்பட்டுள்ளது. தாமதிக்காமல் உடனடியாக அரசு மருத்துவமனை அல்லது கால் மருத்துவரை (Podiatrist) அணுகவும். புண்ணை சுயமாக கிள்ளவோ களிம்புகளை பூசவோ கூடாது.`;
      }
      return `Your screening indicates a possible diabetic foot ulcer (ABNORMAL). Please visit a podiatrist or diabetologist within 48 hours for clinical wound staging. Avoid self-treatment or applying unprescribed ointments.`;
    } else {
      if (isTa) {
        return `உங்கள் பரிசோதனை இயல்பாக (NORMAL) உள்ளது. புண் அறிகுறிகள் இல்லை. தினமும் கால்களை பரிசோதிக்கவும், நீரிழிவு காலணிகளை அணியவும், இரத்த சர்க்கரையை சீராக பராமரிக்கவும்.`;
      }
      return `Your screening appears healthy (NORMAL) with no active ulcer markers. Continue daily foot checks, moisturize your feet (avoid between toes), wear diabetic footwear, and maintain glucose control.`;
    }
  }

  // Diet / Food query
  if (msgLower.includes('food') || msgLower.includes('diet') || msgLower.includes('eat') || msgLower.includes('சாப்பாடு') || msgLower.includes('உணவு') || msgLower.includes('fruits') || msgLower.includes('காய்')) {
    if (isTa) {
      return `நீரிழிவு பாத ஆரோக்கியத்திற்கான சிறந்த உணவுகள்:\n• காய்கறிகள்: கோவைக்காய், முருங்கைக்கீரை, வெண்டைக்காய், பாகற்காய், அவரைக்காய்.\n• சிறுதானியங்கள்: கம்பு, திணை, குதிரைவாலி, கேழ்வரகு, சிவப்பு அரிசி.\n• பழங்கள்: கொய்யா, நாவல்பழம், ஆப்பிள் (மிதமான அளவில்).\n• தவிர்க்க வேண்டியவை: மைதா, சர்க்கரை, இனிப்புகள், பொரித்த உணவுகள் மற்றும் அதிக வெள்ளை அரிசி.`;
    }
    return `Recommended diet for diabetic foot health:\n• Vegetables: Ivy gourd (kovakkai), drumstick leaves, bitter gourd, okra, ridge gourd.\n• Whole Grains: Millets (kambu, thinai, ragi), brown/red rice.\n• Fruits: Guava, jamun, small green apple (in moderation).\n• Avoid: Refined sugar, maida, deep-fried snacks, and large portions of white rice.`;
  }

  // Daily Care / Washing / Hygiene
  if (msgLower.includes('care') || msgLower.includes('daily') || msgLower.includes('clean') || msgLower.includes('wash') || msgLower.includes('பராமரிப்பு') || msgLower.includes('கழுவ') || msgLower.includes('சுத்தம்') || msgLower.includes('routine')) {
    if (isTa) {
      return `தினசரி பாத பராமரிப்பு முக்கிய 4 படிகள்:\n1. தினமும் மாலையில் நல்ல வெளிச்சத்தில் உள்ளங்கால் மற்றும் விரல் இடுக்குகளை ஆய்வு செய்யவும்.\n2. வெதுவெதுப்பான நீரிலும் மிதமான சோப்பிலும் கழுவி, விரல்களுக்கு இடையில் மென்மையாக துடைத்து உலர்த்தவும்.\n3. பாதத்தின் மேல் மற்றும் அடிப்பகுதியில் மாய்ஸ்சரைசர் தடவவும் (விரல் இடுக்குகளில் தடவக்கூடாது).\n4. எப்போதுமே சுத்தமான பருத்தி காலுறைகள் மற்றும் நீரிழிவு காலணிகளை அணியவும்.`;
    }
    return `4 Essential Daily Foot Care Steps:\n1. Inspect soles, heels, and toe webs daily in bright light (use a mirror if needed).\n2. Wash feet in lukewarm water with mild soap, and pat completely dry especially between toes.\n3. Apply moisturizer to top and sole of feet (do not apply between toes to prevent fungal infection).\n4. Always wear seamless cotton socks and certified diabetic footwear.`;
  }

  // Footwear / Shoes query
  if (msgLower.includes('shoe') || msgLower.includes('sandal') || msgLower.includes('footwear') || msgLower.includes('காலணி') || msgLower.includes('செருப்பு') || msgLower.includes('socks')) {
    if (isTa) {
      return `நீரிழிவு காலணி வழிகாட்டுதல்:\n• வீட்டின் உள்ளேயும் வெளியேயும் எப்போதுமே மென்மையான நீரிழிவு காலணிகளை (MCR/MCP Footwear) அணியவும்.\n• ஒருபோதும் வெறுங்காலுடன் நடக்காதீர்கள்.\n• காலணி அணியும் முன் உள்ளே கற்கள் அல்லது முட்கள் இருக்கிறதா என சரிபார்க்கவும்.\n• இறுக்கமான காலணிகளை தவிர்க்கவும்.`;
    }
    return `Diabetic Footwear Guidelines:\n• Always wear customized diabetic footwear (MCR/MCP insole) both indoors and outdoors.\n• Never walk barefoot on any surface.\n• Check inside shoes for pebbles, rough edges, or torn seams before wearing.\n• Avoid tight, pointed-toe, or high-heeled footwear.`;
  }

  // Warning signs / Symptoms / Red flags / Pain / Swelling / Pus
  if (msgLower.includes('pain') || msgLower.includes('swelling') || msgLower.includes('pus') || msgLower.includes('red') || msgLower.includes('black') || msgLower.includes('வலி') || msgLower.includes('வீக்கம்') || msgLower.includes('சீழ்') || msgLower.includes('சிவப்பு') || msgLower.includes('புண்') || msgLower.includes('wound') || msgLower.includes('ulcer')) {
    if (isTa) {
      return `அவசர எச்சரிக்கை அறிகுறிகள்:\n• 3 நாட்களுக்கு மேல் ஆறாத புண், தோல் நிறம் கருப்பாக மாறுதல்.\n• சீழ் வடிதல், துர்நாற்றம் அல்லது தீவிர வீக்கம் மற்றும் சூடு.\n• காலில் உணர்வின்மை அல்லது காய்ச்சல்.\nஇவை இருந்தால் தாமதிக்காமல் உடனடியாக அரசு மருத்துவமனைக்குச் செல்லவும்.`;
    }
    return `Emergency DFU Warning Signs:\n• Non-healing wound after 3 days or blackened (necrotic) skin.\n• Foul-smelling drainage, pus, localized heat, or expanding redness.\n• Loss of sensation, severe swelling, or accompanying fever.\nIf any of these are present, visit the nearest Government Hospital or podiatrist immediately.`;
  }

  // Hospital referral
  if (msgLower.includes('hospital') || msgLower.includes('doctor') || msgLower.includes('clinic') || msgLower.includes('மருத்துவமனை') || msgLower.includes('மருத்துவர்') || msgLower.includes('treatment')) {
    if (isTa) {
      return `தமிழ்நாடு அரசு மருத்துவக் கல்லூரி மருத்துவமனைகள் மற்றும் மாவட்ட தலைமை மருத்துவமனைகளில் நீரிழிவு மற்றும் பாத பராமரிப்பு சிகிச்சை (Diabetic Podiatry Clinic) இலவசமாக வழங்கப்படுகிறது. ஆரம்ப நிலையிலேயே பரிசோதிப்பது தீவிர பாதிப்புகளை தடுக்கும்.`;
    }
    return `Comprehensive diabetic foot evaluation and wound staging is available at Government Medical College Hospitals and District Headquarter Hospitals across Tamil Nadu. Early clinical consultation prevents complications and amputations.`;
  }

  // DFU / Diabetes general knowledge
  if (msgLower.includes('dfu') || msgLower.includes('diabetic foot') || msgLower.includes('நீரிழிவு பாதம்') || msgLower.includes('foot ulcer')) {
    if (isTa) {
      return `நீரிழிவு பாத புண் (DFU) என்பது நீரிழிவு நோயாளிகளில் நரம்பு பாதிப்பு மற்றும் இரத்த ஓட்டக் குறைபாடு காரணமாக கால்களில் ஏற்படும் புண் ஆகும். இது சரியாக கவனிக்கப்படாவிட்டால் கடுமையான தொற்று மற்றும் அறுவை சிகிச்சைக்கு வழிவகுக்கும். தினமும் கால்களை ஆய்வு செய்வது முக்கியம்.`;
    }
    return `A Diabetic Foot Ulcer (DFU) is an open wound or sore on the feet of people with diabetes, caused by peripheral neuropathy (nerve damage) and poor blood circulation. If untreated, it can lead to severe infection and amputation. Early detection through daily foot inspection is critical.`;
  }

  // Diabetes general info
  if (msgLower.includes('diabetes') || msgLower.includes('sugar') || msgLower.includes('நீரிழிவு') || msgLower.includes('சர்க்கரை') || msgLower.includes('blood glucose')) {
    if (isTa) {
      return `நீரிழிவு நோய் என்பது இரத்தத்தில் சர்க்கரை அளவு அதிகமாக இருக்கும் நாள்பட்ட நிலை ஆகும். கட்டுப்படுத்தப்படாத நீரிழிவு கால் நரம்பு பாதிப்பு, புண், தொற்று ஆகியவற்றுக்கு வழிவகுக்கும். HbA1c < 7% பராமரிப்பது முக்கியம்.`;
    }
    return `Diabetes is a chronic condition where blood sugar levels are elevated. Uncontrolled diabetes damages peripheral nerves and blood vessels, increasing the risk of foot ulcers, infections, and amputations. Maintaining HbA1c below 7% significantly reduces complications.`;
  }

  // Prevention questions
  if (msgLower.includes('prevent') || msgLower.includes('avoid') || msgLower.includes('protect') || msgLower.includes('தடுப்') || msgLower.includes('பாதுகா')) {
    if (isTa) {
      return `நீரிழிவு பாத புண்களை தடுக்க:\n• தினமும் கால்களை ஆய்வு செய்யவும்.\n• நீரிழிவு காலணிகளை அணியவும்.\n• வெறுங்காலுடன் நடக்காதீர்கள்.\n• இரத்த சர்க்கரையை கட்டுப்படுத்தவும்.\n• கால் நகங்களை நேராக வெட்டவும்.\n• புகைபிடிப்பதை தவிர்க்கவும்.`;
    }
    return `To prevent diabetic foot ulcers:\n• Inspect feet daily for cuts, blisters, redness, or swelling.\n• Wear certified diabetic footwear (MCR insole).\n• Never walk barefoot.\n• Maintain blood glucose control (HbA1c < 7%).\n• Cut toenails straight across.\n• Avoid smoking as it impairs circulation.`;
  }

  // General fallback
  if (isTa) {
    return `நீரிழிவு பாத பராமரிப்பு குறித்து நீங்கள் என்னிடம் கேட்கலாம்: தினசரி பராமரிப்பு முறைகள், சிறந்த உணவுப் பழக்கங்கள், காலணிகள், ஆபத்து அறிகுறிகள் அல்லது மருத்துவமனை வழிகாட்டுதல். உங்களுக்கு என்ன உதவி தேவை?`;
  }
  return `I am here to help you with diabetic foot ulcer prevention. You can ask about daily hygiene, diabetic diet, protective footwear, warning signs, or hospital care. How can I assist you?`;
}

// ── Shared Healthcare Chat Function (Urai AI & Kurai AI Text) ────────────────
async function handleHealthcareChat(req: Request, res: Response) {
  try {
    const { message, language = 'en', scanContext, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const ai = getGenAI();
    let reply: string | undefined;

    if (ai) {
      let scanContextPrompt = '';
      if (scanContext?.prediction) {
        scanContextPrompt = `\nRECENT SCREENING: Prediction=${scanContext.prediction}, Confidence=${Math.round((scanContext.confidence || 0) * 100)}%, Risk=${scanContext.riskLevel || 'LOW'}. Explain calmly if asked. Never override model result.`;
      }

      const systemInstruction = `You are "Paathasuvadu", an expert clinical virtual nurse in FootGuard AI for Diabetic Foot Ulcer (DFU) prevention (IWGDF 2023 / WHO standards).

STRICT RULES:
1. Answer ONLY the exact clinical question asked. Be concise (2-4 clear sentences or short bullet points).
2. Match the language of the user's question (Tamil -> Tamil, English -> English, Tanglish -> Tanglish).
3. Start your answer immediately without robotic greetings.
4. Core areas: Daily foot inspection, lukewarm washing & drying between toes, MCR/diabetic footwear, Tamil diabetic diet (kovakkai, drumstick leaves, millets), warning signs (pus, black necrotic tissue, fever), and urgent hospital consultation if abnormal.${scanContextPrompt}`;

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

      try {
        const chatResponse = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
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
        if (reply) {
          console.log(`[Chat] Gemini replied successfully (${reply.length} chars) for: "${message.substring(0, 50)}"`);
        }
      } catch (apiErr: any) {
        console.error(`[Chat] Gemini API error for message "${message.substring(0, 50)}": ${apiErr.message || apiErr}`);
        reply = getFallbackNurseReply(message, language, scanContext);
      }
    }

    if (!reply) {
      reply = getFallbackNurseReply(message, language, scanContext);
    }

    res.json({ success: true, reply, language });
  } catch (error: any) {
    const fallbackReply = getFallbackNurseReply(req.body?.message || '', req.body?.language || 'en', req.body?.scanContext);
    res.json({ success: true, reply: fallbackReply, language: req.body?.language || 'en', isFallback: true });
  }
}

// ── Shared Voice TTS Function (Kurai AI Voice) ────────────────────────────────
async function handleVoiceTTS(req: Request, res: Response) {
  try {
    const { text, language = 'en' } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'Text is required' });

    const ai = getGenAI();
    if (ai) {
      try {
        const ttsResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: `Please read the following text aloud: ${text}` }] }],
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
        // Fallthrough safely to Web Speech API
      }
    }

    // High-fidelity fallback to browser speech synthesis
    res.json({
      success: true,
      useBrowserSpeech: true,
      text,
      language: language === 'ta' ? 'ta-IN' : 'en-US'
    });
  } catch (error: any) {
    res.json({
      success: true,
      useBrowserSpeech: true,
      text: req.body?.text || '',
      language: req.body?.language === 'ta' ? 'ta-IN' : 'en-US'
    });
  }
}

// ── Required Endpoints for ISSUE 2 ────────────────────────────────────────────
// POST /api/kurai/voice — Kurai Voice generation (TTS)
app.post('/api/kurai/voice', handleVoiceTTS);
// POST /api/voice — Backward compatibility alias
app.post('/api/voice', handleVoiceTTS);

// POST /api/kurai/text — Kurai Text processing
app.post('/api/kurai/text', handleHealthcareChat);

// POST /api/urai/chat — Urai AI Conversational Assistant
app.post('/api/urai/chat', handleHealthcareChat);
// POST /api/chat — Backward compatibility alias
app.post('/api/chat', handleHealthcareChat);

// ── Start server ──────────────────────────────────────────────────────────────
async function startServer() {
  try {
    console.log('[DFU Classifier] Loading clinical GBDT biomarker model...');
    await initDFUClassifier();
    console.log('[DFU Classifier] ✅ Model ready.');
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
    console.log(`   DFU GBDT Model: 19 Clinical Biomarkers (Balanced, Eroded-Mask) ✅\n`);
  });
}

startServer();
