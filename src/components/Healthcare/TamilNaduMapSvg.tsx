import React, { useState } from 'react';
import { Hospital, Language } from '../../types';
import { Building2, ShieldCheck, MapPin, ExternalLink, Phone, Navigation } from 'lucide-react';

interface TamilNaduMapSvgProps {
  hospitals: Hospital[];
  selectedDistrict: string;
  onSelectDistrict: (district: string) => void;
  language: Language;
}

interface DistrictPin {
  id: string;
  nameEn: string;
  nameTa: string;
  x: number;
  y: number;
}

const DISTRICT_PINS: DistrictPin[] = [
  { id: 'chennai', nameEn: 'Chennai', nameTa: 'சென்னை', x: 80, y: 16 },
  { id: 'chengalpattu', nameEn: 'Chengalpattu', nameTa: 'செங்கல்பட்டு', x: 76, y: 22 },
  { id: 'vellore', nameEn: 'Vellore', nameTa: 'வேலூர்', x: 62, y: 20 },
  { id: 'salem', nameEn: 'Salem', nameTa: 'சேலம்', x: 48, y: 38 },
  { id: 'erode', nameEn: 'Erode', nameTa: 'ஈரோடு', x: 38, y: 46 },
  { id: 'tiruppur', nameEn: 'Tiruppur', nameTa: 'திருப்பூர்', x: 32, y: 52 },
  { id: 'coimbatore', nameEn: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', x: 22, y: 55 },
  { id: 'dindigul', nameEn: 'Dindigul', nameTa: 'திண்டுக்கல்', x: 42, y: 62 },
  { id: 'tiruchirappalli', nameEn: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', x: 55, y: 56 },
  { id: 'thanjavur', nameEn: 'Thanjavur', nameTa: 'தஞ்சாவூர்', x: 68, y: 58 },
  { id: 'madurai', nameEn: 'Madurai', nameTa: 'மதுரை', x: 45, y: 72 },
  { id: 'tirunelveli', nameEn: 'Tirunelveli', nameTa: 'திருநெல்வேலி', x: 38, y: 88 },
  { id: 'kanyakumari', nameEn: 'Kanyakumari', nameTa: 'கன்னியாகுமரி', x: 32, y: 95 },
];

export const TamilNaduMapSvg: React.FC<TamilNaduMapSvgProps> = ({
  hospitals,
  selectedDistrict,
  onSelectDistrict,
  language,
}) => {
  const [hoveredDistrict, setHoveredDistrict] = useState<DistrictPin | null>(null);

  const getDistrictStats = (districtName: string) => {
    const list = hospitals.filter(
      (h) => h.district.toLowerCase() === districtName.toLowerCase()
    );
    const govt = list.filter((h) => h.type === 'GOVERNMENT').length;
    const pvt = list.filter((h) => h.type === 'PRIVATE').length;
    return { total: list.length, govt, pvt, hospitals: list };
  };

  const activeStats = hoveredDistrict ? getDistrictStats(hoveredDistrict.nameEn) : null;

  return (
    <div id="tamil-nadu-map-container" className="relative w-full rounded-3xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-4 sm:p-6 overflow-hidden shadow-2xl flex flex-col items-center select-none">
      {/* Header Banner */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-extrabold text-white tracking-wide">
            {language === 'ta' ? 'தமிழ்நாடு சுகாதார வரைபடம் (Live Verified Network)' : 'Tamil Nadu Healthcare Network Map'}
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="flex items-center space-x-1 text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{language === 'ta' ? 'அரசு' : 'Government'}</span>
          </span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{language === 'ta' ? 'தனியார்' : 'Private'}</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">
            {language === 'ta' ? 'வடிகட்ட மாவட்டத்தை கிளிக் செய்க' : 'Click marker to filter'}
          </span>
        </div>
      </div>

      {/* Interactive SVG Map Container */}
      <div className="relative w-full max-w-lg h-84 sm:h-96 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full filter drop-shadow-[0_0_20px_rgba(16,185,129,0.12)]"
        >
          {/* Stylized Coastal & State Boundary for Tamil Nadu */}
          <path
            d="M 56 8
               Q 86 12 84 28
               Q 80 44 76 64
               Q 66 78 44 97
               Q 32 96 28 88
               Q 16 68 18 52
               Q 26 40 38 32
               Q 46 20 56 8 Z"
            fill="#0B132B"
            stroke="#047857"
            strokeWidth="1.5"
            strokeDasharray="2 1"
          />

          {/* Major district interconnect corridors */}
          <path
            d="M 80 16 L 62 20 L 48 38 L 55 56 L 45 72 L 38 88 L 32 95
               M 48 38 L 38 46 L 22 55
               M 55 56 L 68 58"
            fill="none"
            stroke="#1E293B"
            strokeWidth="0.8"
            strokeDasharray="1 1"
          />

          {/* District Pins */}
          {DISTRICT_PINS.map((d) => {
            const stats = getDistrictStats(d.nameEn);
            const isSelected = selectedDistrict.toLowerCase() === d.nameEn.toLowerCase();
            const isHovered = hoveredDistrict?.id === d.id;

            return (
              <g
                key={d.id}
                onClick={() => onSelectDistrict(isSelected ? 'all' : d.nameEn)}
                onMouseEnter={() => setHoveredDistrict(d)}
                onMouseLeave={() => setHoveredDistrict(null)}
                className="cursor-pointer group"
              >
                {/* Ping wave for active / selected district */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={d.x}
                    cy={d.y}
                    r="7"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.2"
                    className="animate-ping"
                    style={{ transformOrigin: `${d.x}px ${d.y}px` }}
                  />
                )}

                {/* Outer halo */}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r={isSelected ? '4.5' : isHovered ? '4' : '3.2'}
                  fill={
                    isSelected
                      ? '#10B981'
                      : stats.govt > 0 && stats.pvt > 0
                      ? '#0D9488'
                      : stats.govt > 0
                      ? '#2563EB'
                      : stats.pvt > 0
                      ? '#059669'
                      : '#475569'
                  }
                  stroke="#FFFFFF"
                  strokeWidth={isSelected || isHovered ? '1.2' : '0.8'}
                  className="transition-all duration-200 group-hover:scale-125"
                />

                {/* Inner Core */}
                <circle
                  cx={d.x}
                  cy={d.y}
                  r="1.2"
                  fill="#FFFFFF"
                />

                {/* Text Label */}
                <text
                  x={d.x > 50 ? d.x - 3 : d.x + 4}
                  y={d.y + 1.2}
                  textAnchor={d.x > 50 ? 'end' : 'start'}
                  fontSize="2.8"
                  fontWeight={isSelected ? 'bold' : '600'}
                  fill={isSelected ? '#34D399' : isHovered ? '#FFFFFF' : '#94A3B8'}
                  className="transition-colors group-hover:fill-white select-none pointer-events-none drop-shadow-sm font-sans"
                >
                  {language === 'ta' ? d.nameTa : d.nameEn} {stats.total > 0 ? `(${stats.total})` : ''}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Active Floating District Card */}
        {activeStats && hoveredDistrict && (
          <div className="absolute top-2 left-2 max-w-xs p-3 rounded-2xl bg-slate-900/95 backdrop-blur-md border border-slate-700 text-white text-xs shadow-xl pointer-events-none space-y-1.5 z-20 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-emerald-400 text-sm">
                {language === 'ta' ? hoveredDistrict.nameTa : hoveredDistrict.nameEn}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                {activeStats.total} {language === 'ta' ? 'மையங்கள்' : 'Centres'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] pt-0.5">
              <div className="flex items-center space-x-1 text-blue-300">
                <Building2 className="w-3 h-3 text-blue-400" />
                <span>{activeStats.govt} {language === 'ta' ? 'அரசு' : 'Govt'}</span>
              </div>
              <div className="flex items-center space-x-1 text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{activeStats.pvt} {language === 'ta' ? 'தனியார்' : 'Private'}</span>
              </div>
            </div>

            {activeStats.hospitals.length > 0 && (
              <div className="text-[10px] text-slate-300 pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">
                  {language === 'ta' ? 'முக்கிய மையம்: ' : 'Top Facility: '}
                </span>
                <span className="font-semibold text-slate-200">
                  {language === 'ta' ? activeStats.hospitals[0].nameTa : activeStats.hospitals[0].nameEn}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* District Quick Filter Chips */}
      <div className="w-full pt-3 mt-2 border-t border-slate-800 flex flex-wrap items-center justify-center gap-1.5 text-[11px]">
        <button
          type="button"
          onClick={() => onSelectDistrict('all')}
          className={`px-3 py-1 rounded-full border cursor-pointer transition-all ${
            selectedDistrict === 'all'
              ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
        >
          {language === 'ta' ? 'அனைத்து மாவட்டங்கள் (All)' : 'All Districts'}
        </button>

        {DISTRICT_PINS.map((d) => {
          const stats = getDistrictStats(d.nameEn);
          const isSelected = selectedDistrict.toLowerCase() === d.nameEn.toLowerCase();
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onSelectDistrict(isSelected ? 'all' : d.nameEn)}
              className={`px-2.5 py-0.5 rounded-full border cursor-pointer transition-all flex items-center space-x-1 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm scale-105'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{language === 'ta' ? d.nameTa : d.nameEn}</span>
              {stats.total > 0 && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-white/30 text-white' : 'bg-slate-900 text-emerald-400'
                }`}>
                  {stats.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

