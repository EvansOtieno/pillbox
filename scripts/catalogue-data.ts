/**
 * Fictional catalogue for the Afya Corner demo. Generic medicine names only (no brands);
 * prices are invented. Each base product may have several pack-size variants.
 */

import type { RxClass } from "../src/lib/domain/product-rules";

export interface CategoryData {
  slug: string;
  name: string;
  description: string;
  products: BaseProduct[];
}

export interface BaseProduct {
  name: string;
  /** One sentence: what it's for. */
  use: string;
  rx?: RxClass;
  /** [pack label, price in KES]. The label is appended to the name. */
  variants: Array<[string, number]>;
}

export const catalogue: CategoryData[] = [
  {
    slug: "pain-fever",
    name: "Pain & fever",
    description: "Relief for headaches, body aches, period pain and fever.",
    products: [
      { name: "Paracetamol 500mg Tablets", use: "Relieves mild to moderate pain and reduces fever", variants: [["24s", 120], ["100s", 380]] },
      { name: "Ibuprofen 200mg Tablets", use: "Relieves pain, inflammation and fever", variants: [["24s", 180], ["48s", 320]] },
      { name: "Ibuprofen 400mg Tablets", use: "Stronger relief for pain and inflammation", rx: "pharmacy_only", variants: [["24s", 290]] },
      { name: "Paracetamol Children's Suspension 120mg/5ml", use: "Pain and fever relief for children from 3 months", variants: [["60ml", 220], ["100ml", 320]] },
      { name: "Ibuprofen Children's Suspension 100mg/5ml", use: "Pain and fever relief for children from 6 months", variants: [["100ml", 380]] },
      { name: "Diclofenac 1% Gel", use: "Topical relief for muscle and joint pain", variants: [["30g", 350], ["50g", 520]] },
      { name: "Diclofenac 50mg Tablets", use: "Prescription anti-inflammatory for joint and muscle pain", rx: "prescription_only", variants: [["30s", 420]] },
      { name: "Aspirin 75mg Dispersible Tablets", use: "Low-dose aspirin as directed by your doctor", rx: "pharmacy_only", variants: [["28s", 150], ["100s", 420]] },
      { name: "Mefenamic Acid 500mg Tablets", use: "Relief for period pain", rx: "pharmacy_only", variants: [["20s", 340]] },
      { name: "Naproxen 500mg Tablets", use: "Prescription anti-inflammatory for arthritis and pain", rx: "prescription_only", variants: [["28s", 560]] },
      { name: "Celecoxib 200mg Capsules", use: "Prescription treatment for arthritis pain", rx: "prescription_only", variants: [["30s", 1450]] },
      { name: "Menthol Muscle Rub", use: "Warming rub for tired and aching muscles", variants: [["50g", 390], ["100g", 640]] },
      { name: "Heat Relief Patches", use: "Soothing warmth for back and neck pain", variants: [["5s", 750]] },
      { name: "Migraine Relief Caplets", use: "Paracetamol and caffeine for headaches", variants: [["16s", 310]] },
      { name: "Cold Pack Reusable", use: "Cold therapy for sprains and swelling", variants: [["1 unit", 480]] },
      { name: "Paracetamol 1g Effervescent Tablets", use: "Fast-dissolving pain and fever relief", variants: [["20s", 290]] },
      { name: "Ibuprofen 5% Gel", use: "Targeted relief for sprains and strains", variants: [["50g", 480]] },
      { name: "Knee Support Elastic", use: "Light support for weak or injured knees", variants: [["Medium", 890], ["Large", 890]] },
      { name: "Warming Joint Balm", use: "Herbal warming balm for stiff joints", variants: [["40g", 420]] },
    ],
  },
  {
    slug: "cold-flu-allergy",
    name: "Cold, flu & allergy",
    description: "Coughs, blocked noses, sore throats and hay fever.",
    products: [
      { name: "Cetirizine 10mg Tablets", use: "Once-a-day relief from hay fever and allergies", variants: [["10s", 110], ["30s", 290]] },
      { name: "Loratadine 10mg Tablets", use: "Non-drowsy allergy relief", variants: [["10s", 140], ["30s", 360]] },
      { name: "Chlorphenamine 4mg Tablets", use: "Relief from allergy symptoms and itching", variants: [["30s", 90]] },
      { name: "Fexofenadine 180mg Tablets", use: "Non-drowsy relief from severe hay fever", rx: "pharmacy_only", variants: [["10s", 620]] },
      { name: "Dry Cough Syrup", use: "Soothes dry, tickly coughs", variants: [["100ml", 340], ["200ml", 560]] },
      { name: "Chesty Cough Syrup", use: "Loosens mucus in chesty coughs", variants: [["100ml", 360], ["200ml", 590]] },
      { name: "Honey & Lemon Throat Lozenges", use: "Soothes sore throats", variants: [["16s", 220], ["36s", 420]] },
      { name: "Saline Nasal Spray", use: "Gently clears a blocked nose; suitable for daily use", variants: [["20ml", 380]] },
      { name: "Xylometazoline 0.1% Nasal Spray", use: "Fast relief for a blocked nose (max 7 days)", rx: "pharmacy_only", variants: [["10ml", 330]] },
      { name: "Menthol Vapour Rub", use: "Eases nasal congestion and cough", variants: [["50g", 350]] },
      { name: "Cold & Flu Day Capsules", use: "Relieves fever, aches and congestion", variants: [["16s", 420]] },
      { name: "Steam Inhaler Capsules", use: "Aromatic oils for steam inhalation", variants: [["10s", 290]] },
      { name: "Amoxicillin 500mg Capsules", use: "Prescription antibiotic for bacterial infections", rx: "prescription_only", variants: [["15s", 380], ["21s", 480]] },
      { name: "Azithromycin 500mg Tablets", use: "Prescription antibiotic for bacterial infections", rx: "prescription_only", variants: [["3s", 520]] },
      { name: "Prednisolone 5mg Tablets", use: "Prescription steroid for inflammation and allergy", rx: "prescription_only", variants: [["30s", 260]] },
      { name: "Antiseptic Throat Spray", use: "Numbs and soothes painful sore throats", variants: [["30ml", 540]] },
      { name: "Montelukast 10mg Tablets", use: "Prescription medicine for asthma and allergic rhinitis", rx: "prescription_only", variants: [["30s", 890]] },
      { name: "Beclometasone Nasal Spray", use: "Prevents and treats hay fever symptoms", rx: "pharmacy_only", variants: [["200 doses", 740]] },
      { name: "Children's Cough Syrup", use: "Gentle, sugar-free cough relief for children 2+", variants: [["100ml", 390]] },
      { name: "Zinc & Vitamin C Lozenges", use: "Soothes the throat and supports immunity", variants: [["24s", 450]] },
      { name: "Disposable Face Masks", use: "3-ply masks for everyday protection", variants: [["10s", 150], ["50s", 590]] },
    ],
  },
  {
    slug: "vitamins-supplements",
    name: "Vitamins & supplements",
    description: "Daily vitamins, minerals and supplements for the whole family.",
    products: [
      { name: "Vitamin C 1000mg Effervescent Tablets", use: "Supports the immune system", variants: [["20s", 850], ["2 x 20s", 1550]] },
      { name: "Vitamin D3 1000IU Softgels", use: "Supports bones, teeth and immunity", variants: [["60s", 990], ["120s", 1690]] },
      { name: "Adult Multivitamin Tablets", use: "A daily multivitamin and mineral for adults", variants: [["30s", 1100], ["90s", 2750]] },
      { name: "Kids' Multivitamin Gummies", use: "Fruit-flavoured daily vitamins for children 3+", variants: [["60s", 1350]] },
      { name: "Zinc 15mg Tablets", use: "Supports immunity, skin and hair", variants: [["30s", 520]] },
      { name: "Iron & Folic Acid Tablets", use: "Helps reduce tiredness and fatigue", variants: [["30s", 380], ["90s", 950]] },
      { name: "Calcium + Vitamin D3 Tablets", use: "Supports strong bones", variants: [["60s", 870]] },
      { name: "Omega-3 Fish Oil 1000mg Capsules", use: "Supports heart and brain health", variants: [["60s", 1250], ["120s", 2150]] },
      { name: "Magnesium 250mg Tablets", use: "Supports muscles and reduces tiredness", variants: [["60s", 940]] },
      { name: "Vitamin B-Complex Tablets", use: "Supports energy release and the nervous system", variants: [["30s", 620]] },
      { name: "Probiotic Capsules", use: "Supports a healthy gut", variants: [["30s", 1650]] },
      { name: "Marine Collagen Powder", use: "Supports skin, hair and nails", variants: [["150g", 2950]] },
      { name: "Biotin 5000mcg Tablets", use: "Supports healthy hair and nails", variants: [["60s", 1150]] },
      { name: "Glucosamine 1500mg Tablets", use: "Supports joint health", variants: [["60s", 1890]] },
      { name: "Energy Drink Powder Sachets", use: "Electrolytes and B vitamins for busy days", variants: [["10s", 690]] },
      { name: "Vitamin B12 1000mcg Tablets", use: "Supports energy and red blood cell formation", variants: [["60s", 890]] },
      { name: "Cod Liver Oil Capsules", use: "Vitamins A and D with omega-3", variants: [["60s", 780]] },
      { name: "Folic Acid 400mcg Tablets", use: "Recommended before and during early pregnancy", variants: [["90s", 350]] },
      { name: "Turmeric & Black Pepper Capsules", use: "A traditional supplement for joint comfort", variants: [["60s", 1290]] },
      { name: "Electrolyte Effervescent Tablets", use: "Rehydration after exercise or heat", variants: [["20s", 590]] },
    ],
  },
  {
    slug: "skin-beauty",
    name: "Skin & beauty",
    description: "Everyday skin care, sun protection and treatments.",
    products: [
      { name: "Sunscreen SPF 50 Lotion", use: "Broad-spectrum protection for face and body", variants: [["100ml", 1650], ["200ml", 2690]] },
      { name: "Daily Moisturising Cream", use: "Light, fragrance-free moisturiser for dry skin", variants: [["100ml", 890], ["400ml", 2150]] },
      { name: "Aqueous Cream", use: "Soap substitute and moisturiser for dry skin", variants: [["100g", 290], ["500g", 780]] },
      { name: "Petroleum Jelly", use: "Protects and soothes dry, chapped skin", variants: [["100ml", 210], ["250ml", 390]] },
      { name: "Hydrocortisone 1% Cream", use: "Relieves itching and mild eczema", rx: "pharmacy_only", variants: [["15g", 450]] },
      { name: "Clotrimazole 1% Cream", use: "Treats fungal skin infections such as athlete's foot", rx: "pharmacy_only", variants: [["20g", 280]] },
      { name: "Benzoyl Peroxide 5% Gel", use: "Treats mild to moderate acne", rx: "pharmacy_only", variants: [["30g", 690]] },
      { name: "Tretinoin 0.025% Cream", use: "Prescription treatment for acne", rx: "prescription_only", variants: [["20g", 980]] },
      { name: "Calamine Lotion", use: "Soothes itchy skin, bites and rashes", variants: [["100ml", 240]] },
      { name: "Antiseptic Cream", use: "Helps prevent infection in minor cuts and grazes", variants: [["30g", 320]] },
      { name: "Gentle Foaming Face Wash", use: "Cleans without drying; for oily and combination skin", variants: [["150ml", 850]] },
      { name: "Shea Butter Body Lotion", use: "Rich moisture for very dry skin", variants: [["400ml", 990]] },
      { name: "SPF 30 Lip Balm", use: "Protects and softens lips", variants: [["4g", 350]] },
      { name: "Adhesive Plasters Assorted", use: "Covers minor cuts and blisters", variants: [["20s", 180], ["40s", 320]] },
      { name: "First Aid Kit Travel", use: "Plasters, dressings and wipes for small injuries", variants: [["1 kit", 1450]] },
      { name: "Micellar Cleansing Water", use: "Removes make-up and cleanses in one step", variants: [["250ml", 990]] },
      { name: "Anti-dandruff Shampoo", use: "Controls flaking and itchy scalp", variants: [["200ml", 750]] },
      { name: "Insect Repellent Lotion", use: "Protects against mosquito bites for up to 8 hours", variants: [["100ml", 690]] },
      { name: "Aloe Vera After-sun Gel", use: "Cools and soothes sun-exposed skin", variants: [["200ml", 720]] },
      { name: "Mupirocin 2% Ointment", use: "Prescription antibiotic ointment for skin infections", rx: "prescription_only", variants: [["15g", 690]] },
    ],
  },
  {
    slug: "baby-mother",
    name: "Baby & mother",
    description: "Nappies, baby care and support for mums-to-be.",
    products: [
      { name: "Baby Nappies Size 2 (3–6kg)", use: "Soft, absorbent nappies for newborns", variants: [["44s", 1350]] },
      { name: "Baby Nappies Size 3 (5–9kg)", use: "Up to 12 hours of dryness", variants: [["40s", 1390], ["80s", 2590]] },
      { name: "Baby Nappies Size 4 (8–14kg)", use: "Stretchy sides for active babies", variants: [["36s", 1450], ["72s", 2690]] },
      { name: "Fragrance-free Baby Wipes", use: "Gentle cleansing for sensitive skin", variants: [["64s", 290], ["3 x 64s", 790]] },
      { name: "Nappy Rash Cream", use: "Soothes and protects against nappy rash", variants: [["50g", 480]] },
      { name: "Baby Lotion", use: "Mild moisturiser for baby skin", variants: [["200ml", 520]] },
      { name: "Infant Paracetamol Drops 100mg/ml", use: "Fever and pain relief for infants from 3 months", variants: [["15ml", 260]] },
      { name: "Oral Rehydration Salts", use: "Replaces fluids and salts lost through diarrhoea", variants: [["10 sachets", 250]] },
      { name: "Gripe Water", use: "Traditional relief for wind and colic", variants: [["150ml", 390]] },
      { name: "Teething Gel", use: "Soothes sore gums during teething", rx: "pharmacy_only", variants: [["10g", 450]] },
      { name: "Pregnancy Multivitamin Tablets", use: "Folic acid, iron and vitamins for pregnancy", variants: [["30s", 1290]] },
      { name: "Disposable Breast Pads", use: "Absorbent, discreet protection", variants: [["30s", 650]] },
      { name: "Anti-colic Feeding Bottle 260ml", use: "Vented bottle to reduce feeding wind", variants: [["1 bottle", 890]] },
      { name: "Digital Baby Thermometer", use: "Fast, flexible-tip thermometer", variants: [["1 unit", 750]] },
      { name: "Pregnancy Test Strips", use: "Early result pregnancy test", variants: [["2 tests", 350]] },
      { name: "Baby Nappies Size 5 (11–25kg)", use: "Extra absorbency for toddlers", variants: [["32s", 1490]] },
      { name: "Baby Shampoo Tear-free", use: "Gentle cleansing for hair and body", variants: [["200ml", 450]] },
      { name: "Nasal Aspirator for Babies", use: "Gently clears a baby's blocked nose", variants: [["1 unit", 650]] },
      { name: "Nipple Care Cream", use: "Soothes and protects sore nipples", variants: [["30g", 890]] },
      { name: "Maternity Pads", use: "Extra-absorbent pads for after birth", variants: [["10s", 390]] },
    ],
  },
  {
    slug: "chronic-care",
    name: "Chronic care & devices",
    description: "Diabetes, blood pressure and long-term medicines, with monitoring devices.",
    products: [
      { name: "Metformin 500mg Tablets", use: "Prescription medicine for type 2 diabetes", rx: "prescription_only", variants: [["30s", 190], ["100s", 540]] },
      { name: "Amlodipine 5mg Tablets", use: "Prescription medicine for high blood pressure", rx: "prescription_only", variants: [["30s", 240]] },
      { name: "Losartan 50mg Tablets", use: "Prescription medicine for high blood pressure", rx: "prescription_only", variants: [["30s", 420]] },
      { name: "Atorvastatin 20mg Tablets", use: "Prescription medicine to lower cholesterol", rx: "prescription_only", variants: [["30s", 480]] },
      { name: "Levothyroxine 50mcg Tablets", use: "Prescription thyroid hormone replacement", rx: "prescription_only", variants: [["28s", 360]] },
      { name: "Salbutamol 100mcg Inhaler", use: "Prescription reliever inhaler for asthma", rx: "prescription_only", variants: [["200 doses", 590]] },
      { name: "Omeprazole 20mg Capsules", use: "Relief from heartburn and acid reflux", rx: "pharmacy_only", variants: [["14s", 290], ["28s", 520]] },
      { name: "Antacid Chewable Tablets", use: "Fast relief from indigestion", variants: [["24s", 230]] },
      { name: "Blood Glucose Meter", use: "Easy home testing of blood sugar", variants: [["1 kit", 2650]] },
      { name: "Blood Glucose Test Strips", use: "For use with the Afya Care glucose meter", variants: [["50s", 2150]] },
      { name: "Lancets 30G", use: "Sterile lancets for finger-prick testing", variants: [["100s", 690]] },
      { name: "Upper Arm Blood Pressure Monitor", use: "Automatic, clinically validated BP readings", variants: [["1 unit", 5450]] },
      { name: "Pulse Oximeter", use: "Measures oxygen saturation and pulse", variants: [["1 unit", 2450]] },
      { name: "Weekly Pill Organiser", use: "Morning and evening compartments for 7 days", variants: [["1 unit", 450]] },
      { name: "Digital Thermometer", use: "Oral or underarm temperature in seconds", variants: [["1 unit", 480]] },
      { name: "Metformin 850mg Tablets", use: "Prescription medicine for type 2 diabetes", rx: "prescription_only", variants: [["60s", 390]] },
      { name: "Hydrochlorothiazide 25mg Tablets", use: "Prescription medicine for high blood pressure", rx: "prescription_only", variants: [["30s", 180]] },
      { name: "Glucose Tablets", use: "Fast sugar for low blood glucose", variants: [["10s", 250]] },
      { name: "Diabetic Foot Cream", use: "Moisturises very dry skin on the feet", variants: [["100ml", 890]] },
      { name: "Compression Socks", use: "Improves circulation on long journeys", variants: [["Medium", 1290], ["Large", 1290]] },
      { name: "Mesalazine 400mg Tablets", use: "Prescription medicine for inflammatory bowel disease", rx: "prescription_only", variants: [["90s", 3250]] },
    ],
  },
];
