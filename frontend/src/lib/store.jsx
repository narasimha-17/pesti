import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { translate } from './i18n'
import { coupons } from '../data/mock'
import Icon from '../components/Icon'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(v)) } catch { /* private mode */ } }, [key, v])
  return [v, setV]
}

export function AppProvider({ children }) {
  const [user, setUser] = usePersisted('agm_user', null)
  const [cart, setCart] = usePersisted('agm_cart', []) // [{variantId, product, variant, qty}]
  const [wish, setWish] = usePersisted('agm_wish', []) // product ids
  const [lang, setLang] = usePersisted('agm_lang', 'en')
  const [pincode, setPincode] = usePersisted('agm_pin', '')
  const [recent, setRecent] = usePersisted('agm_recent', [])
  const [coupon, setCoupon] = useState(null)
  const [toasts, setToasts] = useState([])

  const toast = useCallback((msg) => {
    const id = Math.random()
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
  }, [])

  const addToCart = (product, variant, qty = 1) => {
    if (!user) return toast('Please log in to add items to your cart')
    setCart((c) => {
      const i = c.findIndex((l) => l.variant.id === variant.id)
      if (i >= 0) return c.map((l, j) => (j === i ? { ...l, qty: Math.min(l.qty + qty, variant.stock) } : l))
      return [...c, { product: { id: product.id, slug: product.slug, name: product.name, brand: product.brand, category: product.category, formulation: product.formulation, regulated: product.regulated }, variant, qty }]
    })
    toast(`Added ${product.name} (${variant.pack}) to cart`)
  }
  const setQty = (vid, qty) => setCart((c) => (qty <= 0 ? c.filter((l) => l.variant.id !== vid) : c.map((l) => (l.variant.id === vid ? { ...l, qty: Math.min(qty, l.variant.stock) } : l))))
  const toggleWish = (id) => { setWish((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id])); }
  const addRecent = (q) => q && setRecent((r) => [q, ...r.filter((x) => x !== q)].slice(0, 5))

  const subtotal = cart.reduce((s, l) => s + l.variant.price * l.qty, 0)
  const cpn = coupon && coupons[coupon]
  const discount = cpn && subtotal >= cpn.min ? Math.min(cpn.percent ? (subtotal * cpn.percent) / 100 : cpn.flat, cpn.max ?? Infinity) : 0
  const shipping = subtotal === 0 || subtotal >= 999 ? 0 : 60
  const tax = Math.round(((subtotal - discount) * 0.18) / 1.18) // prices are tax-inclusive; shown for invoice
  const total = subtotal - discount + shipping

  const value = {
    user, login: setUser, logout: () => { localStorage.removeItem('agm_token'); localStorage.removeItem('agm_refresh'); setUser(null) }, cart, addToCart, setQty, clearCart: () => setCart([]),
    wish, toggleWish, lang, setLang, t: (k) => translate(lang, k), pincode, setPincode, recent, addRecent,
    coupon, setCoupon, discount, subtotal, shipping, tax, total, toast, cartCount: cart.reduce((s, l) => s + l.qty, 0),
  }
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">{toasts.map((t) => <div key={t.id} className="toast"><Icon name="check" size={18} />{t.msg}</div>)}</div>
    </Ctx.Provider>
  )
}
