import React, { useState, useEffect } from 'react';
import { Language, DFUPredictionResult } from './types';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmergencyBanner } from './components/EmergencyBanner';
import { Footer } from './components/Footer';
import { HomeHero } from './components/Home/HomeHero';
import { FootScanner } from './components/Scanner/FootScanner';
import { PaathasuvaduNurse } from './components/Nurse/PaathasuvaduNurse';
import { DailyFootCare } from './components/Care/DailyFootCare';
import { DietNutrition } from './components/Diet/DietNutrition';
import { DFUInformation } from './components/DFUInfo/DFUInformation';
import { HealthcareFinder } from './components/Healthcare/HealthcareFinder';
import { ScanHistory } from './components/History/ScanHistory';
import { TechnicalResearch } from './components/Research/TechnicalResearch';

const STORAGE_KEY_HISTORY = 'footguard_ai_scan_history';
const STORAGE_KEY_LANG = 'footguard_ai_lang';
const STORAGE_KEY_SIDEBAR_COLLAPSED = 'footguard_ai_sidebar_collapsed';

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const [activeTab, setActiveTab] = useState<string>('home');
  const [scanHistory, setScanHistory] = useState<DFUPredictionResult[]>([]);
  const [activeScanContext, setActiveScanContext] = useState<DFUPredictionResult | null>(null);
  
  // Left Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Load language, scan history and sidebar preference from localStorage
  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
      if (savedLang === 'en' || savedLang === 'ta') {
        setLanguage(savedLang as Language);
      }

      const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        setScanHistory(JSON.parse(savedHistory));
      }

      const savedCollapsed = localStorage.getItem(STORAGE_KEY_SIDEBAR_COLLAPSED);
      if (savedCollapsed !== null) {
        setIsSidebarCollapsed(savedCollapsed === 'true');
      }
    } catch (e) {
      console.warn('LocalStorage load error:', e);
    }
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY_LANG, lang);
    } catch {
      // ignore
    }
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const nextVal = !prev;
      try {
        localStorage.setItem(STORAGE_KEY_SIDEBAR_COLLAPSED, String(nextVal));
      } catch {
        // ignore
      }
      return nextVal;
    });
  };

  const handleSaveToHistory = (result: DFUPredictionResult) => {
    setScanHistory((prev) => {
      const updated = [result, ...prev.filter((item) => item.id !== result.id)].slice(0, 30);
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save error:', e);
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    if (window.confirm(language === 'ta' ? 'அனைத்து பரிசோதனை வரலாற்றையும் நீக்க விரும்புகிறீர்களா?' : 'Are you sure you want to clear all screening history?')) {
      setScanHistory([]);
      try {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
      } catch {
        // ignore
      }
    }
  };

  const handleNavigateToNurse = (scanResult: DFUPredictionResult) => {
    setActiveScanContext(scanResult);
    setActiveTab('nurse');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex bg-slate-50/60 text-slate-900 selection:bg-emerald-500 selection:text-white font-sans antialiased">
      {/* Left Slide Bar (Drawer & Collapsible Sidebar) */}
      <Sidebar
        language={language}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
        historyCount={scanHistory.length}
      />

      {/* Main App Content Area shifted dynamically for the left sidebar */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        {/* 24x7 Emergency Helplines Top Banner */}
        <EmergencyBanner language={language} />

        {/* Main Glass Header & Navigation */}
        <Navbar
          language={language}
          onLanguageChange={handleLanguageChange}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        {/* Dynamic Route View Content */}
        <main className="flex-1 py-6 sm:py-10 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
          {activeTab === 'home' && (
            <HomeHero language={language} onNavigate={handleTabChange} />
          )}

          {activeTab === 'scan' && (
            <FootScanner
              language={language}
              onNavigateToNurse={handleNavigateToNurse}
              onNavigateToHealthcare={() => handleTabChange('healthcare')}
              onSaveToHistory={handleSaveToHistory}
            />
          )}

          {activeTab === 'nurse' && (
            <PaathasuvaduNurse
              language={language}
              scanContext={activeScanContext}
              onClearScanContext={() => setActiveScanContext(null)}
            />
          )}

          {activeTab === 'care' && <DailyFootCare language={language} />}

          {activeTab === 'diet' && <DietNutrition language={language} />}

          {activeTab === 'dfu' && <DFUInformation language={language} />}

          {activeTab === 'healthcare' && <HealthcareFinder language={language} />}

          {activeTab === 'history' && (
            <ScanHistory
              language={language}
              history={scanHistory}
              onClearHistory={handleClearHistory}
              onNavigateToNurse={handleNavigateToNurse}
              onNavigateToHealthcare={() => handleTabChange('healthcare')}
            />
          )}

          {activeTab === 'research' && <TechnicalResearch language={language} />}
        </main>

        {/* Evidence-Based Footer */}
        <Footer language={language} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}
