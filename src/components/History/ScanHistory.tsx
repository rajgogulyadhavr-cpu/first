import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Trash2, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Calendar, 
  Clock, 
  Sparkles,
  Bot,
  Hospital as HospitalIcon
} from 'lucide-react';
import { DFUPredictionResult, Language } from '../../types';
import { translations } from '../../data/translations';
import { GradCamOverlay } from '../Scanner/GradCamOverlay';

interface ScanHistoryProps {
  language: Language;
  history: DFUPredictionResult[];
  onClearHistory: () => void;
  onNavigateToNurse: (scan: DFUPredictionResult) => void;
  onNavigateToHealthcare: () => void;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  language,
  history,
  onClearHistory,
  onNavigateToNurse,
  onNavigateToHealthcare,
}) => {
  const t = translations[language];
  const [selectedScan, setSelectedScan] = useState<DFUPredictionResult | null>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="scan-history-section" className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>Local Device Storage (Private & Secure)</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'ta' ? 'முந்தைய பரிசோதனை பதிவுகள்' : 'Screening History & Records'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {language === 'ta' ? 'உங்கள் சாதனத்தில் பாதுகாப்பாக சேமிக்கப்பட்ட முந்தைய கால் பரிசோதனைகளின் விவரங்கள்.' : 'View, review, and print your longitudinal foot screening reports saved locally on this device.'}
        </p>
      </div>

      {/* History Controls Bar */}
      {history.length > 0 && (
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="text-xs text-slate-500 font-semibold">
            {history.length} {history.length === 1 ? 'Record' : 'Records'} Stored
          </span>
          <button
            id="clear-all-history-btn"
            type="button"
            onClick={onClearHistory}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.clearHistory}</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">{t.noHistoryYet}</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {language === 'ta'
              ? 'நீங்கள் மேற்கொள்ளும் கால் பரிசோதனைகள் அனைத்தும் தானாக இங்கே பாதுகாப்பாக சேமிக்கப்படும்.'
              : 'Your screening sessions and model predictions will appear here for longitudinal tracking.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => {
            const isNormal = item.prediction === 'NORMAL';
            const scanDate = new Date(item.timestamp);

            return (
              <div
                key={item.id}
                id={`history-card-${item.id}`}
                className={`p-5 rounded-3xl backdrop-blur-xl border transition-all flex flex-col justify-between ${
                  isNormal
                    ? 'bg-emerald-50/40 border-emerald-200 hover:shadow-md'
                    : 'bg-rose-50/40 border-rose-200 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                          isNormal ? 'bg-emerald-600' : 'bg-rose-600'
                        }`}
                      >
                        {isNormal ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {isNormal ? t.normalStatusTitle : t.abnormalStatusTitle}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{scanDate.toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{scanDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-semibold">{t.confidenceScore}</div>
                      <div className="text-xs font-black text-slate-800">
                        {Math.round(item.confidence * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative h-28 rounded-2xl overflow-hidden bg-slate-900">
                    <img src={item.imageUrl} alt="Foot Thumbnail" className="w-full h-full object-cover" />
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">
                    {language === 'ta' ? item.statusSummaryTa : item.statusSummaryEn}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedScan(item)}
                    className="flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{language === 'ta' ? 'விவரம் காண்க' : 'View Full Report'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToNurse(item)}
                    className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
                  >
                    <Bot className="w-3 h-3" />
                    <span>Ask Nurse</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Modal View */}
      {selectedScan && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">
                  Screening Session #{selectedScan.id.slice(-6)}
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedScan.prediction === 'NORMAL' ? t.normalStatusTitle : t.abnormalStatusTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedScan(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grad-CAM view */}
            <GradCamOverlay
              imageUrl={selectedScan.imageUrl}
              heatmapPoints={selectedScan.heatmapPoints}
              isAbnormal={selectedScan.prediction === 'ABNORMAL'}
              language={language}
            />

            <div className="space-y-2 text-xs text-slate-700">
              <h4 className="font-bold text-slate-900 uppercase">Findings</h4>
              <p>{language === 'ta' ? selectedScan.statusSummaryTa : selectedScan.statusSummaryEn}</p>
              <h4 className="font-bold text-slate-900 uppercase pt-2">Recommendation</h4>
              <p>{language === 'ta' ? selectedScan.recommendationTa : selectedScan.recommendationEn}</p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'ta' ? 'அறிக்கையை அச்சிடுக (Print)' : 'Print Report (PDF)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const scan = selectedScan;
                  setSelectedScan(null);
                  onNavigateToNurse(scan);
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4" />
                <span>Ask Nurse with this Context</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
