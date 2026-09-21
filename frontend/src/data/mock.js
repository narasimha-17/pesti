// Demo data. api.js reads from here; swap for FastAPI endpoints later (shapes mirror planned schemas).
export const categories = [
  ['insecticides', 'Insecticides', 'bug'], ['fungicides', 'Fungicides', 'mushroom'], ['herbicides', 'Herbicides', 'weed'], ['fertilizers', 'Fertilizers', 'flask'],
  ['bio-pesticides', 'Bio-Pesticides', 'leaf'], ['growth-promoters', 'Plant Growth Promoters', 'sprout'], ['micronutrients', 'Micronutrients', 'atom'], ['seeds', 'Seeds', 'seed'],
  ['crop-protection', 'Crop Protection', 'shield'], ['farm-equipment', 'Farm Equipment', 'tractor'], ['sprayers', 'Sprayers', 'spray'], ['accessories', 'Accessories', 'glove'],
].map(([slug, name, icon]) => ({ slug, name, icon, regulated: ['insecticides', 'fungicides', 'herbicides', 'crop-protection'].includes(slug) }))

export const crops = [
  ['paddy', 'Paddy', 'paddy', 'Kharif'], ['cotton', 'Cotton', 'cotton', 'Kharif'], ['chilli', 'Chilli', 'chilli', 'Kharif/Rabi'], ['tomato', 'Tomato', 'tomato', 'All season'],
  ['maize', 'Maize', 'maize', 'Kharif'], ['groundnut', 'Groundnut', 'groundnut', 'Kharif'], ['soybean', 'Soybean', 'soybean', 'Kharif'], ['sugarcane', 'Sugarcane', 'sugarcane', 'Annual'],
  ['vegetables', 'Vegetables', 'vegetables', 'All season'], ['fruits', 'Fruits', 'fruits', 'Perennial'], ['other', 'Other Crops', 'other', '—'],
].map(([slug, name, icon, season]) => ({ slug, name, icon, season }))

export const brands = ['Bayer', 'Syngenta', 'UPL', 'Dhanuka', 'Coromandel', 'IFFCO', 'Katyayani', 'Tata Rallis', 'Neptune', 'Kisan Kraft']

const allCrops = crops.map((c) => c.slug)
export const pests = [
  { id: 'stem-borer', name: 'Stem borer', kind: 'pest', crops: ['paddy', 'maize', 'sugarcane'], symptoms: 'Dead hearts in young plants, white ears at flowering.' },
  { id: 'bph', name: 'Brown plant hopper', kind: 'pest', crops: ['paddy'], symptoms: 'Circular yellow-brown patches ("hopper burn").' },
  { id: 'whitefly', name: 'Whitefly', kind: 'pest', crops: ['cotton', 'tomato', 'chilli', 'vegetables'], symptoms: 'Yellowing, sticky honeydew, leaf curl virus spread.' },
  { id: 'bollworm', name: 'Bollworm', kind: 'pest', crops: ['cotton', 'tomato', 'chilli'], symptoms: 'Bore holes in bolls/fruits, frass, damaged squares.' },
  { id: 'blast', name: 'Blast', kind: 'disease', crops: ['paddy'], symptoms: 'Spindle-shaped grey spots with brown margins on leaves.' },
  { id: 'blight', name: 'Early / late blight', kind: 'disease', crops: ['tomato', 'chilli', 'vegetables'], symptoms: 'Concentric-ring brown spots, water-soaked patches.' },
  { id: 'powdery', name: 'Powdery mildew', kind: 'disease', crops: ['vegetables', 'fruits', 'chilli'], symptoms: 'White powdery coating on leaves.' },
  { id: 'weeds', name: 'Broadleaf & grass weeds', kind: 'weed', crops: ['paddy', 'maize', 'soybean', 'groundnut', 'sugarcane', 'cotton'], symptoms: 'Competition for light, water and nutrients.' },
  { id: 'nutrient', name: 'Nutrient deficiency / weak growth', kind: 'deficiency', crops: allCrops, symptoms: 'Yellowing, stunting, poor flowering and fruit set.' },
]
export const stages = ['Nursery / germination', 'Vegetative', 'Flowering', 'Fruiting / grain filling', 'Harvest / post-harvest']

const REG = ['insecticides', 'fungicides', 'herbicides', 'crop-protection']
const P = (id, name, category, brand, productType, formulation, activeIngredient, cropList, pestList, packs, x = {}) => ({
  id, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, ''), name, category, brand, productType, formulation, activeIngredient,
  crops: cropList, pests: pestList,
  rating: +(3.9 + ((id * 37) % 11) / 10).toFixed(1), reviews: 12 + ((id * 53) % 240),
  variants: packs.map(([pack, price, mrp, stock], i) => ({ id: id * 10 + i, sku: `AGM-${String(id).padStart(4, '0')}-${i + 1}`, pack, price, mrp, stock })),
  description: `${name} by ${brand} – a trusted ${productType.toLowerCase()} option for reliable field performance. Always read the label and follow local agriculture-department recommendations.`,
  dosage: 'Refer to the product label. Do not exceed the label dose. Dose per litre of water / per acre is printed on the pack.',
  application: 'Mix in clean water, spray in the morning or evening in calm weather with a calibrated sprayer.',
  precautions: 'Wear gloves, mask and full-sleeve clothing. Do not eat, drink or smoke while spraying. Keep away from children, food and water sources. Wash hands after use.',
  storage: 'Store in the original container in a cool, dry, locked place away from food and feed.',
  manufacturer: `${brand} Crop Sciences Pvt. Ltd. (demo)`, licence: x.licence || null,
  regulated: REG.includes(category), featured: !!x.featured, isNew: !!x.isNew, sold: x.sold || (id * 131) % 900,
  faqs: [['Is it safe for all crops?', 'Use only on crops listed on the product label.'], ['When should I spray?', 'Early morning or late evening, avoiding rain and strong wind.']],
})
const L = 'CIB&RC reg. (demo)'

export const products = [
  P(1, 'Coragen Insecticide', 'insecticides', 'Bayer', 'Systemic', 'SC', 'Chlorantraniliprole 18.5% SC', ['paddy', 'cotton', 'tomato', 'chilli'], ['stem-borer', 'bollworm'], [['60 ml', 890, 980, 40], ['150 ml', 2150, 2400, 22]], { featured: 1, licence: L, sold: 820 }),
  P(2, 'Confidor Super', 'insecticides', 'Bayer', 'Systemic', 'SL', 'Imidacloprid 17.8% SL', ['cotton', 'chilli', 'tomato', 'vegetables'], ['whitefly'], [['100 ml', 320, 360, 120], ['250 ml', 760, 850, 60]], { featured: 1, licence: L }),
  P(3, 'Amistar Top', 'fungicides', 'Syngenta', 'Systemic', 'SC', 'Azoxystrobin 18.2% + Difenoconazole 11.4%', ['paddy', 'tomato', 'chilli', 'vegetables'], ['blast', 'blight', 'powdery'], [['60 ml', 780, 850, 55], ['200 ml', 2450, 2700, 18]], { featured: 1, licence: L }),
  P(4, 'Nativo Fungicide', 'fungicides', 'Bayer', 'Systemic', 'WG', 'Tebuconazole 50% + Trifloxystrobin 25%', ['paddy', 'groundnut', 'soybean'], ['blast'], [['100 g', 720, 800, 30], ['300 g', 2000, 2200, 12]], { isNew: 1, licence: L }),
  P(5, 'Glyphosate Herbicide', 'herbicides', 'UPL', 'Non-selective', 'SL', 'Glyphosate 41% SL', ['sugarcane', 'other'], ['weeds'], [['1 L', 540, 620, 70], ['5 L', 2500, 2900, 25]], { licence: L }),
  P(6, 'Sempra Herbicide', 'herbicides', 'Dhanuka', 'Selective', 'WG', 'Halosulfuron-methyl 75% WG', ['sugarcane', 'maize'], ['weeds'], [['36 g', 480, 540, 44]], { licence: L }),
  P(7, 'DAP 18:46:0', 'fertilizers', 'IFFCO', 'Basal', 'Granular', 'Diammonium phosphate', ['paddy', 'cotton', 'maize', 'groundnut', 'soybean', 'sugarcane', 'vegetables', 'fruits'], ['nutrient'], [['50 kg', 1350, 1350, 300]], { featured: 1, sold: 880 }),
  P(8, 'NPK 19:19:19 Water Soluble', 'fertilizers', 'Coromandel', 'Foliar / fertigation', 'Powder', 'Balanced NPK', ['tomato', 'chilli', 'vegetables', 'fruits', 'cotton'], ['nutrient'], [['1 kg', 210, 260, 90], ['5 kg', 960, 1150, 40]], { isNew: 1 }),
  P(9, 'Neem Oil 10000 PPM', 'bio-pesticides', 'Katyayani', 'Botanical', 'EC', 'Azadirachtin 1% EC', ['vegetables', 'tomato', 'chilli', 'fruits', 'cotton'], ['whitefly'], [['250 ml', 260, 320, 80], ['1 L', 890, 1050, 35]], { featured: 1, isNew: 1 }),
  P(10, 'Trichoderma Viride', 'bio-pesticides', 'Neptune', 'Bio-fungicide', 'Powder', 'Trichoderma viride 1% WP', ['tomato', 'chilli', 'groundnut', 'vegetables'], ['blight'], [['1 kg', 240, 300, 65]], {}),
  P(11, 'Seaweed Growth Promoter', 'growth-promoters', 'Tata Rallis', 'Biostimulant', 'Liquid', 'Ascophyllum nodosum extract', ['tomato', 'chilli', 'paddy', 'fruits', 'vegetables'], ['nutrient'], [['500 ml', 420, 520, 48], ['1 L', 780, 950, 20]], { featured: 1 }),
  P(12, 'Zinc Sulphate 21%', 'micronutrients', 'Coromandel', 'Soil / foliar', 'Powder', 'Zinc 21% + Sulphur 10%', ['paddy', 'maize', 'cotton', 'groundnut'], ['nutrient'], [['5 kg', 420, 500, 110]], {}),
  P(13, 'Hybrid Paddy Seed', 'seeds', 'Syngenta', 'Hybrid', 'Seed', 'High-yield hybrid – 125 days', ['paddy'], [], [['1 kg', 420, 460, 90], ['5 kg', 1950, 2100, 30]], { isNew: 1, sold: 610 }),
  P(14, 'Bt Cotton Hybrid', 'seeds', 'Kisan Kraft', 'Hybrid', 'Seed', 'Bt hybrid – 450 g pack', ['cotton'], [], [['450 g', 864, 864, 150]], {}),
  P(15, 'Battery Knapsack Sprayer 16L', 'sprayers', 'Kisan Kraft', 'Battery', 'Equipment', '12V rechargeable', ['other'], [], [['16 L', 3299, 4200, 25]], { featured: 1, sold: 500 }),
  P(16, 'Hand Compression Sprayer 8L', 'sprayers', 'Kisan Kraft', 'Manual', 'Equipment', 'Manual', ['other'], [], [['8 L', 899, 1199, 60]], {}),
  P(17, 'Gloves & Mask Safety Kit', 'accessories', 'Kisan Kraft', 'Safety', 'Kit', 'PPE for spraying', ['other'], [], [['1 kit', 349, 499, 200]], { isNew: 1 }),
  P(18, 'Mini Power Tiller', 'farm-equipment', 'Kisan Kraft', 'Machine', 'Equipment', '7HP petrol', ['other'], [], [['1 unit', 38500, 44000, 6]], {}),
  P(19, 'Emamectin Benzoate 5% SG', 'crop-protection', 'Dhanuka', 'Contact + stomach', 'SG', 'Emamectin benzoate 5% SG', ['cotton', 'tomato', 'chilli', 'vegetables'], ['bollworm'], [['100 g', 560, 650, 52]], { licence: L }),
  P(20, 'Sulphur 80% WDG', 'fungicides', 'UPL', 'Contact', 'WDG', 'Sulphur 80% WDG', ['vegetables', 'fruits', 'chilli'], ['powdery'], [['1 kg', 310, 370, 70]], { licence: L }),
]

export const articles = [
  { slug: 'paddy-kharif-guide', icon: 'paddy', kind: 'Crop guide', title: 'Paddy: Kharif season calendar', summary: 'Nursery to harvest – key stages and typical input windows.' },
  { slug: 'safe-spraying', icon: 'glove', kind: 'Application guide', title: 'Safe spraying: 8 rules every farmer should follow', summary: 'PPE, timing, wind, nozzle choice and container disposal.' },
  { slug: 'whitefly-cotton', icon: 'bug', kind: 'Pest guide', title: 'Identifying whitefly in cotton and vegetables', summary: 'Symptoms, scouting thresholds and integrated management.' },
  { slug: 'soil-health', icon: 'flask', kind: 'Article', title: 'Soil health basics: get your soil tested', summary: 'Why soil testing beats guesswork on fertilizer dosage.' },
]
export const testimonials = [
  { name: 'Ramesh Reddy', place: 'Guntur, AP', crop: 'Chilli', rating: 5, product: 'Confidor Super', text: 'Delivery reached my village in 3 days and the product details were clear. Crop-wise search saved me a trip to the town shop.' },
  { name: 'Lakshmi Devi', place: 'Nizamabad, TS', crop: 'Paddy', rating: 5, product: 'Coragen Insecticide', text: 'Easy to compare pack sizes and prices. The safety tips on the page helped me spray the right way.' },
  { name: 'Mahesh Patil', place: 'Belagavi, KA', crop: 'Sugarcane', rating: 4, product: 'Sempra Herbicide', text: 'Genuine brands and proper invoices. Support answered on WhatsApp the same day when I had a question about dosage.' },
  { name: 'Suresh Naik', place: 'Yavatmal, MH', crop: 'Cotton', rating: 5, product: 'Emamectin Benzoate 5% SG', text: 'Ordered before the season started and it arrived on time. Prices were lower than the local dealer.' },
  { name: 'Anitha Kumari', place: 'Kurnool, AP', crop: 'Groundnut', rating: 4, product: 'Nativo Fungicide', text: 'The season calendar reminded me when to sow and when to protect the crop. Very useful for a first-time online buyer.' },
  { name: 'Venkat Rao', place: 'Warangal, TS', crop: 'Tomato', rating: 5, product: 'Neem Oil 10000 PPM', text: 'I like that bio-products are easy to find. The product page explained where and when to use neem oil.' },
  { name: 'Prakash Gowda', place: 'Mandya, KA', crop: 'Sugarcane', rating: 5, product: 'DAP 18:46:0', text: 'Bulk fertilizer bags were delivered to the farm gate. Paid by UPI and got the GST bill on my phone.' },
  { name: 'Kavitha S.', place: 'Salem, TN', crop: 'Maize', rating: 4, product: 'Battery Knapsack Sprayer 16L', text: 'The sprayer works well and came with clear instructions. Return policy was explained before I paid.' },
  { name: 'Ganesh Jadhav', place: 'Latur, MH', crop: 'Soybean', rating: 5, product: 'Zinc Sulphate 21%', text: 'Good quality micronutrients and quick delivery. I now reorder every season from my order history.' },
]
export const coupons = { KISAN10: { percent: 10, min: 500, max: 500 }, WELCOME100: { flat: 100, min: 999 } }
// Admin-configurable in the real system; nothing here is a legal assumption.
export const complianceConfig = {
  restrictedStates: [],
  confirmations: [
    'I am buying this product for agricultural use only.',
    'I have read the label, safety warnings and dosage instructions.',
    'I will follow the guidance of my local agriculture department / licensed dealer.',
  ],
}
