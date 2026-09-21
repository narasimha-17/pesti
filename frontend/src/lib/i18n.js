// Language architecture: add a new locale by adding a dictionary here (or lazy-load JSON per locale).
export const languages = { en: 'English', hi: 'हिन्दी', te: 'తెలుగు', ta: 'தமிழ்', kn: 'ಕನ್ನಡ' }

const dict = {
  en: {
    'nav.shopByCrop': 'Shop by Crop', 'nav.assistant': 'Crop Health', 'nav.learn': 'Learn', 'nav.offers': 'Offers',
    'search.placeholder': 'Search products, crops, brands…', 'cart': 'Cart', 'wishlist': 'Wishlist', 'login': 'Login', 'account': 'Account',
    'add': 'Add to cart', 'shopNow': 'Shop now',
  },
  hi: {
    'nav.shopByCrop': 'फसल के अनुसार', 'nav.assistant': 'फसल स्वास्थ्य', 'nav.learn': 'सीखें', 'nav.offers': 'ऑफ़र',
    'search.placeholder': 'उत्पाद, फसल, ब्रांड खोजें…', 'cart': 'कार्ट', 'wishlist': 'पसंदीदा', 'login': 'लॉगिन', 'account': 'खाता',
    'add': 'कार्ट में जोड़ें', 'shopNow': 'अभी खरीदें',
  },
  te: {
    'nav.shopByCrop': 'పంట ప్రకారం', 'nav.assistant': 'పంట ఆరోగ్యం', 'nav.learn': 'నేర్చుకోండి', 'nav.offers': 'ఆఫర్లు',
    'search.placeholder': 'ఉత్పత్తులు, పంటలు, బ్రాండ్లు వెతకండి…', 'cart': 'కార్ట్', 'wishlist': 'ఇష్టమైనవి', 'login': 'లాగిన్', 'account': 'ఖాతా',
    'add': 'కార్ట్‌కు జోడించండి', 'shopNow': 'ఇప్పుడే కొనండి',
  },
}
// Missing keys fall back to English, so partially translated locales (ta, kn) still work.
export const translate = (lang, key) => dict[lang]?.[key] ?? dict.en[key] ?? key
