import React from 'react';
import { Language } from '../../types';

interface FootAnatomyDiagramProps {
  language: Language;
}

export const FootAnatomyDiagram: React.FC<FootAnatomyDiagramProps> = ({ language }) => {
  return (
    <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/80 border border-emerald-100 shadow-xl space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* SVG Diagram */}
        <div className="relative flex justify-center items-center bg-slate-900 rounded-2xl p-6 shadow-inner">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 460" className="w-full max-w-xs h-auto">
            <defs>
              <linearGradient id="footSkin" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <radialGradient id="highPressure" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="medPressure" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Plantar Foot Contour */}
            <path
              d="M 180 60 C 130 60 100 110 100 180 C 100 240 120 300 110 360 C 105 390 125 420 180 420 C 235 420 255 390 250 360 C 240 300 260 240 260 180 C 260 110 230 60 180 60 Z"
              fill="url(#footSkin)"
              stroke="#10b981"
              strokeWidth="2"
            />

            {/* Toes */}
            <ellipse cx="130" cy="50" rx="14" ry="20" fill="#334155" stroke="#10b981" strokeWidth="1.5" />
            <ellipse cx="162" cy="42" rx="11" ry="17" fill="#334155" stroke="#10b981" strokeWidth="1.5" />
            <ellipse cx="190" cy="45" rx="10" ry="15" fill="#334155" stroke="#10b981" strokeWidth="1.5" />
            <ellipse cx="215" cy="52" rx="9" ry="13" fill="#334155" stroke="#10b981" strokeWidth="1.5" />
            <ellipse cx="236" cy="65" rx="8" ry="11" fill="#334155" stroke="#10b981" strokeWidth="1.5" />

            {/* Pressure Zones (DFU Hotspots) */}
            {/* 1st Metatarsal Head (High Risk Zone) */}
            <circle cx="145" cy="155" r="32" fill="url(#highPressure)" />
            <circle cx="145" cy="155" r="5" fill="#ef4444" />
            
            {/* Heel (High Risk Zone) */}
            <circle cx="180" cy="380" r="35" fill="url(#highPressure)" />
            <circle cx="180" cy="380" r="5" fill="#ef4444" />

            {/* Hallux / Great Toe (Med Risk Zone) */}
            <circle cx="130" cy="50" r="16" fill="url(#medPressure)" />

            {/* Labels and Pins */}
            <line x1="145" y1="155" x2="50" y2="155" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="50" cy="155" r="4" fill="#ef4444" />
            <text x="45" y="145" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="start">Forefoot (57%)</text>

            <line x1="180" y1="380" x2="290" y2="380" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="290" cy="380" r="4" fill="#ef4444" />
            <text x="295" y="375" fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="end">Heel (19%)</text>

            <line x1="130" y1="50" x2="50" y2="50" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="50" cy="50" r="4" fill="#f59e0b" />
            <text x="45" y="40" fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="start">Toes (15%)</text>
          </svg>
        </div>

        {/* Anatomical Information & Risk Metrics */}
        <div className="space-y-4 text-slate-800">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <h4 className="text-sm font-bold text-emerald-950 mb-1">
              {language === 'ta' ? 'அதிக ஆபத்து உள்ள மண்டலங்கள் (Anatomical Hotspots)' : 'Primary Diabetic Ulcer Hotspots'}
            </h4>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {language === 'ta'
                ? '85% நீரிழிவு பாத புண்கள் முன்பாதம் (Forefoot 57%), குதிங்கால் (Heel 19%) மற்றும் விரல்களில் (Toes 15%) ஏற்படுகின்றன.'
                : 'Over 85% of diabetic foot ulcers develop under peak plantar pressure areas: forefoot metatarsal heads (57%), heel plantar surface (19%), and toe tips (15%).'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Neuropathy</span>
              <span className="text-slate-600 text-[11px]">Loss of protective sensation (LOPS) in nerve endings.</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200">
              <span className="font-bold text-slate-900 block mb-0.5">Ischemia</span>
              <span className="text-slate-600 text-[11px]">Peripheral artery disease reducing dermal blood flow.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
