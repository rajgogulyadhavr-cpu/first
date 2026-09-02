import { DFUPredictionResult, Hospital, MedicalSource, ModelBenchmarkMetrics } from '../types';

// API base URL: uses VITE_API_BASE_URL in production (e.g., Render/Railway backend URL)
// Falls back to empty string in dev mode (Vite proxies /api/* to Express server)
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export async function checkModelWarmup(): Promise<{
  success: boolean;
  isWarm: boolean;
  warmupDurationMs: number;
  model: string;
  targetLatencyLimitMs: number;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/warmup`);
    return await res.json();
  } catch (err) {
    return {
      success: false,
      isWarm: false,
      warmupDurationMs: 0,
      model: 'DFU GBDT Model v4',
      targetLatencyLimitMs: 3000,
    };
  }
}

/**
 * POST /api/predict — DFU Foot Image Screening
 */
export async function predictFootImage(
  imageBase64: string,
  language: 'en' | 'ta' = 'en'
): Promise<{
  success: boolean;
  data?: DFUPredictionResult;
  nonFootError?: boolean;
  qualityError?: boolean;
  detectedCategory?: string;
  messageEn?: string;
  messageTa?: string;
  serverDurationMs?: number;
  isWarm?: boolean;
  warmupDurationMs?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, language }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('API predict error:', err);
    return {
      success: false,
      error: 'Network connection failed. Please check your internet connection.',
    };
  }
}

/**
 * POST /api/urai/chat — Urai AI Chatbot endpoint
 */
export async function sendUraiChat(
  message: string,
  language: 'en' | 'ta' = 'en',
  scanContext?: Partial<DFUPredictionResult>,
  history: any[] = []
): Promise<{
  success: boolean;
  reply?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/urai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, scanContext, history }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('API Urai chat error:', err);
    return {
      success: false,
      error: 'Failed to communicate with healthcare assistant.',
    };
  }
}

/**
 * POST /api/kurai/text — Kurai AI Text endpoint
 */
export async function sendKuraiText(
  message: string,
  language: 'en' | 'ta' = 'en',
  scanContext?: Partial<DFUPredictionResult>,
  history: any[] = []
): Promise<{
  success: boolean;
  reply?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/kurai/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, language, scanContext, history }),
    });
    return await res.json();
  } catch (err: any) {
    console.error('API Kurai text error:', err);
    return {
      success: false,
      error: 'Failed to communicate with voice text assistant.',
    };
  }
}

/**
 * Shared chat function for backward compatibility
 */
export async function sendChatMessage(
  message: string,
  language: 'en' | 'ta' = 'en',
  scanContext?: Partial<DFUPredictionResult>,
  history: any[] = []
): Promise<{
  success: boolean;
  reply?: string;
  error?: string;
}> {
  return sendUraiChat(message, language, scanContext, history);
}

/**
 * POST /api/kurai/voice — Kurai AI Speech / Text-to-Speech endpoint
 */
export async function getKuraiVoice(
  text: string,
  language: 'en' | 'ta' = 'en'
): Promise<{
  success: boolean;
  audioBase64?: string;
  useBrowserSpeech?: boolean;
  mimeType?: string;
  language?: string;
  text?: string;
}> {
  try {
    const res = await fetch(`${API_BASE}/api/kurai/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, language }),
    });
    return await res.json();
  } catch (err) {
    console.error('API Kurai voice error:', err);
    return { success: true, useBrowserSpeech: true, text, language: language === 'ta' ? 'ta-IN' : 'en-US' };
  }
}

/**
 * Shared voice function for backward compatibility
 */
export async function getVoiceSpeech(
  text: string,
  language: 'en' | 'ta' = 'en'
): Promise<{
  success: boolean;
  audioBase64?: string;
  useBrowserSpeech?: boolean;
  mimeType?: string;
  language?: string;
  text?: string;
}> {
  return getKuraiVoice(text, language);
}

export async function fetchHospitals(
  district: string = 'all',
  type: string = 'ALL'
): Promise<Hospital[]> {
  try {
    const res = await fetch(`${API_BASE}/api/hospitals?district=${encodeURIComponent(district)}&type=${encodeURIComponent(type)}`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('API hospitals error:', err);
    return [];
  }
}

export async function fetchSources(): Promise<MedicalSource[]> {
  try {
    const res = await fetch(`${API_BASE}/api/sources`);
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('API sources error:', err);
    return [];
  }
}

export async function fetchResearchMetrics(): Promise<ModelBenchmarkMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/api/research`);
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    console.error('API research metrics error:', err);
    return null;
  }
}
