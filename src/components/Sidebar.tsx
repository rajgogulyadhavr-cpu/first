import React from 'react';
import { 
  Footprints, 
  Scan, 
  Sparkles, 
  Apple, 
  BookOpen, 
  Hospital as HospitalIcon, 
  Bot, 
  History, 
  Cpu, 
  X,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  ShieldCheck,
  Globe,
  Activity,
  HeartPulse,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface SidebarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  historyCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
  historyCount = 0,
}) => {
  const t = translations[language];

  const mainNav = [
    { id: 'home', label: t.navHome, labelTa: 'முகப்பு', icon: Footprints, desc: 'Overview & Quick Access' },
    { id: 'scan', label: t.navScan, labelTa: 'AI கால் ஸ்கேன்', icon: Scan, isPrimary: true, desc: 'Binary Screening & Heatmap' },
    { id: 'nurse', label: t.navNurse, labelTa: 'பாதாரசுவடு செவிலியர் AI', icon: Bot, isVoice: true, desc: 'Voice-to-Voice Companion' },
    { id: 'history', label: t.navHistory, labelTa: 'பரிசோதனை வரலாறு', icon: History, badge: historyCount > 0 ? historyCount : undefined, desc: 'Saved Screening Records' },
  ];

  const clinicalNav = [
    { id: 'care', label: t.navCare, labelTa: 'தினசரி பராமரிப்பு', icon: Sparkles, desc: 'IWGDF 7-Step Protocol' },
    { id: 'diet', label: t.navDiet, labelTa: 'உணவு & ஊட்டச்சத்து', icon: Apple, desc: 'Tamil Diabetic Nutrition' },
    { id: 'dfu', label: t.navDFU, labelTa: 'புண் மருத்துவ தகவல்', icon: BookOpen, desc: 'Pathology & Wagner Scale' },
  ];

  const networkNav = [
    { id: 'healthcare', label: t.navHealthcare, labelTa: 'மருத்துவமனைகள்', icon: HospitalIcon, desc: 'TN Diabetology Centres' },
    { id: 'research', label: t.navResearch, labelTa: 'ஆராய்ச்சி & தரவு', icon: Cpu, desc: 'DFUC2020 Benchmarks' },
  ];

  const handleItemClick = (id: string) => {
    onTabChange(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity duration-300 animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <aside
        id="app-left-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white/95 backdrop-blur-2xl border-r border-emerald-100 shadow-2xl transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isCollapsed ? 'lg:w-20' : 'w-72 sm:w-80 lg:w-72'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 md:h-20 px-4 flex items-center justify-between border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/60 to-teal-50/40">
          <div
            id="sidebar-brand-btn"
            onClick={() => handleItemClick('home')}
            className={`flex items-center space-x-3 cursor-pointer group overflow-hidden ${
              isCollapsed ? 'justify-center w-full' : ''
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/25 shrink-0 group-hover:scale-105 transition-transform">
              <Footprints className="w-5 h-5" />
            </div>

            {!isCollapsed && (
              <div className="min-w-0 transition-opacity duration-200">
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-slate-900 tracking-tight text-base truncate">
                    {t.appName}
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                    AI
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 font-medium truncate">
                  IWGDF 2023 Guidelines
                </p>
              </div>
            )}
          </div>

          {/* Close button on mobile / Collapse toggle button on Desktop */}
          <div className="flex items-center">
            {/* Mobile close */}
            <button
              id="sidebar-close-mobile-btn"
              type="button"
              onClick={onClose}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            <button
              id="sidebar-collapse-desktop-btn"
              type="button"
              onClick={onToggleCollapse}
              className={`hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
          {/* Group 1: Core AI & Screening */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {language === 'ta' ? 'முதன்மை சேவைகள்' : 'Core Screening'}
              </div>
            )}
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'ta' ? item.labelTa : item.label;

              if (item.isPrimary) {
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    type="button"
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full group relative flex items-center rounded-2xl transition-all cursor-pointer shadow-md ${
                      isCollapsed ? 'p-3 justify-center' : 'p-3 space-x-3'
                    } ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30 scale-[1.02]'
                        : 'bg-gradient-to-r from-emerald-600/90 to-teal-600/90 text-white hover:from-emerald-600 hover:to-teal-600 shadow-emerald-600/20'
                    }`}
                    title={label}
                  >
                    <Icon className="w-5 h-5 shrink-0 text-white animate-pulse" />
                    {!isCollapsed && (
                      <div className="text-left flex-1 min-w-0">
                        <div className="text-xs font-bold leading-tight">{label}</div>
                        <div className="text-[10px] text-emerald-100 opacity-90 truncate">
                          {item.desc}
                        </div>
                      </div>
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full group relative flex items-center rounded-2xl transition-all cursor-pointer ${
                    isCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5 space-x-3'
                  } ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs font-bold'
                      : item.isVoice
                      ? 'text-teal-700 hover:bg-teal-50/80 bg-teal-50/40 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                  title={label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive
                        ? 'text-emerald-600'
                        : item.isVoice
                        ? 'text-teal-600'
                        : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate flex-1 text-left">{label}</span>
                  )}
                  {!isCollapsed && item.badge !== undefined && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="absolute right-1 w-1.5 h-5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Group 2: Clinical Guidelines & Care */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {language === 'ta' ? 'மருத்துவ வழிகாட்டல்' : 'Clinical Care & Diet'}
              </div>
            )}
            {clinicalNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'ta' ? item.labelTa : item.label;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full group relative flex items-center rounded-2xl transition-all cursor-pointer ${
                    isCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5 space-x-3'
                  } ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                  title={label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate flex-1 text-left">{label}</span>
                  )}
                  {isActive && (
                    <div className="absolute right-1 w-1.5 h-5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Group 3: Healthcare Network & Research */}
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-slate-400">
                {language === 'ta' ? 'நெட்வொர்க் & ஆராய்ச்சி' : 'Hospitals & Specs'}
              </div>
            )}
            {networkNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const label = language === 'ta' ? item.labelTa : item.label;

              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  type="button"
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full group relative flex items-center rounded-2xl transition-all cursor-pointer ${
                    isCollapsed ? 'p-3 justify-center' : 'px-3 py-2.5 space-x-3'
                  } ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs font-bold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 font-medium'
                  }`}
                  title={label}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="text-xs truncate flex-1 text-left">{label}</span>
                  )}
                  {isActive && (
                    <div className="absolute right-1 w-1.5 h-5 bg-emerald-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Emergency Card in Expanded Sidebar */}
          {!isCollapsed && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50 border border-rose-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                <span>TN Emergency Helpline</span>
              </div>
              <p className="text-[11px] text-rose-900 leading-tight">
                24x7 Government Medical Advisory
              </p>
              <div className="flex items-center space-x-2 pt-1">
                <a
                  id="sidebar-call-104"
                  href="tel:104"
                  className="flex-1 py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold text-center transition-colors shadow-xs"
                >
                  Call 104
                </a>
                <a
                  id="sidebar-call-108"
                  href="tel:108"
                  className="flex-1 py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold text-center transition-colors shadow-xs"
                >
                  Call 108
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Footer with Language Switcher */}
        <div className="p-3 border-t border-emerald-100 bg-slate-50/80 flex items-center justify-between">
          {!isCollapsed ? (
            <>
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Globe className="w-3.5 h-3.5" />
                <span className="font-semibold text-[11px]">Language</span>
              </div>
              <div className="flex items-center p-1 rounded-xl bg-white border border-slate-200 shadow-xs">
                <button
                  id="sidebar-lang-en"
                  type="button"
                  onClick={() => onLanguageChange('en')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'en'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  EN
                </button>
                <button
                  id="sidebar-lang-ta"
                  type="button"
                  onClick={() => onLanguageChange('ta')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    language === 'ta'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => onLanguageChange(language === 'en' ? 'ta' : 'en')}
              className="w-full py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-emerald-700 text-center hover:bg-emerald-50 cursor-pointer"
              title="Toggle Language (EN / தமிழ்)"
            >
              {language === 'en' ? 'EN' : 'தமிழ்'}
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
