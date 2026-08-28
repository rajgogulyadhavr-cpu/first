import React, { useState } from 'react';
import { 
  Eye, 
  AlertCircle, 
  Sparkles, 
  Footprints, 
  ShieldAlert, 
  HeartPulse, 
  Stethoscope, 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  ChevronDown, 
  ChevronUp,
  ShieldCheck
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { footCareStepsData, doAndDontList } from '../../data/footCareData';

interface DailyFootCareProps {
  language: Language;
}

export const DailyFootCare: React.FC<DailyFootCareProps> = ({ language }) => {
  const t = translations[language];
  const [activeStep, setActiveStep] = useState<number | null>(1);
  const [activeView, setActiveView] = useState<'steps' | 'dodont'>('steps');

  const getStepIcon = (iconName: string) => {
    switch (iconName) {
      case 'Eye':
        return <Eye className="w-5 h-5" />;
      case 'AlertCircle':
        return <AlertCircle className="w-5 h-5" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5" />;
      case 'ShieldAlert':
        return <ShieldAlert className="w-5 h-5" />;
      case 'HeartPulse':
        return <HeartPulse className="w-5 h-5" />;
      case 'Stethoscope':
        return <Stethoscope className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div id="daily-foot-care-section" className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>IWGDF 2023 Clinical Guidelines</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.dailyCareTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {t.dailyCareSubtitle}
        </p>
      </div>

      {/* View Switcher Tabs (7 Steps vs Do / Don't Matrix) */}
      <div className="flex justify-center">
        <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 shadow-inner flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveView('steps')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'steps'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ta' ? '7-படி முறை (7-Step Sequence)' : '7-Step Prevention Sequence'}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('dodont')}
            className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeView === 'dodont'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'ta' ? 'செய்ய வேண்டியவை / தவிர்க்க வேண்டியவை' : 'DOs & DONTs Matrix'}
          </button>
        </div>
      </div>

      {/* View 1: 7-Step Prevention Sequence */}
      {activeView === 'steps' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {footCareStepsData.map((step) => {
              const isExpanded = activeStep === step.stepNumber;
              return (
                <div
                  key={step.stepNumber}
                  id={`care-step-card-${step.stepNumber}`}
                  className={`p-5 rounded-3xl backdrop-blur-xl border transition-all ${
                    isExpanded
                      ? 'bg-white/95 border-emerald-300 shadow-lg shadow-emerald-950/5'
                      : 'bg-white/70 border-slate-200/80 hover:border-emerald-200 shadow-xs'
                  }`}
                >
                  <div
                    onClick={() => setActiveStep(isExpanded ? null : step.stepNumber)}
                    className="flex items-start justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                          isExpanded
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {step.stepNumber}
                      </div>

                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {language === 'ta' ? step.titleTa : step.titleEn}
                          </h3>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hidden sm:inline">
                            {step.sourceRef}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {language === 'ta' ? step.shortDescTa : step.shortDescEn}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>

                  {/* Expanded Detailed Guidance */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs text-slate-700 pl-13">
                      <div className="space-y-1.5">
                        {(language === 'ta' ? step.detailedTa : step.detailedEn).map((point, idx) => (
                          <div key={idx} className="flex items-start space-x-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span className="leading-relaxed">{point}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-400 pt-1">
                        Source Reference: <span className="font-medium text-slate-600">{step.sourceRef}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: DOs & DON'Ts Comparative Matrix */}
      {activeView === 'dodont' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DOs Column */}
          <div className="p-6 rounded-3xl bg-emerald-50/70 border-2 border-emerald-200/80 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5 text-emerald-900 pb-2 border-b border-emerald-200">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <h3 className="text-lg font-black tracking-tight">{t.doTitle}</h3>
            </div>
            <div className="space-y-3">
              {doAndDontList.dos.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-emerald-100 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-emerald-950 flex items-start justify-between gap-2">
                    <span>{language === 'ta' ? item.titleTa : item.titleEn}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                      {item.citation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {language === 'ta' ? item.descTa : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* DON'Ts Column */}
          <div className="p-6 rounded-3xl bg-rose-50/70 border-2 border-rose-200/80 shadow-md space-y-4">
            <div className="flex items-center space-x-2.5 text-rose-900 pb-2 border-b border-rose-200">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
              <h3 className="text-lg font-black tracking-tight">{t.dontTitle}</h3>
            </div>
            <div className="space-y-3">
              {doAndDontList.donts.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-rose-100 shadow-2xs space-y-1">
                  <div className="text-xs font-bold text-rose-950 flex items-start justify-between gap-2">
                    <span>{language === 'ta' ? item.titleTa : item.titleEn}</span>
                    <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded shrink-0">
                      {item.citation}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {language === 'ta' ? item.descTa : item.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
