import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store'
import { coupons } from '../data/mock'
import { inr } from '../lib/api'
import { Empty } from '../components/ui'
import Icon, { ProductArt } from '../components/Icon'

export function Summary({ children }) {
  const { subtotal, discount, shipping, tax, total, coupon } = useApp()
  return (
    <aside className="summary">
      <h3>Order summary</h3>
      <div className="row"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
      {discount > 0 && <div className="row" style={{ color: 'var(--lime)' }}><span>Coupon ({coupon})</span><span>−{inr(discount)}</span></div>}
      <div className="row"><span>Shipping</span><span>{shipping ? inr(shipping) : 'FREE'}</span></div>
      <div className="row muted"><span>Incl. GST (18%)</span><span>{inr(tax)}</span></div>
      <div className="row total"><span>Total</span><span>{inr(total)}</span></div>
      {children}
    </aside>
  )
}

export default function Cart() {
  const { cart, setQty, coupon, setCoupon, subtotal, toast } = useApp()
  const [code, setCode] = useState('')
  const apply = () => {
    const c = code.trim().toUpperCase(), cp = coupons[c]
    if (!cp) return toast('Invalid coupon code')
    if (subtotal < cp.min) return toast(`Add items worth ${inr(cp.min)} to use ${c}`)
    setCoupon(c); return toast(`Coupon ${c} applied`)
  }
  if (!cart.length) return <div className="container"><Empty icon="cart" title="Your cart is empty"><Link className="btn" style={{ marginTop: 16 }} to="/products">Start shopping</Link></Empty></div>
  return (
    <div className="container">
      <h1 style={{ paddingTop: 28, margin: 0 }}>Shopping cart</h1>
      <div className="cart">
        <div className="card pad">
          {cart.map((l) => (
            <div className="line" key={l.variant.id}>
              <Link to={`/product/${l.product.slug}`} className="pimg"><ProductArt p={l.product} /></Link>
              <div style={{ flex: 1, minWidth: 160 }}>
                <Link to={`/product/${l.product.slug}`}><b>{l.product.name}</b></Link>
                <div className="muted" style={{ fontSize: '.85rem' }}>{l.product.brand} · {l.variant.pack}</div>
                <div className="price" style={{ fontSize: '1.1rem' }}>{inr(l.variant.price)}</div>
              </div>
              <div className="qty"><button onClick={() => setQty(l.variant.id, l.qty - 1)} aria-label="Decrease"><Icon name="minus" size={16} /></button><span>{l.qty}</span><button onClick={() => setQty(l.variant.id, l.qty + 1)} aria-label="Increase"><Icon name="plus" size={16} /></button></div>
              <button className="btn ghost sm" onClick={() => setQty(l.variant.id, 0)} aria-label={`Remove ${l.product.name}`}><Icon name="trash" size={16} /></button>
            </div>
          ))}
        </div>
        <Summary>
          <div style={{ display: 'flex', gap: 8, margin: '18px 0' }}>
            <input className="select-mini" style={{ flex: 1, height: 46, borderRadius: 12, padding: '0 14px' }} placeholder="Coupon (try KISAN10)" value={code} onChange={(e) => setCode(e.target.value)} aria-label="Coupon code" />
            <button className="btn lime sm" style={{ minHeight: 46 }} onClick={apply}>Apply</button>
          </div>
          {coupon && <button className="btn light sm" onClick={() => setCoupon(null)}>Remove {coupon}</button>}
          <Link to="/checkout" className="btn lime block" style={{ marginTop: 14 }}>Proceed to checkout <Icon name="arrow" size={18} /></Link>
        </Summary>
      </div>
    </div>
  )
}
