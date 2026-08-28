export interface Translations {
  appName: string;
  appSubtitle: string;
  tagline: string;
  navHome: string;
  navScan: string;
  navCare: string;
  navDiet: string;
  navDFU: string;
  navHealthcare: string;
  navNurse: string;
  navHistory: string;
  navResearch: string;
  scanYourFoot: string;
  uploadImage: string;
  orDragDrop: string;
  cameraCapture: string;
  switchCamera: string;
  capturePhoto: string;
  cancel: string;
  retake: string;
  analyzingFoot: string;
  scanningStage1: string;
  scanningStage2: string;
  scanningStage3: string;
  scanningStage4: string;
  nonFootErrorTitle: string;
  nonFootErrorMessage: string;
  nonFootWarningEn: string;
  nonFootWarningTa: string;
  qualityErrorTitle: string;
  qualityErrorMessage: string;
  screeningResultTitle: string;
  normalStatusTitle: string;
  normalStatusDesc: string;
  abnormalStatusTitle: string;
  abnormalStatusDesc: string;
  aiScreeningDisclaimer: string;
  consultDoctorPrompt: string;
  confidenceScore: string;
  riskAssessment: string;
  lowRisk: string;
  highRisk: string;
  viewGradCam: string;
  hideGradCam: string;
  gradCamExplanation: string;
  findHealthcareBtn: string;
  askPaathasuvaduBtn: string;
  dailyCareTitle: string;
  dailyCareSubtitle: string;
  dietTitle: string;
  dietSubtitle: string;
  dfuInfoTitle: string;
  dfuInfoSubtitle: string;
  healthcareTitle: string;
  healthcareSubtitle: string;
  nurseTitle: string;
  nurseSubtitle: string;
  researchTitle: string;
  researchSubtitle: string;
  emergencyHelpline: string;
  tnHelplineText: string;
  verifiedSourceBadge: string;
  doTitle: string;
  dontTitle: string;
  preferTitle: string;
  limitTitle: string;
  portionAwarenessTitle: string;
  hydrationTitle: string;
  filterAll: string;
  filterGovt: string;
  filterPrivate: string;
  selectDistrict: string;
  allDistricts: string;
  directionsBtn: string;
  callHospitalBtn: string;
  emergencyNumber: string;
  noHospitalsFound: string;
  voiceInputListening: string;
  voiceInputThinking: string;
  voiceInputSpeaking: string;
  typeYourQuestion: string;
  send: string;
  clearHistory: string;
  noHistoryYet: string;
  downloadReport: string;
  saveToHistory: string;
  savedSuccessfully: string;
}

export const translations: Record<'en' | 'ta', Translations> = {
  en: {
    appName: 'FootGuard AI',
    appSubtitle: 'Diabetic Foot Ulcer Early Detection & Prevention',
    tagline: 'Detect Early. Prevent Complications.',
    navHome: 'Home',
    navScan: 'Scan Foot',
    navCare: 'Daily Care',
    navDiet: 'Diet & Nutrition',
    navDFU: 'DFU Info',
    navHealthcare: 'Healthcare',
    navNurse: 'Paathasuvadu AI',
    navHistory: 'History',
    navResearch: 'Research & Model',
    scanYourFoot: 'SCAN YOUR FOOT',
    uploadImage: 'UPLOAD IMAGE',
    orDragDrop: 'or drag and drop foot image here',
    cameraCapture: 'Take Live Photo',
    switchCamera: 'Switch Camera',
    capturePhoto: 'Capture Frame',
    cancel: 'Cancel',
    retake: 'Retake / Try Another',
    analyzingFoot: 'Analyzing Foot Biomarkers...',
    scanningStage1: 'Validating Human Foot Anatomy & Perspective...',
    scanningStage2: 'Assessing Image Clarity, Lighting & Resolution...',
    scanningStage3: 'Running DFU Binary Classification Neural Network...',
    scanningStage4: 'Generating Attention Saliency Map...',
    nonFootErrorTitle: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
    nonFootErrorMessage: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
    nonFootWarningEn: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
    nonFootWarningTa: 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்',
    qualityErrorTitle: 'Image Quality Unsuitable',
    qualityErrorMessage: 'Please upload a clear foot image with sufficient lighting, sharp focus, and unobstructed view of the skin or sole.',
    screeningResultTitle: 'AI FOOT SCREENING RESULT',
    normalStatusTitle: 'NORMAL',
    normalStatusDesc: 'Healthy-looking foot image detected. No visual ulceration markers found.',
    abnormalStatusTitle: 'ABNORMAL / POSSIBLE ULCER',
    abnormalStatusDesc: 'Possible ulcer-like abnormality or skin break detected.',
    aiScreeningDisclaimer: 'This is an AI screening result and not a confirmed medical diagnosis. Always consult a qualified healthcare professional for clinical examination.',
    consultDoctorPrompt: 'Please consult a qualified healthcare professional or podiatrist promptly for thorough clinical evaluation and wound staging.',
    confidenceScore: 'Model Confidence',
    riskAssessment: 'Screening Risk Level',
    lowRisk: 'Low Risk',
    highRisk: 'High Risk (Requires Clinical Attention)',
    viewGradCam: 'Show AI Attention Heatmap (Grad-CAM)',
    hideGradCam: 'Hide AI Attention Heatmap',
    gradCamExplanation: 'AI attention visualization highlighting high-gradient regions that influenced the model classification — not a clinical diagnosis.',
    findHealthcareBtn: 'Find Nearby Healthcare Centres',
    askPaathasuvaduBtn: 'Ask Paathasuvadu AI Nurse',
    dailyCareTitle: 'Daily Foot Care Routine',
    dailyCareSubtitle: '7 Evidence-Based Steps According to IWGDF 2023 Guidelines',
    dietTitle: 'Diet & Nutrition for Diabetes',
    dietSubtitle: 'South Indian & Tamil Nutrition Guidance for Healthy Glucose Control & Tissue Healing',
    dfuInfoTitle: 'Diabetic Foot Ulcer Knowledge Hub',
    dfuInfoSubtitle: 'Pathology, Risk Factors, Warning Signs & Prevention Mechanisms',
    healthcareTitle: 'Available Healthcare Directory',
    healthcareSubtitle: 'Verified Tamil Nadu Government Hospitals, Foot Care Centres & Specialists',
    nurseTitle: 'Paathasuvadu Virtual Healthcare Nurse',
    nurseSubtitle: 'Voice-to-Voice AI Companion for Personalized Diabetic Foot Advice & Guidance',
    researchTitle: 'Technical Research & Model Evaluation',
    researchSubtitle: 'Dataset Benchmarks, CNN Architecture, Confusion Matrix & Performance Metrics',
    emergencyHelpline: 'Tamil Nadu Health Helpline: 104 | Medical Emergency: 108',
    tnHelplineText: '24x7 Free Tele-Consultation & Emergency Response in Tamil Nadu',
    verifiedSourceBadge: 'Verified Clinical Source',
    doTitle: 'Recommended Daily Practices (DO)',
    dontTitle: 'Dangerous Practices to Avoid (DON’T)',
    preferTitle: 'Foods to Prefer',
    limitTitle: 'Foods to Limit / Moderate',
    portionAwarenessTitle: 'Plate Method & Portion Awareness',
    hydrationTitle: 'Hydration Guidelines',
    filterAll: 'All Facilities',
    filterGovt: 'Government Hospitals',
    filterPrivate: 'Private Foot Centres',
    selectDistrict: 'Select District in Tamil Nadu',
    allDistricts: 'All Districts',
    directionsBtn: 'Directions (Google Maps)',
    callHospitalBtn: 'Call Facility',
    emergencyNumber: 'Emergency Desk',
    noHospitalsFound: 'No verified facilities match the selected filters.',
    voiceInputListening: 'Listening to your voice... Speak now',
    voiceInputThinking: 'Paathasuvadu is thinking...',
    voiceInputSpeaking: 'Paathasuvadu is speaking...',
    typeYourQuestion: 'Type or speak your question in English or Tamil...',
    send: 'Send',
    clearHistory: 'Clear History',
    noHistoryYet: 'No previous scans found. Take your first foot screening to view records here.',
    downloadReport: 'Download Screening Report',
    saveToHistory: 'Save to Local History',
    savedSuccessfully: 'Screening result saved to local device history.'
  },
  ta: {
    appName: 'FootGuard AI',
    appSubtitle: 'நீரிழிவு கால் புண் ஆரம்பகால கண்டறிதல் மற்றும் தடுப்பு அமைப்பு',
    tagline: 'முன்கூட்டியே கண்டறிவோம். சிக்கல்களைத் தடுப்போம்.',
    navHome: 'முகப்பு',
    navScan: 'கால் பரிசோதனை',
    navCare: 'தினசரி கால் பராமரிப்பு',
    navDiet: 'உணவு & ஊட்டச்சத்து',
    navDFU: 'புண் பற்றிய தகவல்',
    navHealthcare: 'மருத்துவமனைகள்',
    navNurse: 'பாதசுவடு AI செவிலியர்',
    navHistory: 'முந்தைய பதிவுகள்',
    navResearch: 'ஆராய்ச்சி & மாதிரி',
    scanYourFoot: 'காலினை பரிசோதிக்கவும்',
    uploadImage: 'படத்தை பதிவேற்றவும்',
    orDragDrop: 'அல்லது கால் படத்தை இங்கே இழுத்துப் போடவும்',
    cameraCapture: 'நேரடி புகைப்படம் எடுக்கவும்',
    switchCamera: 'கேமராவை மாற்றவும்',
    capturePhoto: 'படம் பிடிக்கவும்',
    cancel: 'ரத்து செய்',
    retake: 'மீண்டும் எடுக்கவும்',
    analyzingFoot: 'கால் அடையாளங்கள் பகுப்பாய்வு செய்யப்படுகிறது...',
    scanningStage1: 'மனித கால் உடற்கூறியல் சரிபார்க்கப்படுகிறது...',
    scanningStage2: 'படத்தின் தரம் மற்றும் வெளிச்சம் சோதிக்கப்படுகிறது...',
    scanningStage3: 'DFU AI மாதிரி பரிசோதனை செய்கிறது...',
    scanningStage4: 'கவனம் செலுத்திய பகுதி கண்டறியப்படுகிறது...',
    nonFootErrorTitle: 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்',
    nonFootErrorMessage: 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்',
    nonFootWarningEn: 'INVALID IMAGE – Please upload only a foot image for DFU screening',
    nonFootWarningTa: 'தவறான படம் – DFU பரிசோதனைக்காக காலின் படத்தை மட்டும் பதிவேற்றவும்',
    qualityErrorTitle: 'படத்தின் தரம் போதாது',
    qualityErrorMessage: 'நம்பகமான AI பரிசோதனைக்கு தெளிவான, வெளிச்சமுள்ள காலின் படத்தை பதிவேற்றவும்.',
    screeningResultTitle: 'AI கால் பரிசோதனை முடிவு',
    normalStatusTitle: 'சாதாரணம் (NORMAL)',
    normalStatusDesc: 'ஆரோக்கியமான கால் படம் கண்டறியப்பட்டது. புண் அறிகுறிகள் தென்படவில்லை.',
    abnormalStatusTitle: 'அசாதாரணம் (ABNORMAL - வாய்ப்புள்ள புண்)',
    abnormalStatusDesc: 'தோல் வெடிப்பு அல்லது புண் போன்ற அசாதாரண அடையாளம் தென்படுகிறது.',
    aiScreeningDisclaimer: 'இது ஒரு AI ஆரம்பக்கட்ட பரிசோதனை முடிவு மட்டுமே; உறுதியான மருத்துவ பரிசோதனை அல்ல. முறையான மருத்துவ பரிசோதனைக்கு மருத்துவரை அணுகவும்.',
    consultDoctorPrompt: 'சரியான மருத்துவ சிகிச்சை மற்றும் பரிசோதனைக்கு தகுதியான மருத்துவரை அல்லது கால் மருத்துவ நிபுணரை அணுகவும்.',
    confidenceScore: 'AI மாதிரியின் உறுதி நிலை',
    riskAssessment: 'ஆபத்து நிலை',
    lowRisk: 'குறைந்த ஆபத்து (இயல்பு)',
    highRisk: 'அதிக ஆபத்து (மருத்துவ கவனிப்பு தேவை)',
    viewGradCam: 'AI பகுப்பாய்வு வெப்ப வரைபடம் (Grad-CAM)',
    hideGradCam: 'வரைபடத்தை மறைக்கவும்',
    gradCamExplanation: 'AI மாதிரி கவனம் செலுத்திய பகுதிகளைக் காட்டும் காட்சி வரைபடம் — இது நேரடி மருத்துவ அறிக்கை அல்ல.',
    findHealthcareBtn: 'அருகிலுள்ள மருத்துவமனைகளைக் காண்க',
    askPaathasuvaduBtn: 'பாதசுவடு AI செவிலியரிடம் கேட்கவும்',
    dailyCareTitle: 'தினசரி கால் பராமரிப்பு முறைகள்',
    dailyCareSubtitle: 'IWGDF 2023 சர்வதேச வழிகாட்டுதலின்படி 7 முக்கிய வழிமுறைகள்',
    dietTitle: 'நீரிழிவுக்கான உணவு & ஊட்டச்சத்து',
    dietSubtitle: 'சர்க்கரை அளவு கட்டுப்பாடு மற்றும் காயம் ஆறுதலுக்கான தமிழ்நாட்டு உணவு முறைகள்',
    dfuInfoTitle: 'நீரிழிவு கால் புண் விழிப்புணர்வு',
    dfuInfoSubtitle: 'காரணங்கள், ஆபத்துக் காரணிகள், எச்சரிக்கை அறிகுறிகள் மற்றும் தடுப்பு முறைகள்',
    healthcareTitle: 'தமிழ்நாடு மருத்துவமனைகள் விபரம்',
    healthcareSubtitle: 'அரசு மருத்துவக் கல்லூரி மருத்துவமனைகள் & சிறப்பு நீரிழிவு மையங்கள்',
    nurseTitle: 'பாதசுவடு AI மெய்நிகர் செவிலியர்',
    nurseSubtitle: 'குரல் வழி உரையாடல் மூலம் நீரிழிவு கால் நலம் பற்றிய ஆலோசனைகள்',
    researchTitle: 'தொழில்நுட்ப ஆராய்ச்சி & மாதிரி மதிப்பீடு',
    researchSubtitle: 'தரவுத்தொகுப்பு, நியூரல் நெட்வொர்க் கட்டமைப்பு மற்றும் துல்லிய அளவீடுகள்',
    emergencyHelpline: 'தமிழ்நாடு நல்வாழ்வு உதவி எண்: 104 | அவசர சிகிச்சை: 108',
    tnHelplineText: 'தமிழ்நாட்டில் 24 மணி நேர இலவச மருத்துவ ஆலோசனை மற்றும் ஆம்புலன்ஸ் சேவை',
    verifiedSourceBadge: 'சான்றளிக்கப்பட்ட மருத்துவ ஆதாரம்',
    doTitle: 'செய்ய வேண்டியவை (DO)',
    dontTitle: 'தவிர்க்க வேண்டியவை (DON’T)',
    preferTitle: 'உட்கொள்ள வேண்டிய உணவுகள்',
    limitTitle: 'குறைக்க வேண்டிய உணவுகள்',
    portionAwarenessTitle: 'உணவு தட்டு முறை & அளவு விழிப்புணர்வு',
    hydrationTitle: 'நீர் அருந்துதல் வழிகாட்டுதல்',
    filterAll: 'அனைத்து மருத்துவமனைகளும்',
    filterGovt: 'அரசு மருத்துவமனைகள்',
    filterPrivate: 'தனியார் சிறப்பு மையங்கள்',
    selectDistrict: 'தமிழ்நாடு மாவட்டத்தைத் தேர்ந்தெடுக்கவும்',
    allDistricts: 'அனைத்து மாவட்டங்கள்',
    directionsBtn: 'வழித்தடம் (Google Maps)',
    callHospitalBtn: 'அழைக்கவும்',
    emergencyNumber: 'அவசர பிரிவு',
    noHospitalsFound: 'தேர்ந்தெடுக்கப்பட்ட பிரிவில் மருத்துவமனைகள் இல்லை.',
    voiceInputListening: 'உங்கள் குரலைக் கேட்கிறது... பேசுங்கள்',
    voiceInputThinking: 'பாதசுவடு யோசிக்கிறது...',
    voiceInputSpeaking: 'பாதசுவடு பேசுகிறது...',
    typeYourQuestion: 'உங்கள் கேள்வியை தமிழ் அல்லது ஆங்கிலத்தில் தட்டச்சு செய்யவும் அல்லது பேசவும்...',
    send: 'அனுப்பு',
    clearHistory: 'பதிவுகளை அழிக்கவும்',
    noHistoryYet: 'முந்தைய பதிவுகள் எதுவும் இல்லை. உங்கள் முதல் பரிசோதனையை இப்போது மேற்கொள்ளவும்.',
    downloadReport: 'அறிக்கையைப் பதிவிறக்கவும்',
    saveToHistory: 'பதிவுகளில் சேமிக்கவும்',
    savedSuccessfully: 'பரிசோதனை முடிவு உங்கள் சாதனத்தில் சேமிக்கப்பட்டது.'
  }
};
