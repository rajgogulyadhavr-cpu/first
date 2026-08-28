import React from 'react';
import { 
  Scan, 
  Bot, 
  Sparkles, 
  Apple, 
  Hospital as HospitalIcon, 
  BookOpen, 
  ShieldCheck, 
  PhoneCall, 
  ChevronRight, 
  Footprints,
  Activity,
  HeartPulse,
  Award,
  Layers,
  Zap,
  Target
} from 'lucide-react';
import { Language } from '../../types';
import { translations } from '../../data/translations';
import { FootAnatomyDiagram } from '../Visuals/FootAnatomyDiagram';

interface HomeHeroProps {
  language: Language;
  onNavigate: (tab: string) => void;
  onOpenJudgeDeck?: () => void;
}

export const HomeHero: React.FC<HomeHeroProps> = ({ language, onNavigate, onOpenJudgeDeck }) => {
  const t = translations[language];

  return (
    <div id="home-hero-section" className="space-y-12 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Hero Header Glass Card */}
      <div className="relative rounded-3xl backdrop-blur-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900 text-white p-8 sm:p-12 shadow-2xl overflow-hidden border border-emerald-500/30">
        {/* Subtle Decorative Ambient Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-emerald-100 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
              <span>IWGDF 2023 Guidelines & WHO Standards • Student Healthcare Initiative</span>
            </div>

            {onOpenJudgeDeck && (
              <button
                id="hero-judge-deck-badge-btn"
                type="button"
                onClick={onOpenJudgeDeck}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-md hover:bg-amber-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-slate-950" />
                <span>{language === 'ta' ? '🏆 நடுவர் மதிப்பீட்டு சுருக்கம்' : '🏆 Judge & Evaluator Deck'}</span>
              </button>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {t.appName}
          </h1>

          <p className="text-sm sm:text-lg text-emerald-50 leading-relaxed font-normal">
            {language === 'ta'
              ? 'நீரிழிவு கால் புண்களை (Diabetic Foot Ulcers) ஆரம்ப நிலையிலேயே கண்டறிந்து, தீவிர நோய்த்தொற்று மற்றும் உறுப்பு இழப்பைத் தடுக்கும் ஸ்மார்ட் AI நல்வாழ்வு அமைப்பு.'
              : 'Smart AI-Based Early Prevention and Detection Decision-Support System for Diabetic Foot Ulcers. Instant binary screening, evidence-based care routines, and authentic Tamil Nadu healthcare access.'}
          </p>

          {/* Direct CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="hero-start-scan-btn"
              type="button"
              onClick={() => onNavigate('scan')}
              className="px-6 py-3.5 rounded-2xl bg-white text-slate-950 hover:bg-emerald-50 text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Scan className="w-5 h-5 text-emerald-600" />
              <span>{t.scanYourFoot}</span>
            </button>

            <button
              id="hero-ask-nurse-btn"
              type="button"
              onClick={() => onNavigate('nurse')}
              className="px-6 py-3.5 rounded-2xl bg-teal-500/30 hover:bg-teal-500/40 text-white border border-white/25 backdrop-blur-md text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Bot className="w-5 h-5 text-teal-200" />
              <span>{t.navNurse}</span>
            </button>

            {onOpenJudgeDeck && (
              <button
                id="hero-evaluator-overview-btn"
                type="button"
                onClick={onOpenJudgeDeck}
                className="px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-amber-300 border border-amber-400/40 text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>{language === 'ta' ? 'நடுவர் விவரக்குறிப்பு' : 'AI System & Metrics Specs'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3 Core Quick Impact Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/80 border border-emerald-100 shadow-md flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">85%</div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {language === 'ta'
                ? 'ஆரம்ப பரிசோதனை மூலம் தடுக்கக்கூடிய கால் துண்டிப்பு சிக்கல்கள் (IWGDF)'
                : 'Amputations preventable through early screening & foot hygiene'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/80 border border-teal-100 shadow-md flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">104 / 108</div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {language === 'ta'
                ? 'தமிழ்நாடு அரசு 24x7 இலவச நல்வாழ்வு & ஆம்புலன்ஸ் அவசர உதவி'
                : 'Tamil Nadu 24x7 Emergency Health & Ambulance Helpline'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/80 border border-purple-100 shadow-md flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">100% Free</div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {language === 'ta'
                ? 'பதிவு, உள்நுழைவு அல்லது கட்டணம் எதுவுமில்லை; நேரடி பயன்பாடு'
                : 'No login, password, or fees required. Direct open access.'}
            </p>
          </div>
        </div>
      </div>

      {/* Pictorial Interactive Foot Anatomy & Pressure Showcase */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-2">
            <Footprints className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">
              {language === 'ta' ? 'ஊடாடும் பாத உடற்கூறியல் & புண் பாதிப்பு பகுப்பாய்வு' : 'Interactive Foot Biomechanics & Ulcer Risk Anatomy'}
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full">
            Pictorial Diagnostic Map
          </span>
        </div>

        <FootAnatomyDiagram language={language} />
      </div>

      {/* Feature Modules Bento Grid */}
      <div className="space-y-4 pt-2">
        <h3 className="text-lg font-bold text-slate-900 px-1">
          {language === 'ta' ? 'அனைத்து நல்வாழ்வு வசதிகள்' : 'Explore Modules & Clinical Features'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: AI Foot Screening */}
          <div
            id="explore-card-scan"
            onClick={() => onNavigate('scan')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-emerald-100 hover:border-emerald-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Scan className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navScan}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'கேமரா அல்லது பதிவேற்றம் மூலம் காலின் படத்தை ஆய்வு செய்து புண் உள்ளதா என்பதை உடனே அறியவும்.'
                  : 'Capture or upload foot images to detect ulceration markers with Grad-CAM heatmap visualization.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{t.scanYourFoot}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Paathasuvadu Nurse Voice Assistant */}
          <div
            id="explore-card-nurse"
            onClick={() => onNavigate('nurse')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-teal-100 hover:border-teal-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-600 to-cyan-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Bot className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navNurse}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'தமிழ் அல்லது ஆங்கிலத்தில் பேசி நீரிழிவு பாத பராமரிப்பு மற்றும் உணவு ஆலோசனைகளைப் பெறவும்.'
                  : 'Interactive voice-to-voice virtual nurse speaking English & Tamil with real-time avatar animation.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700">
              <span>{language === 'ta' ? 'உரையாடலைத் தொடங்கு' : 'Start Voice Chat'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Healthcare Finder */}
          <div
            id="explore-card-healthcare"
            onClick={() => onNavigate('healthcare')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <HospitalIcon className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navHealthcare}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'தமிழ்நாடு அரசு & தனியார் மருத்துவமனைகள், சரிபார்க்கப்பட்ட DFU சிறப்பு மருத்துவர்கள், தொடர்பு எண்கள் & வரைபடம்.'
                  : 'Verified Tamil Nadu Government & Private Hospitals, verified DFU/Podiatry specialists with real photos and appointment details.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-700">
              <span>{language === 'ta' ? 'மருத்துவமனைகள் & மருத்துவர்கள்' : 'Hospitals & Specialists'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 4: Daily Foot Care */}
          <div
            id="explore-card-care"
            onClick={() => onNavigate('care')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-emerald-100 hover:border-emerald-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-600 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navCare}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'IWGDF 2023 வழிகாட்டுதல்களின்படியான 7-படி பாத பராமரிப்பு மற்றும் செய்ய வேண்டியவை/கூடாதவை பட்டியல்.'
                  : 'Master the 7-step clinical daily hygiene sequence and DOs & DONTs comparative matrix.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>{language === 'ta' ? 'வழிகாட்டலை அறிக' : 'View Routine'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 5: Diet & Nutrition */}
          <div
            id="explore-card-diet"
            onClick={() => onNavigate('diet')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-amber-100 hover:border-amber-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <Apple className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navDiet}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'கோவக்காய், முருங்கை கீரை, சிறுதானியங்கள் மற்றும் பாரம்பரிய தமிழர் உணவு முறை வழிகாட்டல்.'
                  : 'Evidence-based South Indian diabetic nutrition, plate method breakdown, and hydration tips.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-700">
              <span>{language === 'ta' ? 'உணவு வழிகாட்டல்' : 'View Nutrition'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 6: DFU Pathology Education */}
          <div
            id="explore-card-dfu"
            onClick={() => onNavigate('dfu')}
            className="p-6 rounded-3xl backdrop-blur-xl bg-white/85 border border-slate-200 hover:border-slate-300 shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">{t.navDFU}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {language === 'ta'
                  ? 'நரம்பு பாதிப்பு (Neuropathy), ரத்த ஓட்டக் குறைபாடு மற்றும் ஆரம்ப எச்சரிக்கை அறிகுறிகள்.'
                  : 'Learn the difference between sensory neuropathy and ischemia with Meggitt-Wagner staging.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>{language === 'ta' ? 'மருத்துவ தகவல்' : 'Learn Pathology'}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
