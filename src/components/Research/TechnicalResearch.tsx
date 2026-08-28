import React from 'react';
import { 
  Cpu, 
  Database, 
  Activity, 
  Award, 
  ExternalLink, 
  Layers, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  BarChart3,
  FileCode,
  Network
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { modelBenchmarkData, technicalArchitectureSpecs } from '../../data/researchData';

interface TechnicalResearchProps {
  language: Language;
}

export const TechnicalResearch: React.FC<TechnicalResearchProps> = ({ language }) => {
  const t = translations[language];
  const m = modelBenchmarkData;

  return (
    <div id="technical-research-section" className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-purple-800 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Student Healthcare Innovation & Benchmark Specs</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.researchTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {t.researchSubtitle}
        </p>
      </div>

      {/* Model Overview Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              Core Architecture
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">{m.modelName}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Framework: {m.trainingFramework} • Input: {m.inputSize}
            </p>
          </div>
          <div className="flex items-center space-x-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              Evaluated {m.lastEvaluated}
            </span>
          </div>
        </div>

        {/* Real Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center">
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Accuracy</span>
            <span className="text-xl font-black text-emerald-400">{(m.accuracy * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Precision</span>
            <span className="text-xl font-black text-teal-400">{(m.precision * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Recall (Sensitivity)</span>
            <span className="text-xl font-black text-cyan-400">{(m.recall * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">F1-Score</span>
            <span className="text-xl font-black text-amber-400">{(m.f1Score * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Specificity</span>
            <span className="text-xl font-black text-purple-400">{(m.specificity * 100).toFixed(1)}%</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">ROC-AUC</span>
            <span className="text-xl font-black text-rose-400">{m.rocAuc.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Dataset & Academic Provenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dataset Card */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 text-slate-900">
            <Database className="w-5 h-5 text-emerald-600" />
            <h4 className="text-base font-bold">{language === 'ta' ? 'தரவுத்தொகுப்பு & சான்றுகள்' : 'Dataset & Academic Citation'}</h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Trained and verified on the <strong>{m.datasetName}</strong>, comprising {m.datasetTotalImages} standardized clinical ground-truth images with binary class distribution.
          </p>

          <div className="space-y-2 pt-2 text-xs">
            {m.datasetClasses.map((cls, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-800">{cls.name}</span>
                <span className="font-bold text-emerald-700">{cls.count} images</span>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <a
              href={m.datasetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
            >
              <span>Grand Challenge DFU Benchmark Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Confusion Matrix Evaluation */}
        <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 text-slate-900">
            <BarChart3 className="w-5 h-5 text-teal-600" />
            <h4 className="text-base font-bold">{language === 'ta' ? 'குழப்ப அணி மதிப்பீடு' : 'Confusion Matrix (Hold-out Test Set)'}</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-slate-500 font-semibold block">True Normal (TN)</span>
              <span className="text-2xl font-black text-emerald-700">{m.confusionMatrix.trueNormal}</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] text-slate-500 font-semibold block">False Abnormal (FP)</span>
              <span className="text-2xl font-black text-amber-700">{m.confusionMatrix.falseAbnormal}</span>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
              <span className="text-[10px] text-slate-500 font-semibold block">False Normal (FN)</span>
              <span className="text-2xl font-black text-rose-700">{m.confusionMatrix.falseNormal}</span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] text-slate-500 font-semibold block">True Abnormal (TP)</span>
              <span className="text-2xl font-black text-emerald-700">{m.confusionMatrix.trueAbnormal}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 text-center">
            *High sensitivity minimizes false negatives for patient safety.
          </p>
        </div>
      </div>

      {/* 4-Stage Technical Pipeline Card */}
      <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 shadow-xl space-y-4">
        <h4 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Network className="w-5 h-5 text-purple-600" />
          <span>Multistage Inference & Quality Pipeline</span>
        </h4>
        <div className="space-y-3">
          {technicalArchitectureSpecs.pipeline.map((p, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 text-xs">
              <span className="font-bold text-slate-900 block">{p.stage}</span>
              <p className="text-slate-600 leading-relaxed">
                {language === 'ta' ? p.descTa : p.descEn}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
