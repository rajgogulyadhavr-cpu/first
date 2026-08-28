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
  Menu, 
  Globe,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../data/translations';

interface NavbarProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  language,
  onLanguageChange,
  activeTab,
  onTabChange,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const t = translations[language];

  const quickNav = [
    { id: 'home', label: t.navHome, icon: Footprints },
    { id: 'scan', label: t.navScan, icon: Scan, isPrimary: true },
    { id: 'nurse', label: t.navNurse, icon: Bot, highlight: true },
    { id: 'healthcare', label: t.navHealthcare, icon: HospitalIcon },
  ];

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 border-b border-emerald-100/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Left: Sidebar Toggle Button & Brand */}
          <div className="flex items-center space-x-3">
            {/* Dedicated Left Slide Bar Toggle Button */}
            <button
              id="left-sidebar-toggle-btn"
              type="button"
              onClick={onToggleSidebar}
              className="p-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center space-x-1.5"
              aria-label="Toggle Left Sidebar"
              title="Toggle Left Navigation Slide Bar"
            >
              <PanelLeft className="w-5 h-5 text-emerald-700" />
              <span className="hidden sm:inline text-xs font-bold text-emerald-900">Menu</span>
            </button>

            {/* Brand Logo & Title */}
            <div
              id="brand-logo-btn"
              onClick={() => onTabChange('home')}
              className="flex items-center space-x-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Footprints className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-base md:text-lg font-black tracking-tight text-slate-900">
                    {t.appName}
                  </span>
                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    IWGDF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Header Navigation Shortcuts */}
          <nav className="hidden md:flex items-center space-x-2">
            {quickNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              if (item.isPrimary) {
                return (
                  <button
                    key={item.id}
                    id={`header-nav-${item.id}`}
                    onClick={() => onTabChange(item.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 flex items-center space-x-1.5 cursor-pointer transition-all hover:scale-105"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <button
                  key={item.id}
                  id={`header-nav-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : item.highlight
                      ? 'text-teal-700 bg-teal-50/70 hover:bg-teal-100/70'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Language Switcher */}
          <div className="flex items-center space-x-2.5">
            <div
              id="language-switcher-container"
              className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200/90 shadow-inner"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-1.5 mr-1" />
              <button
                id="lang-btn-en"
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <span className="text-slate-300 text-xs px-0.5">|</span>
              <button
                id="lang-btn-ta"
                type="button"
                onClick={() => onLanguageChange('ta')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'ta'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
