// Full-page translation via Google's free website-translation widget. Unlike our small hand-written
// dictionary in i18n.js (a few nav labels only), this translates every visible text node on the page —
// including product names/descriptions that come from the backend/mock data — with no API key needed.
const GOOGLE_CODE = { en: 'en', hi: 'hi', te: 'te', ta: 'ta', kn: 'kn' }

export function initGoogleTranslate() {
  if (window.__gtInit) return
  window.__gtInit = true
  window.googleTranslateElementInit = () => {
    // eslint-disable-next-line no-new
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', includedLanguages: Object.values(GOOGLE_CODE).join(','), autoDisplay: false },
      'google_translate_element',
    )
  }
  const s = document.createElement('script')
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  s.async = true
  document.body.appendChild(s)
}

function setCookie(value) {
  const host = window.location.hostname
  const expire = value ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 UTC'
  document.cookie = `googtrans=${value}${expire}; path=/`
  if (host !== 'localhost') document.cookie = `googtrans=${value}${expire}; path=/; domain=${host}`
}

// Switches the live translation and reloads — the widget reads the googtrans cookie on load to decide
// what to translate to, and a reload is the most reliable way to apply it across the whole DOM.
export function setGoogleLang(code) {
  const target = GOOGLE_CODE[code] || 'en'
  setCookie(target === 'en' ? '' : `/en/${target}`)
  window.location.reload()
}
