// Pre-configured high-quality test samples for instant screening and validation rule verification
export interface SampleScreeningPreset {
  id: string;
  nameEn: string;
  nameTa: string;
  type: 'NORMAL_FOOT' | 'ABNORMAL_FOOT' | 'NON_FOOT_REJECT';
  descriptionEn: string;
  descriptionTa: string;
  dataUrl: string;
}

// Generate high quality SVG data URLs that represent realistic anatomical test patterns
const createSvgDataUrl = (svgContent: string): string => {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent.trim())}`;
};

export const sampleScreeningPresets: SampleScreeningPreset[] = [
  {
    id: 'sample-normal-foot',
    nameEn: 'Healthy Plantar Foot',
    nameTa: 'ஆரோக்கியமான பாதம்',
    type: 'NORMAL_FOOT',
    descriptionEn: 'Intact epidermis, healthy plantar arch, uniform skin tone (Expected: NORMAL)',
    descriptionTa: 'ஆரோக்கியமான தோல் அமைப்பு, புண்கள் இல்லை (எதிர்பார்ப்பு: சாதாரணம்)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
        <defs>
          <radialGradient id="skinGrad" cx="45%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#e8b99c" />
            <stop offset="70%" stop-color="#d49f7e" />
            <stop offset="100%" stop-color="#be8764" />
          </radialGradient>
          <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.2" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#1e293b" />
        <!-- Clinical Foot Sole Silhouette -->
        <g filter="url(#softShadow)">
          <!-- Heel -->
          <ellipse cx="200" cy="380" rx="55" ry="60" fill="url(#skinGrad)" />
          <!-- Midfoot / Arch -->
          <path d="M 155 350 C 145 280 160 220 180 180 C 230 180 250 250 245 350 Z" fill="url(#skinGrad)" />
          <!-- Forefoot Ball -->
          <ellipse cx="200" cy="180" rx="75" ry="50" fill="url(#skinGrad)" />
          <!-- Big Toe -->
          <ellipse cx="145" cy="115" rx="24" ry="32" fill="url(#skinGrad)" />
          <!-- 2nd Toe -->
          <ellipse cx="185" cy="105" rx="16" ry="26" fill="url(#skinGrad)" />
          <!-- 3rd Toe -->
          <ellipse cx="218" cy="112" rx="14" ry="23" fill="url(#skinGrad)" />
          <!-- 4th Toe -->
          <ellipse cx="246" cy="125" rx="12" ry="20" fill="url(#skinGrad)" />
          <!-- Little Toe -->
          <ellipse cx="268" cy="142" rx="10" ry="17" fill="url(#skinGrad)" />
        </g>
        <text x="200" y="475" text-anchor="middle" fill="#94a3b8" font-size="13" font-family="sans-serif">FootGuard AI Screening • Plantar Foot Specimen</text>
      </svg>
    `),
  },
  {
    id: 'sample-ulcer-foot',
    nameEn: 'Forefoot Ulcer Lesion',
    nameTa: 'முன்பாத புண் அடையாளம்',
    type: 'ABNORMAL_FOOT',
    descriptionEn: 'Metatarsal head ulceration with surrounding erythema (Expected: ABNORMAL)',
    descriptionTa: 'சிவத்தல் மற்றும் திசு முறிவுடன் கூடிய பாதம் (எதிர்பார்ப்பு: அசாதாரணம்)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
        <defs>
          <radialGradient id="skinGrad2" cx="45%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#e2ad8f" />
            <stop offset="70%" stop-color="#cf9472" />
            <stop offset="100%" stop-color="#b67b57" />
          </radialGradient>
          <radialGradient id="ulcerErythema" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#7f1d1d" />
            <stop offset="40%" stop-color="#b91c1c" />
            <stop offset="80%" stop-color="#ef4444" stop-opacity="0.7" />
            <stop offset="100%" stop-color="#f87171" stop-opacity="0" />
          </radialGradient>
          <filter id="softShadow2" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.25" />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="#1e293b" />
        <g filter="url(#softShadow2)">
          <!-- Heel -->
          <ellipse cx="200" cy="380" rx="55" ry="60" fill="url(#skinGrad2)" />
          <!-- Arch -->
          <path d="M 155 350 C 145 280 160 220 180 180 C 230 180 250 250 245 350 Z" fill="url(#skinGrad2)" />
          <!-- Forefoot Ball -->
          <ellipse cx="200" cy="180" rx="75" ry="50" fill="url(#skinGrad2)" />
          <!-- Big Toe -->
          <ellipse cx="145" cy="115" rx="24" ry="32" fill="url(#skinGrad2)" />
          <!-- 2nd Toe -->
          <ellipse cx="185" cy="105" rx="16" ry="26" fill="url(#skinGrad2)" />
          <!-- 3rd Toe -->
          <ellipse cx="218" cy="112" rx="14" ry="23" fill="url(#skinGrad2)" />
          <!-- 4th Toe -->
          <ellipse cx="246" cy="125" rx="12" ry="20" fill="url(#skinGrad2)" />
          <!-- Little Toe -->
          <ellipse cx="268" cy="142" rx="10" ry="17" fill="url(#skinGrad2)" />

          <!-- Ulcer Bed under 1st Metatarsal Head -->
          <circle cx="175" cy="185" r="28" fill="url(#ulcerErythema)" />
          <circle cx="175" cy="185" r="14" fill="#581c87" />
          <circle cx="175" cy="185" r="9" fill="#3f0e0e" />
          <circle cx="173" cy="183" r="4" fill="#991b1b" />
        </g>
        <text x="200" y="475" text-anchor="middle" fill="#fca5a5" font-size="13" font-family="sans-serif">FootGuard AI • Diabetic Plantar Ulcer Clinical Specimen</text>
      </svg>
    `),
  },
  {
    id: 'sample-non-foot-apple',
    nameEn: 'Food Item (Red Apple)',
    nameTa: 'உணவு / பழம் (ஆப்பிள்)',
    type: 'NON_FOOT_REJECT',
    descriptionEn: 'Food/Fruit rejection test (Expected: Immediate Rejection & Dual Language Warning)',
    descriptionTa: 'உணவு பொருள் நிராகரிப்பு சோதனை (உடனடி நிராகரிப்பு & எச்சரிக்கை)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="100%" height="100%" fill="#0f172a" />
        <defs>
          <radialGradient id="appleGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="#f87171" />
            <stop offset="60%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#991b1b" />
          </radialGradient>
        </defs>
        <g transform="translate(0, -10)">
          <path d="M 200 110 C 200 70 220 50 235 45" stroke="#78350f" stroke-width="8" fill="none" stroke-linecap="round" />
          <path d="M 205 85 C 235 70 260 80 270 95 C 250 110 225 105 205 85 Z" fill="#22c55e" />
          <path d="M 200 130 C 140 100 80 150 80 230 C 80 320 160 360 200 340 C 240 360 320 320 320 230 C 320 150 260 100 200 130 Z" fill="url(#appleGrad)" />
          <ellipse cx="140" cy="180" rx="20" ry="35" transform="rotate(-30 140 180)" fill="#fca5a5" opacity="0.5" />
        </g>
        <text x="200" y="375" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">Invalid Non-Foot Object (Food/Fruit)</text>
      </svg>
    `),
  },
  {
    id: 'sample-non-foot-face',
    nameEn: 'Human Face / Portrait',
    nameTa: 'மனித முகம் / படம்',
    type: 'NON_FOOT_REJECT',
    descriptionEn: 'Face portrait rejection test (Expected: Immediate Rejection & Dual Language Warning)',
    descriptionTa: 'மனித முகம் நிராகரிப்பு சோதனை (உடனடி நிராகரிப்பு & எச்சரிக்கை)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="100%" height="100%" fill="#0f172a" />
        <circle cx="200" cy="190" r="100" fill="#fcd34d" />
        <!-- Eyes -->
        <circle cx="165" cy="170" r="14" fill="#1e293b" />
        <circle cx="235" cy="170" r="14" fill="#1e293b" />
        <circle cx="168" cy="167" r="4" fill="#ffffff" />
        <circle cx="238" cy="167" r="4" fill="#ffffff" />
        <!-- Smile -->
        <path d="M 155 220 Q 200 270 245 220" stroke="#1e293b" stroke-width="8" fill="none" stroke-linecap="round" />
        <text x="200" y="365" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">Invalid Non-Foot Image (Human Face)</text>
      </svg>
    `),
  },
  {
    id: 'sample-non-foot-hand',
    nameEn: 'Human Hand / Palm',
    nameTa: 'மனித கை / உள்ளங்கை',
    type: 'NON_FOOT_REJECT',
    descriptionEn: 'Hand/Palm rejection test (Expected: Immediate Rejection & Dual Language Warning)',
    descriptionTa: 'கை / உள்ளங்கை நிராகரிப்பு சோதனை (உடனடி நிராகரிப்பு & எச்சரிக்கை)',
    dataUrl: createSvgDataUrl(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <rect width="100%" height="100%" fill="#0f172a" />
        <g transform="translate(40, 20)">
          <!-- Palm -->
          <rect x="100" y="150" width="120" height="130" rx="30" fill="#f59e0b" />
          <!-- Thumb -->
          <rect x="50" y="170" width="60" height="35" rx="15" transform="rotate(-35 80 180)" fill="#f59e0b" />
          <!-- 4 Fingers -->
          <rect x="105" y="70" width="22" height="90" rx="11" fill="#f59e0b" />
          <rect x="135" y="50" width="24" height="110" rx="12" fill="#f59e0b" />
          <rect x="167" y="60" width="22" height="100" rx="11" fill="#f59e0b" />
          <rect x="197" y="85" width="20" height="75" rx="10" fill="#f59e0b" />
        </g>
        <text x="200" y="370" text-anchor="middle" fill="#94a3b8" font-size="14" font-family="sans-serif">Invalid Non-Foot Image (Human Hand/Palm)</text>
      </svg>
    `),
  },
];
