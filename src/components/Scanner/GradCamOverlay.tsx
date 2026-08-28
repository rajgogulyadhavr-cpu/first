import React, { useState } from 'react';
import { Eye, EyeOff, Layers, Sparkles, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../data/translations';

interface GradCamOverlayProps {
  imageUrl: string;
  heatmapPoints?: { x: number; y: number; intensity: number; radius: number }[];
  isLocalizationAvailable?: boolean;
  localizationDescriptionEn?: string;
  localizationDescriptionTa?: string;
  isAbnormal: boolean;
  language: Language;
}

export const GradCamOverlay: React.FC<GradCamOverlayProps> = ({
  imageUrl,
  heatmapPoints = [],
  isLocalizationAvailable = true,
  localizationDescriptionEn,
  localizationDescriptionTa,
  isAbnormal,
  language,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const t = translations[language];

  const hasValidPoints = isLocalizationAvailable && heatmapPoints && heatmapPoints.length > 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl group">
      {/* Base Foot Image */}
      <img
        src={imageUrl}
        alt="Scanned Foot"
        className="w-full h-72 sm:h-96 object-contain bg-slate-900"
      />

      {/* Grad-CAM Heatmap Layer (GREEN for NORMAL, RED for ABNORMAL) */}
      {showHeatmap && hasValidPoints && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{ opacity: opacity }}
        >
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {heatmapPoints.map((p, idx) => (
                <radialGradient
                  key={idx}
                  id={`gradcam-heat-${idx}`}
                  cx={`${p.x}%`}
                  cy={`${p.y}%`}
                  r={`${p.radius}%`}
                  fx={`${p.x}%`}
                  fy={`${p.y}%`}
                >
                  {isAbnormal ? (
                    <>
                      {/* RED Gradient for ABNORMAL / Ulcer lesion */}
                      <stop offset="0%" stopColor="#dc2626" stopOpacity={p.intensity} />
                      <stop offset="40%" stopColor="#ef4444" stopOpacity={p.intensity * 0.8} />
                      <stop offset="75%" stopColor="#f87171" stopOpacity={p.intensity * 0.35} />
                      <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
                    </>
                  ) : (
                    <>
                      {/* GREEN Gradient for NORMAL / Healthy intact skin */}
                      <stop offset="0%" stopColor="#10b981" stopOpacity={p.intensity} />
                      <stop offset="40%" stopColor="#059669" stopOpacity={p.intensity * 0.8} />
                      <stop offset="75%" stopColor="#34d399" stopOpacity={p.intensity * 0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </>
                  )}
                </radialGradient>
              ))}
            </defs>

            {heatmapPoints.map((p, idx) => (
              <circle
                key={idx}
                cx={`${p.x}`}
                cy={`${p.y}`}
                r={`${p.radius}`}
                fill={`url(#gradcam-heat-${idx})`}
                className="animate-pulse"
                style={{ animationDuration: '2.5s' }}
              />
            ))}
          </svg>
        </div>
      )}

      {/* If localization is unavailable, render clear non-fake notice */}
      {!hasValidPoints && (
        <div className="absolute top-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 border border-amber-500/40 text-amber-300 text-xs backdrop-blur-md flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {language === 'ta'
              ? 'AI இட அமைவு (Visual Localization) இந்த படத்தில் கிடைக்கவில்லை.'
              : 'AI visual localization is not reliably available for this scan.'}
          </span>
        </div>
      )}

      {/* Top Floating Result Badge */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-2">
        <div
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-lg backdrop-blur-md border ${
            isAbnormal
              ? 'bg-rose-950/90 text-rose-300 border-rose-600'
              : 'bg-emerald-950/90 text-emerald-300 border-emerald-600'
          }`}
        >
          <span>{isAbnormal ? '🔴' : '🟢'}</span>
          <span>
            {isAbnormal
              ? (language === 'ta' ? 'ABNORMAL — சாத்தியமான புண்' : 'ABNORMAL — Possible ulcer')
              : (language === 'ta' ? 'NORMAL — ஆரோக்கியமான தோல்' : 'NORMAL — Healthy skin')}
          </span>
        </div>
      </div>

      {/* Control Overlay Bar */}
      <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl backdrop-blur-md bg-slate-900/90 border border-white/10 text-white flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">Grad-CAM AI Attention</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
              isAbnormal
                ? 'bg-rose-950 text-rose-300 border border-rose-800'
                : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}
          >
            {isAbnormal ? '🔴 Red: Ulcer Region' : '🟢 Green: Healthy Skin'}
          </span>
        </div>

        {hasValidPoints && (
          <div className="flex items-center space-x-3">
            {showHeatmap && (
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] text-slate-300">Opacity</span>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-medium cursor-pointer"
            >
              {showHeatmap ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>{t.hideGradCam}</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t.viewGradCam}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Localization Description Footer */}
      {(localizationDescriptionEn || localizationDescriptionTa) && (
        <div className="bg-slate-900 border-t border-slate-800 px-3.5 py-2 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="text-slate-400 font-medium">Model Saliency:</span>
          <span className="text-right font-medium text-emerald-300">
            {language === 'ta' ? localizationDescriptionTa : localizationDescriptionEn}
          </span>
        </div>
      )}
    </div>
  );
};
