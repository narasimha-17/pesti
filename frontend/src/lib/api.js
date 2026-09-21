import { products, categories, crops, brands, pests, articles, testimonials } from '../data/mock'

// Mock API. Each function maps 1:1 to a planned FastAPI endpoint, so swapping is a fetch() away.
const wait = (v, ms = 250) => new Promise((r) => setTimeout(() => r(v), ms))

export const disc = (v) => Math.round(((v.mrp - v.price) / v.mrp) * 100)
export const minVariant = (p) => p.variants.reduce((a, b) => (a.price <= b.price ? a : b))
export const inr = (n) => '₹' + Math.round(n).toLocaleString('en-IN')

function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}
// Typo-tolerant match: substring, or any word within edit distance 1-2.
export function fuzzy(text, q) {
  text = text.toLowerCase(); q = q.toLowerCase().trim()
  if (!q) return true
  if (text.includes(q)) return true
  const tol = q.length > 5 ? 2 : q.length > 3 ? 1 : 0
  if (!tol) return false
  return text.split(/[^a-z0-9]+/).some((w) => w.length > 2 && (editDistance(w.slice(0, q.length + 1), q) <= tol || editDistance(w, q) <= tol))
}
const haystack = (p) => `${p.name} ${p.brand} ${p.activeIngredient} ${p.category} ${p.crops.join(' ')}`

// Prefer the backend; fall back to bundled sample data if the API is unreachable.
const remote = (path, fallback) => call(path).catch(() => (typeof fallback === 'function' ? fallback() : wait(fallback, 100)))

export const api = {
  categories: () => remote('/catalog/categories', categories),
  crops: () => remote('/catalog/crops', crops),
  brands: () => remote('/catalog/brands', brands),
  articles: () => remote('/catalog/articles', articles),
  testimonials: () => remote('/catalog/testimonials', testimonials),
  orders: () => call('/orders'),
  products(f = {}) {
    const qs = new URLSearchParams()
    for (const [k, v] of Object.entries({ category: f.category, crop: f.crop, brands: f.brands?.join(','), q: f.q, min: f.min, max: f.max, rating: f.rating, in_stock: f.inStock || '', flag: f.flag, sort: f.sort })) if (v) qs.set(k, v)
    return remote(`/catalog/products/search?${qs}`, () => this.localProducts(f))
  },
  localProducts(f = {}) {
    let list = products.filter((p) => {
      if (f.category && p.category !== f.category) return false
      if (f.crop && !p.crops.includes(f.crop)) return false
      if (f.brands?.length && !f.brands.includes(p.brand)) return false
      if (f.q && !fuzzy(haystack(p), f.q)) return false
      const price = minVariant(p).price
      if (f.min && price < f.min) return false
      if (f.max && price > f.max) return false
      if (f.rating && p.rating < f.rating) return false
      if (f.inStock && !p.variants.some((v) => v.stock > 0)) return false
      if (f.flag === 'featured' && !p.featured) return false
      if (f.flag === 'new' && !p.isNew) return false
      return true
    })
    const key = { price_asc: (p) => minVariant(p).price, price_desc: (p) => -minVariant(p).price, rating: (p) => -p.rating, popular: (p) => -p.sold, discount: (p) => -disc(minVariant(p)) }[f.sort]
    if (key) list = [...list].sort((a, b) => key(a) - key(b))
    else if (f.flag === 'best') list = [...list].sort((a, b) => b.sold - a.sold)
    return wait(list)
  },
  product: (slug) => call(`/catalog/products/${slug}`).catch(() => products.find((p) => p.slug === slug) || null),
  related(p) { return wait(products.filter((x) => x.id !== p.id && (x.category === p.category || x.crops.some((c) => p.crops.includes(c)))).slice(0, 4), 100) },
  suggest(q) {
    q = q.trim()
    if (!q) return { products: [], categories: [], crops: [], brands: [] }
    return {
      products: products.filter((p) => fuzzy(haystack(p), q)).slice(0, 5),
      categories: categories.filter((c) => fuzzy(c.name, q)).slice(0, 3),
      crops: crops.filter((c) => fuzzy(c.name, q)).slice(0, 3),
      brands: brands.filter((b) => fuzzy(b, q)).slice(0, 3),
    }
  },
  // Crop Health Assistant: educational info + candidate products. Not a prescription.
  cropHealth({ crop, problem }) {
    const pest = pests.find((x) => x.id === problem)
    const matches = products.filter((p) => p.crops.includes(crop) && p.pests.includes(problem))
    return wait({ pest, products: matches })
  },
  // Pincode serviceability – warehouse rules would be admin-configured.
  pincode(pin) {
    if (!/^[1-9]\d{5}$/.test(pin)) return wait({ ok: false, msg: 'Enter a valid 6-digit pincode' }, 100)
    const days = 2 + (Number(pin[0]) % 4)
    const d = new Date(Date.now() + days * 864e5)
    return wait({ ok: true, days, date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }, 300)
  },
}

// Real backend (FastAPI). JSON in/out; throws Error(detail) so forms can show the message.
export async function call(path, body, method) {
  const token = localStorage.getItem('agm_token')
  let r
  try {
    r = await fetch(`${import.meta.env.VITE_API_URL || ''}/api${path}`, { method: method || (body ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined })
  } catch { throw new Error('Cannot reach the server. Is the backend running on port 8000?') }
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(typeof data.detail === 'string' ? data.detail : data.detail?.[0]?.msg || 'Something went wrong')
  return data
}
