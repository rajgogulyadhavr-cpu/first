import React from 'react';
import { 
  UserCheck, 
  MapPin, 
  Phone, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Award, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  PhoneCall, 
  ExternalLink,
  Stethoscope
} from 'lucide-react';
import { Specialist, Language } from '../../types';

interface SpecialistCardProps {
  specialist: Specialist;
  language: Language;
  onCall?: (phone: string) => void;
}

export const SpecialistCard: React.FC<SpecialistCardProps> = ({ specialist, language, onCall }) => {
  const isGovt = specialist.hospitalType === 'GOVERNMENT';

  return (
    <div
      id={`specialist-card-${specialist.id}`}
      className={`rounded-3xl overflow-hidden backdrop-blur-xl border transition-all duration-300 flex flex-col justify-between group hover:shadow-2xl hover:-translate-y-1 ${
        isGovt
          ? 'bg-white/95 border-blue-200/90 shadow-md shadow-blue-900/5 hover:border-blue-400'
          : 'bg-white/95 border-emerald-200/90 shadow-md shadow-emerald-900/5 hover:border-emerald-400'
      }`}
    >
      <div>
        {/* Top Header Banner with Doctor Photo & Badges */}
        <div className="p-5 pb-3 flex items-start space-x-4">
          {/* Doctor Portrait Photo with Verified Badge */}
          <div className="relative shrink-0">
            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 shadow-md bg-slate-100 ${
              isGovt ? 'border-blue-400' : 'border-emerald-400'
            }`}>
              <img
                src={specialist.photoUrl}
                alt={specialist.nameEn}
                referrerPolicy="no-referrer"
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div
              className="absolute -bottom-1.5 -right-1.5 p-1 rounded-full bg-white shadow-sm border border-slate-200 text-blue-600"
              title="Verified Medical Practitioner"
            >
              <CheckCircle2 className={`w-4 h-4 ${isGovt ? 'text-blue-600' : 'text-emerald-600'}`} />
            </div>
          </div>

          {/* Doctor Name, Qualifications & Badges */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Hospital Type & District Pill */}
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center space-x-1 ${
                  isGovt
                    ? 'bg-blue-100 text-blue-900 border border-blue-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <span>{isGovt ? '🏥 Govt Specialist' : '⭐ Private Specialist'}</span>
              </span>

              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                {specialist.district}
              </span>
            </div>

            {/* Doctor Name */}
            <h4 className="text-base sm:text-lg font-black text-slate-900 leading-tight group-hover:text-blue-700 transition-colors">
              {language === 'ta' ? specialist.nameTa : specialist.nameEn}
            </h4>

            {/* Qualification */}
            <p className="text-xs font-semibold text-slate-600 flex items-center space-x-1">
              <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{language === 'ta' ? specialist.qualificationTa : specialist.qualificationEn}</span>
            </p>

            {/* Designation / Role */}
            <p className="text-[11px] text-slate-500 font-medium leading-snug line-clamp-1">
              {language === 'ta' ? specialist.designationTa : specialist.designationEn}
            </p>
          </div>
        </div>

        {/* Card Body: Hospital Affiliation & Specialty */}
        <div className="px-5 pb-4 space-y-3">
          {/* Hospital Affiliation Box */}
          <div className="p-3 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1 text-xs">
            <div className="flex items-start space-x-2 text-slate-800">
              <Building2 className={`w-4 h-4 shrink-0 mt-0.5 ${isGovt ? 'text-blue-600' : 'text-emerald-600'}`} />
              <div>
                <strong className="block text-slate-900 font-bold leading-tight">
                  {language === 'ta' ? specialist.hospitalNameTa : specialist.hospitalNameEn}
                </strong>
              </div>
            </div>
          </div>

          {/* DFU & Wound Care Specialty */}
          <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-950 space-y-1">
            <div className="flex items-start space-x-2">
              <Stethoscope className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-950 font-bold text-[11px] uppercase tracking-wide">
                  {language === 'ta' ? 'சிறப்பு நிபுணத்துவம் (Specialty):' : 'Diabetic Foot & Clinical Specialty:'}
                </strong>
                <p className="text-xs text-emerald-900 leading-snug font-medium mt-0.5">
                  {language === 'ta' ? specialist.specialtyTa : specialist.specialtyEn}
                </p>
              </div>
            </div>
          </div>

          {/* OPD Days & Timings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {language === 'ta' ? 'பரிசோதனை நாட்கள்' : 'OPD Days'}
                </span>
                <span className="text-slate-800 font-semibold text-[11px]">
                  {language === 'ta' ? specialist.opdDaysTa : specialist.opdDaysEn}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start space-x-2">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">
                  {language === 'ta' ? 'நேரம்' : 'Timings'}
                </span>
                <span className="text-slate-800 font-semibold text-[11px]">
                  {language === 'ta' ? specialist.opdTimingsTa : specialist.opdTimingsEn}
                </span>
              </div>
            </div>
          </div>

          {/* Appointment / Booking Procedure */}
          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-900 block">
              {language === 'ta' ? 'முன்பதிவு / சந்திப்பு விவரங்கள்:' : 'Appointment & Consultation Details:'}
            </span>
            <p className="text-[11px] text-amber-900 font-medium leading-snug">
              {language === 'ta' ? specialist.appointmentDetailsTa : specialist.appointmentDetailsEn}
            </p>
          </div>
        </div>
      </div>

      {/* Card Action Buttons */}
      <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between gap-3">
        <a
          id={`call-specialist-${specialist.id}`}
          href={`tel:${specialist.contactNumber.replace(/[^0-9+]/g, '')}`}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors shadow-xs cursor-pointer ${
            isGovt
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'அழைக்க' : 'Call'}: {specialist.contactNumber}</span>
        </a>

        <div className="text-[10px] text-slate-400 text-right truncate">
          <span className="block font-semibold text-slate-600">
            {specialist.experienceYears ? `${specialist.experienceYears}+ Yrs Exp` : 'Verified'}
          </span>
          <span className="truncate text-[9px]">Verified Source</span>
        </div>
      </div>
    </div>
  );
};
