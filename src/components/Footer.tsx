import React from 'react';
import { Footprints, ShieldCheck, Heart, ExternalLink, PhoneCall } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface FooterProps {
  language: Language;
  onTabChange: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ language, onTabChange }) => {
  const t = translations[language];

  return (
    <footer id="app-footer" className="mt-16 bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Purpose */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md">
                <Footprints className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">{t.appName}</span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              {language === 'ta'
                ? 'நீரிழிவு கால் புண்களை ஆரம்பத்திலேயே கண்டறிந்து தீவிர உறுப்பு இழப்பு சிக்கல்களைத் தடுக்கும் ஸ்மார்ட் AI நல்வாழ்வு அமைப்பு. IWGDF 2023 சர்வதேச வழிகாட்டுதல்களின் அடிப்படையில் உருவாக்கப்பட்டது.'
                : 'Smart AI-Based Early Screening & Prevention Decision-Support System for Diabetic Foot Ulcers, powered by IWGDF 2023 Guidelines and WHO standards.'}
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Evidence-based clinical guidelines & authentic Tamil Nadu hospital directory</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {language === 'ta' ? 'முக்கிய பக்கங்கள்' : 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  id="footer-nav-scan"
                  onClick={() => onTabChange('scan')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.navScan}
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-care"
                  onClick={() => onTabChange('care')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.navCare}
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-diet"
                  onClick={() => onTabChange('diet')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.navDiet}
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-hospitals"
                  onClick={() => onTabChange('healthcare')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.navHealthcare}
                </button>
              </li>
              <li>
                <button
                  id="footer-nav-nurse"
                  onClick={() => onTabChange('nurse')}
                  className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  {t.navNurse}
                </button>
              </li>
            </ul>
          </div>

          {/* Emergency & Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              {language === 'ta' ? 'அவசர உதவி எண்கள்' : 'Emergency Helplines'}
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 mb-0.5">Tamil Nadu Health Advice</div>
                <a href="tel:104" className="text-emerald-400 font-bold text-sm flex items-center space-x-1">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>104 (24x7 Toll-Free)</span>
                </a>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <div className="text-slate-400 mb-0.5">Emergency Ambulance</div>
                <a href="tel:108" className="text-rose-400 font-bold text-sm flex items-center space-x-1">
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>108 (24x7 Emergency)</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Prominent Medical Disclaimer */}
        <div id="footer-medical-disclaimer" className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-400 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-300">
            {language === 'ta' ? '⚠️ மருத்துவ மறுப்புரை (Medical Disclaimer):' : '⚠️ Medical Screening Disclaimer:'}
          </p>
          <p>
            {language === 'ta'
              ? 'FootGuard AI என்பது ஒரு கல்வி மற்றும் ஆரம்பக்கட்ட AI பரிசோதனை முடிவு மட்டுமே. இது மருத்துவரின் நேரடி பரிசோதனைக்கு மாற்று அல்ல. காலில் ஏதேனும் வலி, சிவத்தல், வெடிப்பு அல்லது புண் தென்பட்டால் உடனடியாக தகுதியான மருத்துவர் அல்லது பாத சிகிச்சை நிபுணரை அணுகவும்.'
              : 'FootGuard AI is an automated AI screening and educational decision-support application. It does NOT provide a final medical diagnosis or replace clinical examination by a licensed physician or podiatrist. For persistent redness, non-healing sores, numbness, or discharge, seek professional clinical evaluation immediately.'}
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} FootGuard AI. Student Healthcare Innovation Initiative.
          </div>
          <div className="flex items-center space-x-1">
            <span>Powered by</span>
            <span className="text-slate-300 font-semibold">IWGDF 2023 Guidelines</span>
            <span>& WHO Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
