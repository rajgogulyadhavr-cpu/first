# 11. Hospital and Diet Modules — FootGuard AI

## Healthcare Finder Module (`HealthcareFinder.tsx`)
- Searchable directory of verified Tamil Nadu Government Medical Colleges, District Hospitals, and podiatry specialists (`src/data/hospitalsData.ts`).
- Filterable by district (Chennai, Coimbatore, Madurai, Tiruchirappalli, Salem, etc.) and hospital type (Government vs Private Specialist).
- Includes direct phone links, emergency numbers (104, 108), OPD timings, and interactive SVG district map markers (`TamilNaduMapSvg.tsx`).

## South Indian Diabetic Nutrition Module (`DietNutrition.tsx`)
- Evidence-based dietary recommendations tailored for Tamil Nadu patients (`src/data/dietData.ts`).
- **Recommended Foods**: Kovakkai (Ivy Gourd), Murungai Keerai (Drumstick Leaves), Millets (Kambu, Thinai), Yam (Karunai Kizhangu).
- **Foods to Limit**: White rice, Maida bakery items, sweets, deep-fried snacks.
- Glycemic Index badges and portion control guidance based on ICMR 2023 recommendations.
