import React, { useState } from 'react';
import { 
  BookOpen, 
  AlertTriangle, 
  Activity, 
  ShieldAlert, 
  HeartHandshake, 
  Layers, 
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { medicalSourcesData } from '../../data/sourcesData';

interface DFUInformationProps {
  language: Language;
}

export const DFUInformation: React.FC<DFUInformationProps> = ({ language }) => {
  const t = translations[language];
  const [selectedTopic, setSelectedTopic] = useState<'what' | 'causes' | 'signs' | 'stages'>('what');

  const warningSignsEn = [
    'Persistent redness, localized hot spot, or swelling on the foot or ankle.',
    'Any crack, blister, scrape, or break in the skin that does not heal in 48 hours.',
    'Numbness, loss of sensation, tingling ("pins and needles"), or burning pain.',
    'Drainage, foul odor, or dark/blackish discoloration of the skin or nail bed.',
    'Corn or callus with blood or dark fluid trapped underneath.',
  ];

  const warningSignsTa = [
    'காலில் அல்லது கணுக்காலில் தொடர்ந்து இருக்கும் சிவத்தல், அதிக வெப்பம் அல்லது வீக்கம்.',
    '48 மணி நேரத்திற்குள் ஆறாத தோல் வெடிப்பு, கொப்புளம் அல்லது சிராய்ப்பு.',
    'உணர்வின்மை, மரத்துப்போதல், ஊசி குத்துவது போன்ற உணர்வு அல்லது எரிச்சல்.',
    'சீழ் வடிதல், துர்நாற்றம் அல்லது தோலில் கருமை நிற மாற்றம் ஏற்படுதல்.',
    'ஆணி அல்லது தழும்புகளின் அடியில் ரத்தம் அல்லது நீர் கோர்த்திருப்பது.',
  ];

  return (
    <div id="dfu-information-section" className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>IWGDF 2023 & WHO Standards</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.dfuInfoTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
          {t.dfuInfoSubtitle}
        </p>
      </div>

      {/* Topic Switcher Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedTopic('what')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTopic === 'what'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ta' ? 'புண் என்றால் என்ன?' : 'What is a DFU?'}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTopic('causes')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTopic === 'causes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ta' ? 'காரணங்கள் (Causes)' : 'Pathology & Causes'}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTopic('signs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTopic === 'signs'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ta' ? 'ஆரம்ப எச்சரிக்கை அறிகுறிகள்' : 'Early Warning Signs'}
        </button>
        <button
          type="button"
          onClick={() => setSelectedTopic('stages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedTopic === 'stages'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          {language === 'ta' ? 'நிலைகள் & வகைப்பாடு' : 'Clinical Staging'}
        </button>
      </div>

      {/* Content Section based on selected topic */}
      {selectedTopic === 'what' && (
        <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/85 border border-emerald-100 shadow-xl space-y-6">
          <h3 className="text-xl font-bold text-slate-900">{language === 'ta' ? 'நீரிழிவு கால் புண் என்றால் என்ன?' : 'What is a Diabetic Foot Ulcer (DFU)?'}</h3>
          <p className="text-sm text-slate-700 leading-relaxed">
            {language === 'ta'
              ? 'நீரிழிவு கால் புண் (Diabetic Foot Ulcer - DFU) என்பது நீரிழிவு நோயாளிகளில் நரம்பு பலவீனம் (Neuropathy) மற்றும் குறைவான ரத்த ஓட்டம் (Peripheral Artery Disease) காரணமாக காலின் அடிப்பகுதி அல்லது விரல்களில் ஏற்படும் ஆறாத ஆழமான புண் ஆகும். ஆரம்பத்திலேயே கண்டறியாவிட்டால் இது தீவிர நோய்த்தொற்று மற்றும் கால் துண்டிப்பு (Amputation) போன்ற கடுமையான சிக்கல்களுக்கு வழிவகுக்கும்.'
              : 'A Diabetic Foot Ulcer (DFU) is a chronic, non-healing full-thickness wound through the dermis below the ankle in individuals with diabetes mellitus. It typically results from a combination of sensory peripheral neuropathy, mechanical foot deformities, and peripheral arterial disease.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <h4 className="text-sm font-bold text-emerald-950 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Why Early Detection Matters</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'IWGDF 2023 வழிகாட்டுதல்களின்படி, ஆரம்பத்திலேயே கண்டறிந்து சிகிச்சை பெறுவதன் மூலம் 85% வரை கால் துண்டிப்பு ஆபத்துகளைத் தடுக்க முடியும்.'
                  : 'Up to 85% of diabetes-related amputations are preventable through regular daily inspection, risk stratification, and timely multidisciplinary wound management.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2">
              <h4 className="text-sm font-bold text-teal-950 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                <span>Loss of Protective Sensation</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'நீரிழிவு நரம்பு பாதிப்பால் வலி உணர முடியாததால், சிறிய காயங்களும் கவனிக்கப்படாமல் ஆழமான புண்ணாக மாறும்.'
                  : 'Sensory neuropathy prevents patients from feeling blisters, stepping on sharp objects, or feeling rubbing shoes until severe skin breakdown occurs.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedTopic === 'causes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 shadow-xl space-y-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-800 w-fit">
              <Activity className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {language === 'ta' ? 'நீரிழிவு நரம்பு பாதிப்பு (Neuropathy)' : 'Diabetic Peripheral Neuropathy'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              High blood glucose levels damage delicate nerve fibers over time. This leads to loss of pain sensation (sensory), muscle weakness causing hammer toes (motor), and dry skin prone to cracking (autonomic).
            </p>
          </div>

          <div className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 shadow-xl space-y-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-800 w-fit">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900">
              {language === 'ta' ? 'ரத்த நாள அடைப்பு (Peripheral Artery Disease)' : 'Peripheral Arterial Disease (PAD)'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Narrowing of small arteries in the legs deprives foot tissues of essential oxygen, white blood cells, and nutrients necessary to heal minor cuts or resist bacterial infection.
            </p>
          </div>
        </div>
      )}

      {selectedTopic === 'signs' && (
        <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-rose-50/70 border border-rose-200 shadow-xl space-y-4">
          <div className="flex items-center space-x-2 text-rose-900">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <h3 className="text-lg font-black tracking-tight">{language === 'ta' ? 'ஆரம்ப எச்சரிக்கை அறிகுறிகள்' : 'Early Warning Signs of Diabetic Foot Ulcers'}</h3>
          </div>
          <div className="space-y-2.5">
            {(language === 'ta' ? warningSignsTa : warningSignsEn).map((sign, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-white border border-rose-100 shadow-2xs flex items-start space-x-3 text-xs sm:text-sm text-slate-800">
                <span className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed font-medium">{sign}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedTopic === 'stages' && (
        <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/85 border border-emerald-100 shadow-xl space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            {language === 'ta' ? 'மருத்துவ நிலைகள் (Meggitt-Wagner Classification)' : 'Meggitt-Wagner DFU Classification System'}
          </h3>
          <div className="space-y-3">
            {[
              { stage: 'Grade 0', label: 'Intact Foot', desc: 'No open lesion; high risk foot with healed ulcer, bony deformity, or callus.' },
              { stage: 'Grade 1', label: 'Superficial Ulcer', desc: 'Superficial ulcer without subcutaneous tissue involvement.' },
              { stage: 'Grade 2', label: 'Deep Ulcer', desc: 'Deep ulcer penetrating to tendon, bone, or joint capsule.' },
              { stage: 'Grade 3', label: 'Deep Infection', desc: 'Deep ulcer with abscess, osteomyelitis, or joint sepsis.' },
              { stage: 'Grade 4', label: 'Localized Gangrene', desc: 'Gangrene localized to forefoot, heel, or toe digits.' },
              { stage: 'Grade 5', label: 'Extensive Gangrene', desc: 'Gangrenous involvement requiring major limb salvage or debridement.' },
            ].map((g, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3 text-xs">
                <span className="font-extrabold text-slate-900 bg-slate-200 px-2 py-0.5 rounded-md shrink-0">
                  {g.stage}
                </span>
                <div>
                  <strong className="text-slate-900 block">{g.label}</strong>
                  <span className="text-slate-600">{g.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verified Evidence Sources Section */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
          <HeartHandshake className="w-4 h-4" />
          <span>Evidence-Based Clinical Guidelines & Sources</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {medicalSourcesData.map((src) => (
            <a
              key={src.id}
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center justify-between">
                  <span>{src.organization}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </div>
                <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                  {language === 'ta' ? src.titleTa : src.titleEn}
                </p>
              </div>
              <div className="mt-2 text-[10px] text-slate-500">
                Year: {src.year} • Guideline: {src.guidelineName}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
