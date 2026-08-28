import React, { useState, useMemo } from 'react';
import { 
  Hospital as HospitalIcon, 
  MapPin, 
  Phone, 
  Search, 
  ShieldCheck, 
  Navigation, 
  Clock, 
  Map as MapIcon, 
  List, 
  Sparkles,
  PhoneCall,
  Compass,
  Building2,
  AlertTriangle,
  LocateFixed,
  UserCheck,
  Stethoscope,
  CheckCircle2,
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { Hospital, Specialist, Language } from '../../types';
import { translations } from '../../data/translations';
import { hospitalsData, specialistsData, districtList } from '../../data/hospitalsData';
import { SpecialistCard } from './SpecialistCard';
import { TamilNaduMapSvg } from './TamilNaduMapSvg';

interface HealthcareFinderProps {
  language: Language;
}

// Calculate distance between two coordinates in kilometers using Haversine formula
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const HealthcareFinder: React.FC<HealthcareFinderProps> = ({ language }) => {
  const t = translations[language];

  // Primary Tab: Government Hospitals vs Private Hospitals
  const [activeHospitalType, setActiveHospitalType] = useState<'GOVERNMENT' | 'PRIVATE'>('GOVERNMENT');

  // Sub-view: Hospitals List vs Specialists Directory
  const [activeSubTab, setActiveSubTab] = useState<'hospitals' | 'specialists'>('hospitals');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'locating' | 'success' | 'error'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Request browser geolocation to find closest Tamil Nadu Hospitals
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationError(language === 'ta' ? 'உங்கள் உலாவியில் இருப்பிட வசதி இல்லை.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setLocationStatus('locating');
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('success');
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationStatus('error');
        setLocationError(
          language === 'ta'
            ? 'இருப்பிடத்தைப் பெற முடியவில்லை. கீழேயுள்ள மாவட்டப் பட்டியலிலிருந்து தேர்ந்தெடுக்கலாம்.'
            : 'Unable to retrieve location. You can select your district from the dropdown below.'
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Compute filtered hospitals based on hospital type tab, district, and search query
  const filteredHospitals = useMemo(() => {
    let list = hospitalsData
      .filter((h) => h.type === activeHospitalType)
      .map((hospital) => {
        let distanceKm: number | undefined;
        if (userLocation) {
          distanceKm = calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            hospital.lat,
            hospital.lng
          );
        }
        return { ...hospital, distanceKm };
      });

    // District filter
    if (selectedDistrict !== 'all') {
      list = list.filter((h) => h.district.toLowerCase() === selectedDistrict.toLowerCase());
    }

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (h) =>
          h.nameEn.toLowerCase().includes(q) ||
          h.nameTa.toLowerCase().includes(q) ||
          h.district.toLowerCase().includes(q) ||
          h.districtTa.toLowerCase().includes(q) ||
          h.addressEn.toLowerCase().includes(q) ||
          h.specialtyEn.toLowerCase().includes(q) ||
          h.specialtyTa.toLowerCase().includes(q) ||
          (h.dfuSpecialistNamesEn && h.dfuSpecialistNamesEn.some((name) => name.toLowerCase().includes(q))) ||
          (h.dfuSpecialistNamesTa && h.dfuSpecialistNamesTa.some((name) => name.toLowerCase().includes(q)))
      );
    }

    // Sort: if user location is available, sort by closest distance first
    if (userLocation) {
      list.sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    }

    return list;
  }, [activeHospitalType, userLocation, selectedDistrict, searchQuery]);

  // Compute filtered specialists based on hospital type tab, district, and search query
  const filteredSpecialists = useMemo(() => {
    let list = specialistsData.filter((s) => s.hospitalType === activeHospitalType);

    // District filter
    if (selectedDistrict !== 'all') {
      list = list.filter((s) => s.district.toLowerCase() === selectedDistrict.toLowerCase());
    }

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.nameEn.toLowerCase().includes(q) ||
          s.nameTa.toLowerCase().includes(q) ||
          s.specialtyEn.toLowerCase().includes(q) ||
          s.specialtyTa.toLowerCase().includes(q) ||
          s.hospitalNameEn.toLowerCase().includes(q) ||
          s.hospitalNameTa.toLowerCase().includes(q) ||
          s.qualificationEn.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q)
      );
    }

    return list;
  }, [activeHospitalType, selectedDistrict, searchQuery]);

  // Counts for Government vs Private
  const govtHospitalsCount = useMemo(() => hospitalsData.filter((h) => h.type === 'GOVERNMENT').length, []);
  const privateHospitalsCount = useMemo(() => hospitalsData.filter((h) => h.type === 'PRIVATE').length, []);
  const govtSpecialistsCount = useMemo(() => specialistsData.filter((s) => s.hospitalType === 'GOVERNMENT').length, []);
  const privateSpecialistsCount = useMemo(() => specialistsData.filter((s) => s.hospitalType === 'PRIVATE').length, []);

  return (
    <div id="healthcare-finder-section" className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center space-y-2.5">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/90 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-2xs">
          <Building2 className="w-4 h-4 text-emerald-700" />
          <span>Tamil Nadu Verified Healthcare Directory</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {language === 'ta' ? 'தமிழ்நாடு மருத்துவமனைகள் & சிறப்பு மருத்துவர்கள்' : 'Available Hospitals & Specialists in Tamil Nadu'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          {language === 'ta'
            ? 'நீரிழிவு பாத புண் (DFU), ரத்த நாள அறுவை சிகிச்சை மற்றும் பாத மீட்புக்கான தமிழ்நாடு அரசு மற்றும் தனியார் மருத்துவமனைகள் மற்றும் சரிபார்க்கப்பட்ட சிறப்பு மருத்துவர்கள் பட்டியல்.'
            : 'Verified currently available Government & Private Hospitals, dedicated Diabetic Foot & Wound Care units, and certified DFU/Podiatry Specialists across Tamil Nadu.'}
        </p>
      </div>

      {/* Emergency Quick Helpline Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-rose-900/10">
        <div className="flex items-center space-x-3 text-xs sm:text-sm">
          <div className="p-2.5 rounded-2xl bg-white/20">
            <PhoneCall className="w-5 h-5 text-amber-300 animate-pulse shrink-0" />
          </div>
          <div>
            <div className="font-bold">
              {language === 'ta' ? 'தமிழ்நாடு 24x7 மருத்துவ அவசர உதவி எண்கள்:' : 'Tamil Nadu 24x7 Emergency Helplines:'}
            </div>
            <div className="text-xs text-rose-100">
              <strong>104</strong> (Free Medical Advice) &bull; <strong>108</strong> (Toll-Free 24x7 Ambulance Dispatch)
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            id="healthcare-emergency-call-104"
            href="tel:104"
            className="px-4 py-2 rounded-xl bg-white text-rose-700 font-bold text-xs shadow-sm hover:bg-rose-50 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call 104</span>
          </a>
          <a
            id="healthcare-emergency-call-108"
            href="tel:108"
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs shadow-sm hover:bg-amber-300 transition-colors flex items-center space-x-1.5 cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call 108</span>
          </a>
        </div>
      </div>

      {/* PRIMARY TWO-TAB SELECTOR: GOVERNMENT HOSPITALS VS PRIVATE HOSPITALS */}
      <div className="p-1.5 rounded-3xl bg-slate-200/80 border border-slate-300/80 grid grid-cols-2 gap-2 shadow-inner">
        {/* Tab 1: Government Hospitals */}
        <button
          id="tab-government-hospitals"
          type="button"
          onClick={() => setActiveHospitalType('GOVERNMENT')}
          className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer ${
            activeHospitalType === 'GOVERNMENT'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]'
              : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
          }`}
        >
          <Building2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>{language === 'ta' ? 'அரசு மருத்துவமனைகள்' : 'Government Hospitals'}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-extrabold ${
            activeHospitalType === 'GOVERNMENT' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {govtHospitalsCount}
          </span>
        </button>

        {/* Tab 2: Private Hospitals */}
        <button
          id="tab-private-hospitals"
          type="button"
          onClick={() => setActiveHospitalType('PRIVATE')}
          className={`py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm md:text-base flex items-center justify-center space-x-2.5 transition-all duration-200 cursor-pointer ${
            activeHospitalType === 'PRIVATE'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.01]'
              : 'text-slate-700 hover:text-slate-950 hover:bg-white/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>{language === 'ta' ? 'தனியார் மருத்துவமனைகள்' : 'Private Hospitals'}</span>
          <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-extrabold ${
            activeHospitalType === 'PRIVATE' ? 'bg-white/20 text-white' : 'bg-slate-300 text-slate-700'
          }`}>
            {privateHospitalsCount}
          </span>
        </button>
      </div>

      {/* SUB-NAVIGATION & VIEW TOGGLE: Hospital Facilities vs Specialists Directory */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-100/80 p-2 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            id="subtab-hospitals-list"
            type="button"
            onClick={() => setActiveSubTab('hospitals')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'hospitals'
                ? activeHospitalType === 'GOVERNMENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <HospitalIcon className="w-4 h-4" />
            <span>
              {language === 'ta' ? 'மருத்துவமனை மையங்கள்' : 'Hospital Facilities'} ({filteredHospitals.length})
            </span>
          </button>

          <button
            id="subtab-specialists-directory"
            type="button"
            onClick={() => setActiveSubTab('specialists')}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
              activeSubTab === 'specialists'
                ? activeHospitalType === 'GOVERNMENT'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 bg-white/60'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {language === 'ta' ? 'சிறப்பு மருத்துவர்கள்' : 'Specialists Directory'} ({filteredSpecialists.length})
            </span>
          </button>
        </div>

        {/* State / View Note */}
        <div className="text-[11px] text-slate-500 font-medium px-2">
          {activeHospitalType === 'GOVERNMENT' ? (
            <span className="flex items-center space-x-1 text-blue-800 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{language === 'ta' ? 'அரசு நலத்துறை & CMCHIS காப்பீடு ஏற்றுக்கொள்ளப்படும்' : 'Directorate of Medical Education Verified & CMCHIS Covered'}</span>
            </span>
          ) : (
            <span className="flex items-center space-x-1 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'ta' ? 'NABH அங்கீகாரம் & பிரத்யேக பாத சிகிச்சை மையங்கள்' : 'NABH Accredited & Dedicated Diabetic Foot Centres'}</span>
            </span>
          )}
        </div>
      </div>

      {/* SEARCH, GPS LOCATION & DISTRICT FILTER BAR */}
      <div className="p-5 rounded-3xl backdrop-blur-xl bg-white/90 border border-slate-200 shadow-xl space-y-4">
        {/* Row: Search Input + District Dropdown + Geolocation + View Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="hospital-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'ta'
                  ? 'மருத்துவமனை, மருத்துவர் பெயர், மாவட்டம் அல்லது சிகிச்சை முறை தேடுக...'
                  : `Search ${activeHospitalType.toLowerCase()} hospitals, specialist doctor name, district...`
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* District Dropdown Selector */}
          <div className="relative md:w-60">
            <select
              id="hospital-district-select"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer"
            >
              {districtList.map((d) => (
                <option key={d.id} value={d.id}>
                  {language === 'ta' ? d.nameTa : d.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Location-Based Nearby Button */}
          <button
            id="hospital-location-btn"
            type="button"
            onClick={handleGetLocation}
            disabled={locationStatus === 'locating'}
            className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shrink-0 shadow-sm ${
              userLocation
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200'
            }`}
            title="Use GPS location to calculate distance to nearest hospitals"
          >
            <LocateFixed className={`w-4 h-4 ${locationStatus === 'locating' ? 'animate-spin' : ''}`} />
            <span>
              {locationStatus === 'locating'
                ? (language === 'ta' ? 'கண்டறியப்படுகிறது...' : 'Locating GPS...')
                : userLocation
                ? (language === 'ta' ? 'GPS இணைக்கப்பட்டது' : 'GPS Location Active')
                : (language === 'ta' ? 'அருகிலுள்ளவை' : 'Nearest to Me')}
            </span>
          </button>

          {/* View Mode Toggle (Only in hospitals sub-tab) */}
          {activeSubTab === 'hospitals' && (
            <div className="p-1 rounded-2xl bg-slate-100 border border-slate-200 flex items-center shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'map' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Map View"
              >
                <MapIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Location feedback note */}
        {locationError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        {userLocation && (
          <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-blue-600" />
              <span>
                {language === 'ta'
                  ? 'உங்கள் நேரடி இருப்பிடத்திலிருந்து தூரம் கணக்கிடப்பட்டு வரிசைப்படுத்தப்பட்டுள்ளது.'
                  : 'Distances calculated from your live coordinates and sorted by proximity.'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setUserLocation(null)}
              className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
            >
              {language === 'ta' ? 'அகற்று' : 'Clear GPS'}
            </button>
          </div>
        )}
      </div>

      {/* Map View (when sub-tab is hospitals and viewMode is map) */}
      {activeSubTab === 'hospitals' && viewMode === 'map' && (
        <TamilNaduMapSvg
          hospitals={filteredHospitals}
          selectedDistrict={selectedDistrict}
          onSelectDistrict={(d) => setSelectedDistrict(d)}
          language={language}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: HOSPITALS LIST */}
      {/* ========================================================================= */}
      {activeSubTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <strong className="text-slate-800">{filteredHospitals.length}</strong>
              <span>
                {activeHospitalType === 'GOVERNMENT'
                  ? (language === 'ta' ? 'அரசு மருத்துவமனைகள்' : 'Verified Tamil Nadu Government Hospitals')
                  : (language === 'ta' ? 'தனியார் மருத்துவமனைகள் & பாத சிகிச்சை மையங்கள்' : 'Verified Private Diabetic Foot Centres')}
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              {userLocation ? 'Sorted by Proximity' : 'Official Hospital Registry Verified'}
            </span>
          </div>

          {filteredHospitals.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 space-y-3">
              <HospitalIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                {language === 'ta' ? 'மருத்துவமனை முடிவுகள் எதுவும் கிடைக்கவில்லை' : 'No Hospitals Found in this Category'}
              </h4>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                {language === 'ta'
                  ? 'தேடல் சொல் அல்லது தேர்ந்தெடுக்கப்பட்ட மாவட்டத்தை மாற்றி மீண்டும் முயற்சிக்கவும்.'
                  : 'Try selecting another district or resetting your search filter.'}
              </p>
              <button
                onClick={() => {
                  setSelectedDistrict('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                {language === 'ta' ? 'அனைத்து மாவட்டங்களையும் காட்டு' : 'Reset to All Districts'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredHospitals.map((h) => {
                const isGovt = h.type === 'GOVERNMENT';

                return (
                  <div
                    key={h.id}
                    id={`hospital-card-${h.id}`}
                    className={`p-5 sm:p-6 rounded-3xl backdrop-blur-xl bg-white/95 border-2 transition-all flex flex-col justify-between group shadow-sm hover:shadow-xl ${
                      isGovt ? 'border-blue-100 hover:border-blue-300' : 'border-emerald-100 hover:border-emerald-300'
                    }`}
                  >
                    <div className="space-y-3.5">
                      {/* Facility Header Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-xl text-[11px] font-extrabold uppercase tracking-wide flex items-center space-x-1.5 shadow-2xs ${
                              isGovt
                                ? 'bg-blue-600 text-white'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            <span>{isGovt ? '🏥' : '⭐'}</span>
                            <span>{isGovt ? 'GOVERNMENT HOSPITAL' : 'PRIVATE DIABETES CENTRE'}</span>
                          </span>

                          {h.isNabhAccredited && (
                            <span className="px-2.5 py-0.5 rounded-xl text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center space-x-1">
                              <Award className="w-3 h-3 text-amber-700" />
                              <span>NABH Accredited</span>
                            </span>
                          )}

                          {h.distanceKm !== undefined && (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200 flex items-center space-x-1">
                              <Navigation className="w-3 h-3 text-emerald-700" />
                              <span>{h.distanceKm} km {language === 'ta' ? 'தொலைவு' : 'away'}</span>
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg shrink-0">
                          {h.district}
                        </span>
                      </div>

                      {/* Hospital Name */}
                      <div>
                        <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                          {language === 'ta' ? h.nameTa : h.nameEn}
                        </h4>
                        {language === 'ta' && (
                          <p className="text-xs text-slate-500 font-medium mt-0.5">{h.nameEn}</p>
                        )}
                      </div>

                      {/* Available DFU Specialists list in hospital */}
                      {h.dfuSpecialistNamesEn && h.dfuSpecialistNamesEn.length > 0 && (
                        <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
                          <div className="flex items-center space-x-1.5 text-indigo-900 font-bold text-[11px] uppercase tracking-wide">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            <span>{language === 'ta' ? 'இருப்பிலுள்ள DFU சிறப்பு மருத்துவர்கள்:' : 'Available DFU Specialists:'}</span>
                          </div>
                          <ul className="text-indigo-950 text-xs space-y-0.5 pl-5 list-disc font-medium">
                            {(language === 'ta' ? h.dfuSpecialistNamesTa : h.dfuSpecialistNamesEn)?.map((doc, idx) => (
                              <li key={idx}>{doc}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Detailed Info: Location, Specialty, Timings */}
                      <div className="space-y-2 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-start space-x-2">
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-slate-900 block">{language === 'ta' ? 'அமைவிடம் / முகவரி:' : 'Location / Address:'}</strong>
                            <span>{language === 'ta' ? h.addressTa : h.addressEn}</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 text-emerald-800">
                          <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="block text-emerald-950">{language === 'ta' ? 'பாத சிகிச்சை & அறுவை சிகிச்சை சிறப்பு:' : 'Podiatry & Wound Specialty:'}</strong>
                            <span>{language === 'ta' ? h.specialtyTa : h.specialtyEn}</span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2 text-slate-600">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <span>{language === 'ta' ? h.timingsTa : h.timingsEn}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions: Real Contact Number & Real Google Maps Directions */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <a
                        id={`call-hospital-${h.id}`}
                        href={`tel:${h.phone.replace(/[^0-9+]/g, '')}`}
                        className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 transition-colors cursor-pointer ${
                          isGovt
                            ? 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                        }`}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-700" />
                        <span>{language === 'ta' ? 'தொடர்பு' : 'Contact'}: {h.phone}</span>
                      </a>

                      <a
                        id={`directions-hospital-${h.id}`}
                        href={h.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer"
                        title="Open Directions in Google Maps"
                      >
                        <Navigation className="w-3.5 h-3.5 text-emerald-300" />
                        <span>{language === 'ta' ? 'வழிசெலுத்தல் (Directions)' : 'Get Directions'}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: SPECIALIST DOCTORS DIRECTORY (ATTRACTIVE DOCTOR CARDS) */}
      {/* ========================================================================= */}
      {activeSubTab === 'specialists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="flex items-center space-x-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <strong className="text-slate-800">{filteredSpecialists.length}</strong>
              <span>
                {activeHospitalType === 'GOVERNMENT'
                  ? (language === 'ta' ? 'சரிபார்க்கப்பட்ட அரசு சிறப்பு மருத்துவர்கள்' : 'Verified Government DFU & Vascular Specialists')
                  : (language === 'ta' ? 'சரிபார்க்கப்பட்ட தனியார் நீரிழிவு & பாத சிறப்பு மருத்துவர்கள்' : 'Verified Private DFU & Podiatry Specialists')}
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              {language === 'ta' ? 'அனைத்து தகவல்களும் அதிகாரப்பூர்வ மருத்துவக் குறிப்புகளிலிருந்து சரிபார்க்கப்பட்டவை' : 'Verified from Hospital Faculty & Clinical Registries'}
            </span>
          </div>

          {filteredSpecialists.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500 space-y-3">
              <UserCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-800">
                {language === 'ta' ? 'மருத்துவர்கள் முடிவுகள் கிடைக்கவில்லை' : 'No Specialists Found'}
              </h4>
              <p className="text-xs max-w-sm mx-auto text-slate-500">
                {language === 'ta'
                  ? 'தேடல் சொல் அல்லது தேர்ந்தெடுக்கப்பட்ட மாவட்டத்தை மாற்றி மீண்டும் முயற்சிக்கவும்.'
                  : 'Try searching with another doctor name or resetting your filter.'}
              </p>
              <button
                onClick={() => {
                  setSelectedDistrict('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                {language === 'ta' ? 'அனைத்து மருத்துவர்களையும் காட்டு' : 'Reset Filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSpecialists.map((specialist) => (
                <SpecialistCard
                  key={specialist.id}
                  specialist={specialist}
                  language={language}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified Healthcare Transparency & Clinical Sources Footer Box */}
      <div className="p-5 rounded-3xl bg-slate-100/90 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 text-slate-900 font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{language === 'ta' ? 'அங்கீகரிக்கப்பட்ட சுகாதார தரவு ஆதாரம்' : 'Verified Healthcare Data Governance'}</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          {language === 'ta'
            ? 'அனைத்து மருத்துவமனைகள் மற்றும் நிபுணர் விவரங்கள் தமிழ்நாடு அரசு மருத்துவக் கல்வி இயக்குநரகம் (DME), மாவட்ட சுகாதார சங்கங்கள், மற்றும் M.V. நீரிழிவு மருத்துவமனை, அப்பல்லோ, CMC வேலூர் போன்ற அங்கீகரிக்கப்பட்ட சுகாதார அமைப்புகளின் அதிகாரப்பூர்வ பதிவுகளிலிருந்து சரிபார்க்கப்பட்டுள்ளன.'
            : 'All listed medical centres and specialist practitioners are verified against official hospital faculty directories, Directorate of Medical Education (DME Tamil Nadu), and accredited healthcare networks. Emergency helpline 104 and 108 are toll-free 24x7 services provided by the Government of Tamil Nadu.'}
        </p>
      </div>
    </div>
  );
};
