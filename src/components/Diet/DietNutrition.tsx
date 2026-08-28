import React, { useState } from 'react';
import { 
  Apple, 
  Check, 
  X, 
  Droplet, 
  Sparkles, 
  ShieldCheck, 
  PieChart as PieChartIcon, 
  Info,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Language, FoodItem } from '../../types';
import { translations } from '../../data/translations';
import { foodItemsData, dietGuidelinesOverview } from '../../data/dietData';

interface DietNutritionProps {
  language: Language;
}

export const DietNutrition: React.FC<DietNutritionProps> = ({ language }) => {
  const t = translations[language];
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'PREFER' | 'LIMIT'>('ALL');

  const filteredFoods =
    filterCategory === 'ALL'
      ? foodItemsData
      : foodItemsData.filter((item) => item.category === filterCategory);

  const preferCount = foodItemsData.filter((i) => i.category === 'PREFER').length;
  const limitCount = foodItemsData.filter((i) => i.category === 'LIMIT').length;

  return (
    <div id="diet-nutrition-section" className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold">
          <Apple className="w-3.5 h-3.5 text-emerald-700" />
          <span>WHO 2023 & ICMR-INDIAB Clinical Guidelines</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {t.dietTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {language === 'ta'
            ? 'நீரிழிவு பாதம் மற்றும் காயம் குணமடைதலை விரைவுபடுத்த அறிவியல் பூர்வமாக சான்றளிக்கப்பட்ட உணவு வழிகாட்டல்.'
            : 'Evidence-based clinical dietary visual atlas with specific South Indian nutritional guidelines to optimize microvascular healing and prevent DFU.'}
        </p>
      </div>

      {/* South Indian Healthy Diabetes Plate Visual */}
      <div className="p-6 sm:p-8 rounded-3xl backdrop-blur-xl bg-white/90 border border-emerald-100 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Plate Diagram */}
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-emerald-500 shadow-inner bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
            {/* 1/2 Vegetables */}
            <div className="absolute inset-y-0 left-0 w-1/2 bg-emerald-500/20 border-r-2 border-dashed border-emerald-600 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-lg font-black text-emerald-800">50%</span>
              <span className="text-[10px] font-bold text-emerald-950 leading-tight">
                {language === 'ta' ? 'காய்கறி & கீரைகள்' : 'Greens & Veggies'}
              </span>
            </div>
            {/* 1/4 Grains */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-amber-500/20 border-b-2 border-dashed border-amber-600 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-sm font-black text-amber-800">25%</span>
              <span className="text-[9px] font-bold text-amber-950 leading-tight">
                {language === 'ta' ? 'சிறுதானியங்கள்' : 'Whole Millets'}
              </span>
            </div>
            {/* 1/4 Protein */}
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-teal-500/20 flex flex-col items-center justify-center p-2 text-center">
              <span className="text-sm font-black text-teal-800">25%</span>
              <span className="text-[9px] font-bold text-teal-950 leading-tight">
                {language === 'ta' ? 'பருப்பு / புரதம்' : 'Protein / Sundal'}
              </span>
            </div>
          </div>

          {/* Plate Explanation Text */}
          <div className="space-y-3 flex-1 text-xs sm:text-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              <span>{language === 'ta' ? 'தமிழ் நீரிழிவு உணவு தட்டு முறை (Plate Method)' : 'The South Indian Diabetic Plate Method'}</span>
            </h3>

            <div className="space-y-2">
              <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="font-bold text-emerald-950 block text-xs">
                  {dietGuidelinesOverview.plateMethod.vegetablesLabelEn}
                </span>
                <span className="text-slate-600 text-xs">
                  Kovakkai, Murungai keerai, Pavakkai, Cabbage, Bottle Gourd, Greens.
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200">
                <span className="font-bold text-amber-950 block text-xs">
                  {dietGuidelinesOverview.plateMethod.grainsLabelEn}
                </span>
                <span className="text-slate-600 text-xs">
                  Ragi, Kambu, Samai, Thinai, Hand-pounded Red Rice (strictly moderate portion).
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-teal-50/80 border border-teal-200">
                <span className="font-bold text-teal-950 block text-xs">
                  {dietGuidelinesOverview.plateMethod.proteinLabelEn}
                </span>
                <span className="text-slate-600 text-xs">
                  Boiled Sundal, Green gram, Sprouted Moong, Dhal, Egg whites, Fish.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hydration Guidance Card */}
      <div className="p-5 rounded-3xl bg-blue-50/80 border border-blue-200 flex items-start space-x-3 text-xs leading-relaxed text-blue-950">
        <div className="p-2.5 rounded-xl bg-blue-200/80 text-blue-700 shrink-0">
          <Droplet className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">{t.hydrationTitle}</h4>
          <ul className="space-y-1 text-slate-700">
            {(language === 'ta' ? dietGuidelinesOverview.hydrationTipsTa : dietGuidelinesOverview.hydrationTipsEn).map(
              (tip, idx) => (
                <li key={idx} className="flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span>{tip}</span>
                </li>
              )
            )}
          </ul>
        </div>
      </div>

      {/* Food Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory('ALL')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            filterCategory === 'ALL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>{language === 'ta' ? 'அனைத்து உணவுகள்' : 'All Foods'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-white text-[10px]">
            {foodItemsData.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('PREFER')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            filterCategory === 'PREFER'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'உண்ண வேண்டியவை (CONSUME)' : 'WHAT TO CONSUME'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-700 text-emerald-100 text-[10px]">
            {preferCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterCategory('LIMIT')}
          className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
            filterCategory === 'LIMIT'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'தவிர்க்க / குறைக்க வேண்டியவை (LIMIT)' : 'WHAT TO AVOID / LIMIT'}</span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-700 text-rose-100 text-[10px]">
            {limitCount}
          </span>
        </button>
      </div>

      {/* Realistic Visual Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFoods.map((food) => {
          const isPrefer = food.category === 'PREFER';
          return (
            <div
              key={food.id}
              id={`food-card-${food.id}`}
              className={`rounded-3xl overflow-hidden backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:-translate-y-1 ${
                isPrefer
                  ? 'bg-white border-emerald-200 shadow-md shadow-emerald-900/5 hover:border-emerald-400'
                  : 'bg-white border-rose-200 shadow-md shadow-rose-900/5 hover:border-rose-400'
              }`}
            >
              <div>
                {/* Authentic Realistic Food Image Container */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                  <img
                    src={food.imageUrl}
                    alt={food.nameEn}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Subtle Gradient Overlay for badge contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

                  {/* Top Floating Indicator Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 shadow-md backdrop-blur-md ${
                        isPrefer
                          ? 'bg-emerald-600 text-white border border-emerald-400/30'
                          : 'bg-rose-600 text-white border border-rose-400/30'
                      }`}
                    >
                      {isPrefer ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{isPrefer ? 'WHAT TO CONSUME' : 'AVOID / LIMIT'}</span>
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md ${
                        food.glycemicImpact === 'LOW'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                      }`}
                    >
                      GI: {food.glycemicImpact}
                    </span>
                  </div>

                  {/* Bottom Image Title Bar */}
                  <div className="absolute bottom-2.5 left-3 right-3 pointer-events-none">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 drop-shadow-sm">
                      {food.foodGroup.replace('_', ' ')}
                    </div>
                    <div className="text-white font-black text-base drop-shadow-md leading-tight">
                      {language === 'ta' ? food.nameTa : food.nameEn}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3.5">
                  {/* Secondary name translation if in different language */}
                  <div className="text-[11px] text-slate-500 font-medium">
                    {language === 'ta' ? food.nameEn : food.nameTa}
                  </div>

                  {/* Very short evidence-based clinical explanation */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {language === 'ta' ? 'மருத்துவ விளக்கம்' : 'Clinical Evidence'}
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {language === 'ta' ? food.benefitsTa : food.benefitsEn}
                    </p>
                  </div>

                  {/* Practical Portion Tip */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                    <strong className="text-slate-900 block font-bold">
                      {language === 'ta' ? 'பரிந்துரைக்கப்படும் அளவு & முறை:' : 'Portion & Preparation:'}
                    </strong>
                    <span className="text-slate-600">
                      {language === 'ta' ? food.portionTipTa : food.portionTipEn}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer with Evidence Source Reference */}
              <div className="px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                <div className="flex items-center space-x-1.5 truncate">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">
                    {language === 'ta' ? (food.evidenceSourceTa || food.evidenceSource) : food.evidenceSource}
                  </span>
                </div>
                <span className="shrink-0 font-semibold text-emerald-700 ml-2">
                  Verified
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mandatory Clinical Diet Disclaimer */}
      <div className="p-5 rounded-3xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 leading-relaxed flex items-start space-x-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h5 className="font-bold text-amber-900">
            {language === 'ta' ? 'மருத்துவ மறுப்புரை & பாதுகாப்பு வழிகாட்டுதல்' : 'Clinical Disclaimer & Safety Notice'}
          </h5>
          <p className="text-slate-700 text-xs">
            {language === 'ta'
              ? dietGuidelinesOverview.disclaimerTa
              : dietGuidelinesOverview.disclaimerEn}
          </p>
        </div>
      </div>
    </div>
  );
};
