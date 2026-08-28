import { FootCareStep } from '../types';

export const footCareStepsData: FootCareStep[] = [
  {
    stepNumber: 1,
    titleEn: 'Inspect Your Feet Daily',
    titleTa: 'தினமும் கால்களை ஆய்வு செய்யவும்',
    shortDescEn: 'Examine top, bottom, heels, and between all toes in good lighting.',
    shortDescTa: 'நல்ல வெளிச்சத்தில் பாதத்தின் மேல்புறம், அடிப்பகுதி, குதிங்கால் மற்றும் விரல் இடுக்குகளைப் பார்க்கவும்.',
    detailedEn: [
      'Use a hand mirror or ask a family member if you cannot bend or see your soles clearly.',
      'Look specifically for cracks, peeling skin, blisters, calluses, or unusual dark spots.',
      'Make foot inspection a regular part of your evening routine before bedtime.'
    ],
    detailedTa: [
      'அடிப்பாதத்தைப் பார்க்க முடியவில்லை எனில் முகம் பார்க்கும் கண்ணாடியைப் பயன்படுத்தவும் அல்லது குடும்பத்தினர் உதவியைப் பெறவும்.',
      'தோல் வெடிப்பு, கொப்புளங்கள், தழும்புகள் அல்லது கருமை நிற மாற்றங்களை உன்னிப்பாகக் கவனிக்கவும்.',
      'இரவு தூங்குவதற்கு முன் இதை ஒரு வழக்கமான பழக்கமாக மாற்றிக் கொள்ளவும்.'
    ],
    iconName: 'Eye',
    sourceRef: 'IWGDF 2023 Guideline Sec 3.1'
  },
  {
    stepNumber: 2,
    titleEn: 'Check for Cuts, Redness or Swelling',
    titleTa: 'காயங்கள், சிவத்தல் அல்லது வீக்கத்தை பரிசோதிக்கவும்',
    shortDescEn: 'Feel for temperature differences and spot early warning signs before they worsen.',
    shortDescTa: 'பாதத்தில் அதிக வெப்பம் அல்லது வீக்கம் உள்ளதா என தொட்டு உணர்ந்து பரிசோதிக்கவும்.',
    detailedEn: [
      'Check if one foot feels distinctly warmer or swollen compared to the other (sign of inflammation/infection).',
      'Feel gently for tenderness, localized throbbing, or unnoticed scratches.',
      'Diabetic neuropathy blunts pain, so visual inspection is your primary line of defense.'
    ],
    detailedTa: [
      'ஒரு கால் மற்றொரு காலை விட அதிக சூடாகவோ அல்லது வீக்கமாகவோ உள்ளதா எனப் பார்க்கவும்.',
      'வலியை உணர முடியாத நரம்பு பலவீனம் உள்ளதால், கண்ணால் பார்த்து சரிபார்ப்பதே மிக முக்கியம்.',
      'லேசான சிவத்தல் தெரிந்தாலும் உடனடியாக கவனிக்கவும்.'
    ],
    iconName: 'AlertCircle',
    sourceRef: 'IWGDF 2023 Guideline Sec 3.2'
  },
  {
    stepNumber: 3,
    titleEn: 'Keep Feet Clean & Gently Dry',
    titleTa: 'கால்களை சுத்தமாகவும் உலர்வாகவும் வைத்திருக்கவும்',
    shortDescEn: 'Wash daily with mild soap & lukewarm water; pat dry thoroughly between toes.',
    shortDescTa: 'மிதமான சோப்பு மற்றும் வெதுவெதுப்பான நீரில் கழுவி, விரல் இடுக்குகளை மென்மையாக துடைக்கவும்.',
    detailedEn: [
      'Always test water temperature with your elbow or thermometer (never hot water).',
      'Do not soak feet for more than 5 minutes as it macerates and weakens skin barriers.',
      'Apply moisturizer to heels and soles to prevent cracking, but NEVER apply lotion between toes.'
    ],
    detailedTa: [
      'நீரின் வெப்பத்தை எப்போதும் முழங்கையால் சோதிக்கவும் (அதிக சூடான நீரைத் தவிர்க்கவும்).',
      '5 நிமிடங்களுக்கு மேல் கால்களை நீரில் ஊற வைக்க வேண்டாம்; இது தோலை பலவீனப்படுத்தும்.',
      'குதிங்கால் பகுதியில் மாய்ஸ்சரைசர் பூசலாம், ஆனால் விரல் இடுக்குகளுக்குள் பூசக்கூடாது.'
    ],
    iconName: 'Sparkles',
    sourceRef: 'CDC Diabetic Foot Care Protocols'
  },
  {
    stepNumber: 4,
    titleEn: 'Inspect Footwear Before Wearing',
    titleTa: 'காலணிகளை அணியும் முன் உள்ளே சரிபார்க்கவும்',
    shortDescEn: 'Shake and feel inside shoes with your hand for small stones, rough seams, or nails.',
    shortDescTa: 'செருப்பு அல்லது காலணிக்குள் சிறு கற்கள், முட்கள் அல்லது கடினமான தையல்கள் உள்ளதா என கையால் தடவி பார்க்கவும்.',
    detailedEn: [
      'Always reach inside each shoe with your fingers before inserting your foot.',
      'Ensure the inner lining is smooth and insoles are not folded or torn.',
      'Wear seamless, moisture-wicking cotton or diabetic socks without tight elastic bands.'
    ],
    detailedTa: [
      'கால்களை நுழைக்கும் முன் எப்போதும் காலணியின் உள்பகுதியை கையால் தொட்டுப் பார்க்கவும்.',
      'உள்பகுதி மென்மையாக உள்ளதா, கிழிசல் எதுவும் இல்லையா என்பதை உறுதி செய்யவும்.',
      'இறுக்கமான எலாஸ்டிக் இல்லாத பருத்தி காலுறைகளை (Socks) பயன்படுத்தவும்.'
    ],
    iconName: 'Footprints',
    sourceRef: 'IWGDF 2023 Protective Footwear Guideline'
  },
  {
    stepNumber: 5,
    titleEn: 'Never Walk Barefoot',
    titleTa: 'ஒருபோதும் வெறுங்காலுடன் நடக்காதீர்கள்',
    shortDescEn: 'Always wear protective footwear even inside the house and on temple floors.',
    shortDescTa: 'வீட்டிற்குள்ளும் சரி, வெளியிடங்களிலும் சரி எப்போதும் பாதுகாப்பான காலணிகளை அணியுங்கள்.',
    detailedEn: [
      'Wear supportive, soft indoor slippers at home to prevent stepping on unseen pins or objects.',
      'Avoid walking barefoot on hot pavements, sandy beaches, or heated temple stones.',
      'Choose wide-toe box shoes that do not pinch or compress your toes.'
    ],
    detailedTa: [
      'வீட்டிற்குள் நடக்கும் போதும் மென்மையான உள்ளரங்கு செருப்புகளை அணியுங்கள்.',
      'சூடான தார் சாலை, கடற்கரை மணல் அல்லது கோவில் தளங்களில் வெறுங்காலுடன் நடக்க வேண்டாம்.',
      'முன் பகுதி அகலமான, விரல்களை அழுத்தாத காலணிகளைத் தேர்வு செய்யவும்.'
    ],
    iconName: 'ShieldAlert',
    sourceRef: 'IWGDF 2023 Sec 4.4'
  },
  {
    stepNumber: 6,
    titleEn: 'Follow Diabetes Care & Glucose Targets',
    titleTa: 'மருத்துவ வழிகாட்டல் & சர்க்கரை அளவு கட்டுப்பாடு',
    shortDescEn: 'Maintain target HbA1c, take prescribed medications, and monitor blood pressure.',
    shortDescTa: 'மருத்துவர் அறிவுறுத்தியபடி மருந்துகளை உட்கொண்டு, HbA1c சர்க்கரை அளவைக் கட்டுக்குள் வைக்கவும்.',
    detailedEn: [
      'Healthy glycemic control significantly slows down diabetic peripheral neuropathy and microvascular decay.',
      'Avoid smoking or tobacco use as it severely constricts peripheral microcirculation in feet.',
      'Engage in gentle, physician-approved leg mobility exercises to stimulate blood flow.'
    ],
    detailedTa: [
      'சரியான சர்க்கரை அளவு கட்டுப்பாடு நரம்பு பாதிப்பை பெருமளவில் தடுக்கிறது.',
      'புகைபிடித்தல் மற்றும் புகையிலை பழக்கத்தை தவிர்க்கவும்; இது பாத ரத்த ஓட்டத்தை முடக்கும்.',
      'ரத்த ஓட்டத்தை சீராக்க மருத்துவர் பரிந்துரைக்கும் எளிய நடைப்பயிற்சியை மேற்கொள்ளவும்.'
    ],
    iconName: 'HeartPulse',
    sourceRef: 'IDF Global Clinical Guidelines'
  },
  {
    stepNumber: 7,
    titleEn: 'Seek Professional Care for Changes',
    titleTa: 'மாற்றங்கள் தெரிந்தால் மருத்துவரை அணுகவும்',
    shortDescEn: 'Never self-treat calluses, corns, or ingrown toenails with blades or chemicals.',
    shortDescTa: 'ஆணி அல்லது தழும்புகளை பிளேடு கொண்டு வெட்டவோ, சுயமாக மருந்திடவோ கூடாது.',
    detailedEn: [
      'Do not cut corns or calluses with razors, nail clippers, or corn plasters containing harsh acids.',
      'Cut toenails straight across and gently file sharp corners with an emery board.',
      'If you notice any persistent break in the skin, oozing, or blackish discoloration, seek clinical care within 24-48 hours.'
    ],
    detailedTa: [
      'பிளேடு அல்லது கூர்மையான கருவிகள் கொண்டு ஆணி அல்லது தழும்புகளை வெட்ட முயற்சிக்க வேண்டாம்.',
      'நகங்களை நேராக வெட்டி, முனைகளை மென்மையாக அரம் கொண்டு தேய்க்கவும்.',
      'தோல் வெடிப்பு, சீழ் அல்லது நிற மாற்றம் தென்பட்டால் உடனடியாக 24-48 மணி நேரத்திற்குள் மருத்துவரை அணுகவும்.'
    ],
    iconName: 'Stethoscope',
    sourceRef: 'IWGDF 2023 Triage & Referral'
  }
];

export const doAndDontList = {
  dos: [
    {
      titleEn: 'Inspect feet daily with good light and mirror',
      titleTa: 'கண்ணாடி மற்றும் நல்ல வெளிச்சத்தில் தினமும் கால்களைப் பார்க்கவும்',
      descEn: 'Check soles and toe webs for any tiny cracks or color changes.',
      descTa: 'அடிப்பாகம் மற்றும் விரல் இடுக்குகளில் ஏதேனும் வெடிப்பு உள்ளதா என சரிபார்க்கவும்.',
      citation: 'IWGDF 2023'
    },
    {
      titleEn: 'Wear customized or soft-padded diabetic footwear',
      titleTa: 'மென்மையான குஷனிங் கொண்ட நீரிழிவு காலணிகளை அணியவும்',
      descEn: 'Protects pressure points and avoids frictional shear.',
      descTa: 'பாத அழுத்த புள்ளிகளைப் பாதுகாத்து காயம் ஏற்படுவதைத் தடுக்கும்.',
      citation: 'IWGDF 2023'
    },
    {
      titleEn: 'Pat dry gently between toes with a clean towel',
      titleTa: 'சுத்தமான துண்டால் விரல் இடுக்குகளை மென்மையாக துடைக்கவும்',
      descEn: 'Prevents fungal infections (tinea pedis) and skin maceration.',
      descTa: 'பூஞ்சை தொற்று மற்றும் தோல் அழுகலைத் தடுக்கும்.',
      citation: 'CDC Guidelines'
    },
    {
      titleEn: 'Trim toenails straight across',
      titleTa: 'கால் நகங்களை நேராக வெட்டவும்',
      descEn: 'Avoids ingrown toenails and accidental skin punctures.',
      descTa: 'நகம் சதையில் புதைந்து காயம் ஏற்படுவதைத் தடுக்கும்.',
      citation: 'IDF Guidelines'
    }
  ],
  donts: [
    {
      titleEn: 'Never walk barefoot indoors or outdoors',
      titleTa: 'வீட்டிலோ அல்லது வெளியிலோ ஒருபோதும் வெறுங்காலுடன் நடக்க வேண்டாம்',
      descEn: 'Loss of sensation makes you unaware of thorns, pins, or hot floors.',
      descTa: 'நரம்பு உணர்வின்மை காரணமாக முட்கள் அல்லது சூடு தெரியாமல் காயம் ஏற்படும்.',
      citation: 'IWGDF 2023'
    },
    {
      titleEn: 'Do not apply moisturizer between toes',
      titleTa: 'விரல் இடுக்குகளில் மாய்ஸ்சரைசர் அல்லது எண்ணெய் பூச வேண்டாம்',
      descEn: 'Excessive moisture between toes breeds bacterial and fungal infections.',
      descTa: 'அதிகப்படியான ஈரப்பதம் பாக்டீரியா மற்றும் பூஞ்சை தொற்றை உருவாக்கும்.',
      citation: 'CDC Guidelines'
    },
    {
      titleEn: 'Never use blades, razors or acid corn caps on feet',
      titleTa: 'பிளேடு, கத்தி அல்லது ஆசிட் பிளாஸ்டர்களை பாதத்தில் பயன்படுத்த வேண்டாம்',
      descEn: 'Self-treatment of calluses is a major cause of deep ulceration and infection.',
      descTa: 'சுயமாக ஆணி அல்லது தழும்பை வெட்டுவது ஆழமான புண்ணிற்கு வழிவகுக்கும்.',
      citation: 'IWGDF 2023'
    },
    {
      titleEn: 'Do not use hot water bags or direct heating pads on feet',
      titleTa: 'வெந்நீர் ஒத்தடம் அல்லது ஹீட்டிங் பேட்களை நேரடியாக வைக்க வேண்டாம்',
      descEn: 'Neuropathy prevents sensing high heat, causing severe burns.',
      descTa: 'உணர்வின்மை காரணமாக கடுமையான தீக்காயங்கள் ஏற்பட வாய்ப்புள்ளது.',
      citation: 'IDF Guidelines'
    }
  ]
};
