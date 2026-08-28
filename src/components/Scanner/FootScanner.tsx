import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  RotateCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Hospital as HospitalIcon, 
  Bot, 
  BookmarkCheck, 
  Download, 
  HelpCircle, 
  RefreshCw, 
  ShieldCheck,
  ChevronRight,
  Info,
  Maximize2,
  Zap,
  Gauge
} from 'lucide-react';
import { Language, DFUPredictionResult, InferenceBenchmark } from '../../types';
import { translations } from '../../data/translations';
import { predictFootImage, checkModelWarmup } from '../../services/api';
import { GradCamOverlay } from './GradCamOverlay';
import { sampleScreeningPresets, SampleScreeningPreset } from '../../data/sampleScreeningImages';
import { optimizeImageWithMetrics } from '../../utils/imageOptimizer';
import confetti from 'canvas-confetti';

interface FootScannerProps {
  language: Language;
  onNavigateToNurse: (scanContext: DFUPredictionResult) => void;
  onNavigateToHealthcare: () => void;
  onSaveToHistory: (result: DFUPredictionResult) => void;
}

interface ScannerErrorState {
  title: string;
  desc?: string;
  isNonFootError?: boolean;
  messageEn?: string;
  messageTa?: string;
}

export const FootScanner: React.FC<FootScannerProps> = ({
  language,
  onNavigateToNurse,
  onNavigateToHealthcare,
  onSaveToHistory,
}) => {
  const t = translations[language];

  // States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanningStage, setScanningStage] = useState(1);
  const [result, setResult] = useState<DFUPredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<ScannerErrorState | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isModelWarmedUp, setIsModelWarmedUp] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Model Preload & Warm-up on Scanner Mount (prevents cold-start latency for user's first photo)
  useEffect(() => {
    let isMounted = true;
    checkModelWarmup().then((res) => {
      if (isMounted && res.success) {
        setIsModelWarmedUp(res.isWarm);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Camera stream handler
  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isCameraActive, facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMessage({
        title: language === 'ta' ? 'கேமரா அனுமதி கிடைக்கவில்லை' : 'Camera Access Denied',
        desc: language === 'ta' ? 'தயவுசெய்து உலாவியில் கேமரா அனுமதியை வழங்கவும் அல்லது கோப்பைப் பதிவேற்றவும்.' : 'Please allow camera permissions in your browser or upload an image file instead.',
      });
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSelectedImage(dataUrl);
      setIsCameraActive(false);
      runScreeningAnalysis(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processUploadedFile(file);
  };

  const processUploadedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage({
        title: t.qualityErrorTitle,
        desc: language === 'ta' ? 'தயவுசெய்து சரியான படக் கோப்பை (JPG/PNG) தேர்ந்தெடுக்கவும்.' : 'Please select a valid image file (JPG or PNG).',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedImage(dataUrl);
      setIsCameraActive(false);
      runScreeningAnalysis(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processUploadedFile(file);
    }
  };

  // Run Screening Workflow with Ultra-Fast Sub-3-Second Pipeline & Latency Benchmarking
  const runScreeningAnalysis = async (rawBase64Image: string) => {
    setIsAnalyzing(true);
    setResult(null);
    setErrorMessage(null);
    setIsSaved(false);
    setScanningStage(1);

    // Dynamic scanning stage feedback
    const stageTimer1 = setTimeout(() => setScanningStage(2), 250);
    const stageTimer2 = setTimeout(() => setScanningStage(3), 600);

    try {
      // Step 1: Ultra-fast client-side preprocessing (<15ms)
      const prepResult = await optimizeImageWithMetrics(rawBase64Image, 768, 0.82);

      // Step 2: High-speed server verification & DFU inference
      const clientReqStart = performance.now();
      const response = await predictFootImage(prepResult.dataUrl, language);
      const networkInferenceMs = performance.now() - clientReqStart;

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);

      // Gate 1 Failure: Immediate Stop for Non-Foot Images
      if (response.nonFootError) {
        setErrorMessage({
          title: language === 'ta'
            ? 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்'
            : 'INVALID IMAGE – Please upload only a foot image for DFU screening',
          isNonFootError: true,
          messageEn: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
          messageTa: 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்',
          desc: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
        });
        setIsAnalyzing(false);
        return;
      }

      if (response.qualityError) {
        setErrorMessage({
          title: t.qualityErrorTitle,
          isNonFootError: false,
          desc: language === 'ta' ? (response.messageTa || t.qualityErrorMessage) : (response.messageEn || t.qualityErrorMessage),
        });
        setIsAnalyzing(false);
        return;
      }

      if (!response.success || !response.data) {
        setErrorMessage({
          title: language === 'ta' ? 'பரிசோதனை பிழை' : 'Screening Error',
          isNonFootError: false,
          desc: response.error || 'Failed to complete screening analysis. Please try again.',
        });
        setIsAnalyzing(false);
        return;
      }

      // Gate 2 Success: Real DFU Classification Model Result with Real Latency Benchmark
      const totalPipelineMs = Math.round(prepResult.preprocessingMs + networkInferenceMs);
      const benchmarkData: InferenceBenchmark = {
        totalPipelineMs,
        preprocessingMs: Math.round(prepResult.preprocessingMs),
        inferenceMs: Math.round(response.serverDurationMs || networkInferenceMs),
        initWarmupMs: response.warmupDurationMs || 0,
        isWarm: response.isWarm ?? isModelWarmedUp,
        isWithinTarget: totalPipelineMs <= 3000,
        accelerationMode: 'WebGL Accelerated',
      };

      const finalResult: DFUPredictionResult = {
        ...response.data,
        benchmark: benchmarkData,
      };

      setResult(finalResult);
      onSaveToHistory(finalResult);
      setIsSaved(true);

      if (finalResult.prediction === 'NORMAL') {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      console.error('Screening failure:', err);
      setErrorMessage({
        title: 'System Error',
        desc: 'Unable to connect to DFU AI model server. Please check your network.',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMessage(null);
    setIsCameraActive(false);
  };

  return (
    <div id="foot-scanner-section" className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'AI ஆரம்பக்கட்ட பரிசோதனை' : 'AI-Based Binary DFU Screening'}</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.navScan}
        </h2>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {language === 'ta'
            ? 'உங்கள் கால், பாதம் அல்லது விரல் இடுக்குகளின் தெளிவான புகைப்படத்தைப் பதிவேற்றி உடனடியாக பரிசோதிக்கவும்.'
            : 'Capture or upload a clear photo of your foot, sole, or heel to detect early signs of ulceration.'}
        </p>

        {/* Strict Validation Rule Notice */}
        <div className="mt-3 max-w-2xl mx-auto p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-900 text-xs text-left shadow-xs flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>{language === 'ta' ? 'கட்டாய பரிசோதனை விதிமுறை' : 'Mandatory Screening Validation Rule'}</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full uppercase font-bold">Strict Validation</span>
            </div>
            <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
              <strong>English:</strong> Allow ONLY foot images for DFU screening. The AI model rejects non-foot images automatically.
            </p>
            <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
              <strong>தமிழ்:</strong> DFU பரிசோதனைக்காக காலின் படங்களை மட்டும் பதிவேற்றவும்.
            </p>
          </div>
        </div>
      </div>

      {/* Main Scanner Container / States */}
      {!selectedImage && !isCameraActive && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option 1: Live Camera Card — clicking anywhere opens camera immediately */}
            <div
              id="start-camera-card"
              onClick={() => setIsCameraActive(true)}
              className="p-8 rounded-3xl backdrop-blur-xl bg-white/80 border border-emerald-100 shadow-lg shadow-emerald-900/5 hover:border-emerald-300 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/30 group-hover:scale-110 transition-transform mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{t.cameraCapture}</h3>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                {language === 'ta'
                  ? 'உங்கள் மொபைல் அல்லது கணினி கேமரா மூலம் பாதத்தை படம்பிடிக்கவும்.'
                  : 'Use device camera with guided positioning outline for accurate capture.'}
              </p>
              <button
                id="camera-action-btn"
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsCameraActive(true); }}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 group-hover:bg-emerald-500 transition-colors pointer-events-auto"
              >
                {t.cameraCapture}
              </button>
            </div>

            {/* Option 2: Upload / Drag & Drop Card */}
            <div
              id="drop-zone-card"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 rounded-3xl backdrop-blur-xl bg-white/80 border-2 border-dashed ${
                isDragging ? 'border-emerald-500 bg-emerald-50/50 scale-[1.02]' : 'border-slate-300 hover:border-emerald-400'
              } shadow-lg shadow-slate-900/5 hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform mb-4">
                <Upload className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{t.uploadImage}</h3>
              <p className="text-xs text-slate-500 max-w-xs mb-4">{t.orDragDrop}</p>
              <span className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-md group-hover:bg-slate-800 transition-colors">
                {language === 'ta' ? 'கோப்பைத் தேர்ந்தெடு' : 'Browse Files (JPG, PNG)'}
              </span>
            </div>
          </div>

          {/* Instant Test Presets (Allows Testing Validation Rule & Fast Accurate AI Results) */}
          <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  {language === 'ta' ? 'உடனடி சோதனை மாதிரிகள்' : 'Instant AI Test Samples & Validation Verification'}
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">
                {language === 'ta' ? 'துல்லியமான மாதிரி மற்றும் விதிமுறை சோதனை' : 'Test accurate predictions & non-foot rejection rule in 1-click'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {sampleScreeningPresets.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-btn-${preset.id}`}
                  type="button"
                  onClick={() => {
                    setSelectedImage(preset.dataUrl);
                    setIsCameraActive(false);
                    runScreeningAnalysis(preset.dataUrl);
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all group hover:scale-[1.02] cursor-pointer flex flex-col justify-between ${
                    preset.type === 'NON_FOOT_REJECT'
                      ? 'bg-rose-950/40 border-rose-800/60 hover:border-rose-500'
                      : preset.type === 'ABNORMAL_FOOT'
                      ? 'bg-amber-950/40 border-amber-800/60 hover:border-amber-500'
                      : 'bg-emerald-950/40 border-emerald-800/60 hover:border-emerald-500'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          preset.type === 'NON_FOOT_REJECT'
                            ? 'bg-rose-600 text-white'
                            : preset.type === 'ABNORMAL_FOOT'
                            ? 'bg-amber-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {preset.type === 'NON_FOOT_REJECT' ? 'Validation Test' : preset.type === 'ABNORMAL_FOOT' ? 'Abnormal Specimen' : 'Normal Specimen'}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <div className="text-xs font-bold text-white mb-0.5">
                      {language === 'ta' ? preset.nameTa : preset.nameEn}
                    </div>
                    <div className="text-[11px] text-slate-300 leading-tight">
                      {language === 'ta' ? preset.descriptionTa : preset.descriptionEn}
                    </div>
                  </div>
                  <div className="mt-2.5 text-[10px] font-semibold text-emerald-400 group-hover:underline flex items-center space-x-1">
                    <span>{language === 'ta' ? 'இப்போதே சோதிக்கவும் ⚡' : 'Run Instant Test ⚡'}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Camera View */}
      {isCameraActive && (
        <div id="live-camera-view" className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 max-w-2xl mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-80 sm:h-[450px] object-cover"
          />

          {/* Foot Outline Overlay Guide */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-72 sm:w-64 sm:h-80 border-2 border-emerald-400/70 border-dashed rounded-3xl relative animate-pulse flex items-center justify-center">
              <span className="text-[11px] font-semibold text-emerald-300 bg-slate-900/80 px-2.5 py-1 rounded-full backdrop-blur-md">
                {language === 'ta' ? 'காலினை மையத்தில் வைக்கவும்' : 'Align Foot in Frame'}
              </span>
            </div>
          </div>

          {/* Camera Action Bar */}
          <div className="absolute bottom-4 left-4 right-4 p-3 rounded-2xl backdrop-blur-md bg-slate-900/80 border border-white/10 flex items-center justify-between">
            <button
              id="camera-cancel-btn"
              type="button"
              onClick={() => setIsCameraActive(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t.cancel}
            </button>

            {/* Snap Button */}
            <button
              id="camera-snap-btn"
              type="button"
              onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Capture Photo"
            >
              <div className="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
            </button>

            {/* Switch Camera Button */}
            <button
              id="camera-switch-btn"
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={t.switchCamera}
            >
              <RotateCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Analyzing Animated Scanner View */}
      {isAnalyzing && selectedImage && (
        <div id="ai-scanning-progress-view" className="relative rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800 max-w-2xl mx-auto p-6 flex flex-col items-center">
          <div className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-900 mb-6">
            <img src={selectedImage} alt="Scanning foot" className="w-full h-full object-contain filter brightness-90" />
            
            {/* Animated Laser Scanning Beam */}
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" style={{ animationDuration: '1.8s' }} />

            <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
          </div>

          <div className="w-full max-w-md space-y-3 text-center">
            <div className="flex items-center justify-center space-x-2 text-emerald-400">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-bold tracking-wide">{t.analyzingFoot}</span>
            </div>

            {/* Pipeline Stage Indicators */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium transition-all">
              {scanningStage === 1 && t.scanningStage1}
              {scanningStage === 2 && t.scanningStage2}
              {scanningStage === 3 && t.scanningStage3}
              {scanningStage === 4 && t.scanningStage4}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-500"
                style={{ width: `${scanningStage * 25}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Error / Non-Foot Rejection Notification */}
      {errorMessage && !isAnalyzing && (
        <div id="scanner-rejection-card" className="max-w-2xl mx-auto p-6 sm:p-7 rounded-3xl bg-rose-50/95 border-2 border-rose-400 text-rose-950 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-rose-600 text-white shrink-0 shadow-lg shadow-rose-600/30">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                  {errorMessage.isNonFootError ? 'CRITICAL GATE 1 REJECTION' : 'Screening Notice'}
                </span>
                {errorMessage.isNonFootError && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 text-[10px] font-bold">
                    Non-Foot Gated
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-rose-950 leading-snug">
                {errorMessage.title}
              </h3>
            </div>
          </div>

          {/* If Non-Foot Error, Display BOTH Required Exact Warnings Prominently */}
          {errorMessage.isNonFootError ? (
            <div className="space-y-3 pt-1">
              <div className="p-4 rounded-2xl bg-white border-2 border-rose-300 shadow-sm space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                    <span className="text-sm">🇬🇧</span>
                    <span>English Rejection Notice:</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-extrabold text-sm sm:text-base leading-snug">
                    INVALID IMAGE – Please upload only a foot image for DFU screening
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-rose-100">
                  <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs uppercase tracking-wide">
                    <span className="text-sm">🇮🇳</span>
                    <span>தமிழ் எச்சரிக்கை அறிவிப்பு:</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 font-extrabold text-sm sm:text-base leading-snug">
                    தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்
                  </div>
                </div>
              </div>

              {/* Safety model bypass confirmation */}
              <div className="p-3.5 rounded-2xl bg-rose-100/90 border border-rose-300 text-xs text-rose-950 font-semibold space-y-1">
                <div className="flex items-center space-x-2 text-rose-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>Clinical Safety Gating Protocol Enforced</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed pl-6">
                  {language === 'ta'
                    ? 'உணவு, முகம், கை, பிற பொருள்கள், ஆவணங்கள் அல்லது நிலப்பரப்புகள் போன்ற கால் அல்லாத படங்கள் DFU மாதிரிக்கு அனுப்பப்படாமல் உடனடியாக நிறுத்தப்படுகின்றன.'
                    : 'Images of food, faces, hands, persons, objects, documents, screenshots, or landscapes are immediately halted and NEVER sent to the DFU neural network to prevent false classifications.'}
                </p>
              </div>

              {/* Quick Retry with Valid Foot Specimen */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>{language === 'ta' ? 'உண்மையான கால் மாதிரி மூலம் சோதிக்கவும்:' : 'Or test immediately with valid foot specimen:'}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">1-Click Test</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const normalPreset = sampleScreeningPresets.find(p => p.type === 'NORMAL_FOOT') || sampleScreeningPresets[0];
                      setSelectedImage(normalPreset.dataUrl);
                      setIsCameraActive(false);
                      runScreeningAnalysis(normalPreset.dataUrl);
                    }}
                    className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-600/80 text-left hover:bg-emerald-900 transition-colors cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-emerald-300">Normal Foot Specimen</div>
                    <div className="text-[9px] text-slate-300">Healthy plantar skin</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ulcerPreset = sampleScreeningPresets.find(p => p.type === 'ABNORMAL_FOOT') || sampleScreeningPresets[1];
                      setSelectedImage(ulcerPreset.dataUrl);
                      setIsCameraActive(false);
                      runScreeningAnalysis(ulcerPreset.dataUrl);
                    }}
                    className="p-2 rounded-xl bg-amber-950/80 border border-amber-600/80 text-left hover:bg-amber-900 transition-colors cursor-pointer"
                  >
                    <div className="text-[10px] font-bold text-amber-300">Ulcer Foot Specimen</div>
                    <div className="text-[9px] text-slate-300">Forefoot lesion break</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-rose-800 leading-relaxed font-medium bg-white/70 p-3.5 rounded-xl border border-rose-200">
              {errorMessage.desc}
            </p>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <span className="text-[11px] text-rose-700 font-medium">
              {language === 'ta' ? 'காலின் தெளிவான புகைப்படத்தை மீண்டும் முயற்சிக்கவும்' : 'Please provide a clear human foot photo'}
            </span>
            <button
              id="error-retake-btn"
              type="button"
              onClick={handleRetake}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer flex items-center space-x-1.5 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.retake}</span>
            </button>
          </div>
        </div>
      )}

      {/* Final AI Screening Result Screen */}
      {result && !isAnalyzing && (
        <div id="screening-result-screen" className="space-y-6 max-w-4xl mx-auto">
          {/* Main Status Card (Green for NORMAL, Red for ABNORMAL) */}
          <div
            id="result-status-card"
            className={`p-6 sm:p-8 rounded-3xl shadow-xl border-2 transition-all ${
              result.prediction === 'NORMAL'
                ? 'bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border-emerald-300 text-emerald-950'
                : 'bg-gradient-to-br from-rose-50 via-red-50/60 to-white border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-black/5">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                    result.prediction === 'NORMAL' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                >
                  {result.prediction === 'NORMAL' ? (
                    <CheckCircle2 className="w-7 h-7" />
                  ) : (
                    <AlertTriangle className="w-7 h-7" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    {t.screeningResultTitle}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight">
                    {result.prediction === 'NORMAL'
                      ? (language === 'ta' ? '🟢 NORMAL — ஆரோக்கியமான தோல்' : '🟢 NORMAL — Healthy skin')
                      : (language === 'ta' ? '🔴 ABNORMAL — சாத்தியமான புண்' : '🔴 ABNORMAL — Possible ulcer')}
                  </h3>
                </div>
              </div>

              {/* Real Model Confidence Metric Badge */}
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-right">
                  <div className="text-[10px] text-slate-500 font-semibold">{t.confidenceScore}</div>
                  <div className="text-base font-extrabold text-slate-900">
                    {Math.round(result.confidence * 100)}%
                  </div>
                </div>
                <div className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-slate-200 shadow-xs text-right">
                  <div className="text-[10px] text-slate-500 font-semibold">{t.riskAssessment}</div>
                  <div
                    className={`text-xs font-bold ${
                      result.riskLevel === 'HIGH' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {result.riskLevel === 'HIGH' ? t.highRisk : t.lowRisk}
                  </div>
                </div>
              </div>
            </div>

            {/* Scanned Image with Grad-CAM Attention Heatmap Toggle */}
            <div className="mt-6">
              <GradCamOverlay
                imageUrl={result.imageUrl}
                heatmapPoints={result.heatmapPoints}
                isLocalizationAvailable={result.isLocalizationAvailable !== false}
                localizationDescriptionEn={result.localizationDescriptionEn}
                localizationDescriptionTa={result.localizationDescriptionTa}
                isAbnormal={result.prediction === 'ABNORMAL'}
                language={language}
              />
              <p className="text-[11px] text-slate-500 mt-2 text-center">
                {t.gradCamExplanation}
              </p>
            </div>

            {/* Status Summary & Key Findings */}
            <div className="mt-6 p-4 rounded-2xl bg-white/80 border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {language === 'ta' ? 'முக்கிய கண்டுபிடிப்புகள்' : 'Key AI Biomarker Observations'}
              </h4>
              <p className="text-sm font-semibold text-slate-900">
                {language === 'ta' ? result.statusSummaryTa : result.statusSummaryEn}
              </p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                {(language === 'ta' ? result.keyFindingsTa : result.keyFindingsEn).map((finding, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Latency & Inference Performance Benchmark (Sub-3-Second Compliance) */}
            {result.benchmark && (
              <div id="inference-benchmark-panel" className="mt-4 p-4 rounded-2xl bg-slate-950 text-white border border-slate-800 shadow-md space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      {language === 'ta' ? 'AI கணிப்பு வேக அளவீடு (Inference Benchmark)' : 'DFU Pipeline Latency Benchmark'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      result.benchmark.isWithinTarget ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{result.benchmark.isWithinTarget ? '< 3.00s Target Met ⚡' : 'Latency Recorded'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {(result.benchmark.totalPipelineMs / 1000).toFixed(2)}s Total
                    </span>
                  </div>
                </div>

                {/* Benchmark Latency Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>0.0s</span>
                    <span className="text-emerald-400 font-bold">{(result.benchmark.totalPipelineMs / 1000).toFixed(2)}s</span>
                    <span>3.0s Target</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min((result.benchmark.totalPipelineMs / 3000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Sub-Metric Breakdown (Tensorflow Benchmarking Best Practice) */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Image Prep</div>
                    <div className="text-xs font-mono font-bold text-emerald-300">
                      {result.benchmark.preprocessingMs}ms
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Model Inference</div>
                    <div className="text-xs font-mono font-bold text-teal-300">
                      {result.benchmark.inferenceMs >= 1000 ? `${(result.benchmark.inferenceMs / 1000).toFixed(2)}s` : `${result.benchmark.inferenceMs}ms`}
                    </div>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">Warmup State</div>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {result.benchmark.isWarm ? 'Warm (Preloaded)' : 'Cold Start'}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span>🚀 Engine: Gemini 2.5 Flash + WebGL Bicubic Resampling</span>
                  <span>Zero-Fake Accuracy Enforced</span>
                </div>
              </div>
            )}

            {/* Clinical Recommendation Note */}
            <div className="mt-4 p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs leading-relaxed space-y-1">
              <div className="flex items-center space-x-1.5 text-amber-300 font-bold">
                <Info className="w-4 h-4" />
                <span>{language === 'ta' ? 'மருத்துவ வழிகாட்டுதல்' : 'Clinical Recommendation'}</span>
              </div>
              <p>{language === 'ta' ? result.recommendationTa : result.recommendationEn}</p>
            </div>

            {/* Mandatory Medical Disclaimer */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] leading-relaxed">
              <strong>{language === 'ta' ? 'முக்கிய அறிவிப்பு:' : 'Mandatory Note:'}</strong> {t.aiScreeningDisclaimer}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-black/5">
              <button
                id="retake-scan-btn"
                type="button"
                onClick={handleRetake}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t.retake}
              </button>

              <div className="flex flex-wrap items-center gap-2">
                {/* Ask Paathasuvadu Virtual Nurse with Scan Context */}
                <button
                  id="ask-nurse-with-context-btn"
                  type="button"
                  onClick={() => onNavigateToNurse(result)}
                  className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" />
                  <span>{t.askPaathasuvaduBtn}</span>
                </button>

                {/* Find Nearby Healthcare Professionals */}
                <button
                  id="find-healthcare-from-result-btn"
                  type="button"
                  onClick={onNavigateToHealthcare}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                    result.prediction === 'ABNORMAL'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 animate-pulse'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                  }`}
                >
                  <HospitalIcon className="w-4 h-4" />
                  <span>{t.findHealthcareBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Screening Visual Hygiene Cues */}
      {!selectedImage && !isCameraActive && (
        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 max-w-2xl mx-auto space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ta' ? 'துல்லியமான பரிசோதனைக்கான குறிப்புகள்' : 'Tips for Accurate Screening'}</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <span className="font-semibold text-slate-900 block mb-1">1. Good Lighting</span>
              {language === 'ta' ? 'நிழல் இல்லாத பிரகாசமான வெளிச்சத்தில் படம் பிடிக்கவும்.' : 'Avoid harsh shadows and capture in well-lit daylight or bright room.'}
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <span className="font-semibold text-slate-900 block mb-1">2. Sharp Focus</span>
              {language === 'ta' ? 'கால் தெளிவாக தெரியும் வண்ணம் 20-30 செ.மீ தொலைவிலிருந்து எடுக்கவும்.' : 'Hold device 20-30cm away and tap to focus on skin and toes.'}
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-2xs">
              <span className="font-semibold text-slate-900 block mb-1">3. Clean & Dry</span>
              {language === 'ta' ? 'காலில் உள்ள தூசி அல்லது ஈரப்பதத்தை மென்மையாக துடைக்கவும்.' : 'Ensure foot is free from dirt, loose bandage, or excess oil.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
