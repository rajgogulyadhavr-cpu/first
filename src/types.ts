export type Language = 'en' | 'ta';

export type DFUClass = 'NORMAL' | 'ABNORMAL';

export interface ImageQualityReport {
  isAcceptable: boolean;
  blurScore: number; // 0-100 (higher is sharper)
  isBlurry: boolean;
  brightnessScore: number; // 0-255
  isTooDark: boolean;
  isTooBright: boolean;
  resolution: {
    width: number;
    height: number;
    isAdequate: boolean;
  };
  rejectionReason?: string;
  rejectionReasonTa?: string;
}

export interface FootValidationReport {
  isFoot: boolean;
  footConfidence: number; // 0-1
  detectedCategory: string; // 'human_foot', 'plantar_surface', 'dorsal_surface', 'non_foot', 'face', 'animal', 'food', etc.
  rejectionReason?: string;
  rejectionReasonTa?: string;
}

export interface InferenceBenchmark {
  totalPipelineMs: number;
  preprocessingMs: number;
  inferenceMs: number;
  initWarmupMs: number;
  isWarm: boolean;
  isWithinTarget: boolean; // < 3000ms target
  accelerationMode: 'WebAssembly SIMD' | 'WebGL Accelerated' | 'Cloud Edge Tensor' | 'Hybrid Optimized';
}

export interface DFUPredictionResult {
  id: string;
  timestamp: string;
  prediction: DFUClass;
  confidence: number; // 0.0 to 1.0 (actual model metric)
  probabilityNormal: number;
  probabilityAbnormal: number;
  riskLevel: 'LOW' | 'HIGH';
  statusSummaryEn: string;
  statusSummaryTa: string;
  keyFindingsEn: string[];
  keyFindingsTa: string[];
  recommendationEn: string;
  recommendationTa: string;
  gradCamHeatmap?: string; // base64 or SVG mask coordinates
  heatmapPoints?: { x: number; y: number; intensity: number; radius: number }[];
  isLocalizationAvailable?: boolean;
  localizationDescriptionEn?: string;
  localizationDescriptionTa?: string;
  qualityReport: ImageQualityReport;
  footValidation: FootValidationReport;
  imageUrl: string;
  benchmark?: InferenceBenchmark;
}

export interface Specialist {
  id: string;
  nameEn: string;
  nameTa: string;
  photoUrl: string;
  qualificationEn: string;
  qualificationTa: string;
  designationEn: string;
  designationTa: string;
  specialtyEn: string;
  specialtyTa: string;
  hospitalId: string;
  hospitalNameEn: string;
  hospitalNameTa: string;
  hospitalType: 'GOVERNMENT' | 'PRIVATE';
  district: string;
  districtTa: string;
  opdDaysEn: string;
  opdDaysTa: string;
  opdTimingsEn: string;
  opdTimingsTa: string;
  contactNumber: string;
  appointmentDetailsEn: string;
  appointmentDetailsTa: string;
  isVerified: boolean;
  verifiedSource: string;
  experienceYears?: number;
}

export interface Hospital {
  id: string;
  nameEn: string;
  nameTa: string;
  type: 'GOVERNMENT' | 'PRIVATE';
  category: 'MEDICAL_COLLEGE' | 'DISTRICT_HOSPITAL' | 'FOOT_CARE_CLINIC' | 'DIABETES_CENTRE' | 'SPECIALTY_HOSPITAL';
  district: string;
  districtTa: string;
  addressEn: string;
  addressTa: string;
  phone: string;
  emergencyPhone?: string;
  specialtyEn: string;
  specialtyTa: string;
  dfuSpecialistNamesEn?: string[];
  dfuSpecialistNamesTa?: string[];
  specialists?: Specialist[];
  timingsEn: string;
  timingsTa: string;
  lat: number;
  lng: number;
  mapsUrl: string;
  distanceKm?: number;
  verifiedDate: string;
  verifiedSource: string;
  isNabhAccredited?: boolean;
}

export interface MedicalSource {
  id: string;
  titleEn: string;
  titleTa: string;
  organization: string; // 'IWGDF', 'WHO', 'IDF', 'CDC', 'ICMR'
  year: number;
  guidelineName: string;
  url: string;
  doi?: string;
  summaryEn: string;
  summaryTa: string;
  lastVerified: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'nurse';
  textEn: string;
  textTa?: string;
  timestamp: string;
  audioBase64?: string;
  isAudioPlaying?: boolean;
}

export interface FootCareStep {
  stepNumber: number;
  titleEn: string;
  titleTa: string;
  shortDescEn: string;
  shortDescTa: string;
  detailedEn: string[];
  detailedTa: string[];
  iconName: string;
  sourceRef: string;
}

export interface FoodItem {
  id: string;
  nameEn: string;
  nameTa: string;
  category: 'PREFER' | 'LIMIT';
  foodGroup: 'VEGETABLES' | 'GRAINS_MILLETS' | 'PULSES_PROTEIN' | 'BEVERAGES_OILS' | 'SNACKS_SWEETS';
  glycemicImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  benefitsEn: string;
  benefitsTa: string;
  portionTipEn: string;
  portionTipTa: string;
  traditionalContextEn?: string;
  traditionalContextTa?: string;
  imageUrl: string;
  evidenceSource: string;
  evidenceSourceTa?: string;
}

export interface ModelBenchmarkMetrics {
  modelName: string;
  datasetName: string;
  datasetUrl: string;
  datasetLicense: string;
  datasetTotalImages: number;
  datasetClasses: { name: string; count: number }[];
  trainingFramework: string;
  inputSize: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  specificity: number;
  rocAuc: number;
  confusionMatrix: {
    trueNormal: number;
    falseAbnormal: number;
    falseNormal: number;
    trueAbnormal: number;
  };
  lastEvaluated: string;
}
