import React from 'react';
import { PhoneCall, ShieldAlert, HeartPulse } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface EmergencyBannerProps {
  language: Language;
}

export const EmergencyBanner: React.FC<EmergencyBannerProps> = ({ language }) => {
  const t = translations[language];

  return (
    <div id="emergency-banner" className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white py-1.5 px-4 text-xs md:text-sm font-medium shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
          <span className="font-semibold">{t.emergencyHelpline}</span>
          <span className="hidden md:inline text-rose-100 font-normal">| {t.tnHelplineText}</span>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <a
            id="call-104-link"
            href="tel:104"
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full transition-colors font-semibold"
          >
            <PhoneCall className="w-3 h-3" />
            <span>104 Health Help</span>
          </a>
          <a
            id="call-108-link"
            href="tel:108"
            className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 backdrop-blur-md px-2.5 py-0.5 rounded-full transition-colors font-semibold"
          >
            <HeartPulse className="w-3 h-3" />
            <span>108 Ambulance</span>
          </a>
        </div>
      </div>
    </div>
  );
};
