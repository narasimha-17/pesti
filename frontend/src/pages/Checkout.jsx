import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { complianceConfig } from '../data/mock'
import { Empty, Field } from '../components/ui'
import Icon from '../components/Icon'
import { Summary } from './Cart'
import { api, call } from '../lib/api'

const PAYMENTS = [['upi', 'UPI'], ['card', 'Credit / Debit card'], ['netbanking', 'Net banking'], ['wallet', 'Wallets'], ['cod', 'Cash on delivery']]
const Step = ({ n, title }) => <div className="step-h"><i>{n}</i><h3>{title}</h3></div>

export default function Checkout() {
  const { cart, user, clearCart, toast, pincode, subtotal, total } = useApp()
  const nav = useNavigate()
  const [a, setA] = useState({ name: user?.name || '', phone: '', line1: '', village: '', district: '', state: '', pincode })
  const [err, setErr] = useState({})
  const [pay, setPay] = useState('upi')
  const [acks, setAcks] = useState([])
  const [busy, setBusy] = useState(false)
  const [placed, setPlaced] = useState(null)
  const regulated = cart.filter((l) => l.product.regulated)

  if (placed) return <div className="container"><Empty icon="cart" title="Order placed!"><p className="muted">Your order number is <b>{placed}</b>. We'll confirm delivery details on {a.phone}.</p><Link className="btn" style={{ marginTop: 16 }} to="/products">Continue shopping</Link></Empty></div>
  if (!cart.length) return <div className="container"><Empty icon="cart" title="Nothing to check out"><Link to="/products">Continue shopping</Link></Empty></div>

  const set = (k) => (e) => setA({ ...a, [k]: e.target.value })
  const validate = async () => {
    const e = {}
    if (a.name.trim().length < 2) e.name = 'Enter full name'
    if (!/^[6-9]\d{9}$/.test(a.phone)) e.phone = 'Enter a valid 10-digit mobile number'
    if (!a.line1.trim()) e.line1 = 'Address is required'
    if (!a.district.trim()) e.district = 'Required'
    if (!a.state.trim()) e.state = 'Required'
    const r = await api.pincode(a.pincode)
    if (!r.ok) e.pincode = r.msg
    if (regulated.length && acks.length < complianceConfig.confirmations.length) e.acks = 'Please accept all confirmations to buy regulated products'
    if (complianceConfig.restrictedStates.includes(a.state)) e.state = 'Some items cannot be delivered to this state'
    return e
  }
  const place = async (ev) => {
    ev.preventDefault(); setBusy(true)
    const e = await validate(); setErr(e)
    if (Object.keys(e).length) { setBusy(false); return }
    let num
    try {
      const o = await call('/orders', { items: cart.map((l) => ({ name: l.product.name, pack: l.variant.pack, qty: l.qty, price: l.variant.price })), address: a, total: Math.round(total) })
      num = o.number
    } catch (x) { toast(x.message); setBusy(false); return }
    clearCart(); toast('Order placed!')
    if (user) nav(`/account?tab=orders&placed=${num}`); else setPlaced(num)
  }

  return (
    <div className="container">
      <h1 style={{ paddingTop: 28, margin: 0 }}>Checkout</h1>
      <form className="cart" onSubmit={place} noValidate>
        <div className="form">
          <section className="card pad form">
            <Step n="1" title="Delivery address" />
            <div className="two"><Field label="Full name" error={err.name}><input value={a.name} onChange={set('name')} autoComplete="name" /></Field><Field label="Mobile" error={err.phone}><input value={a.phone} onChange={set('phone')} inputMode="numeric" maxLength={10} autoComplete="tel" /></Field></div>
            <Field label="House / street" error={err.line1}><input value={a.line1} onChange={set('line1')} /></Field>
            <div className="two"><Field label="Village / town"><input value={a.village} onChange={set('village')} /></Field><Field label="District" error={err.district}><input value={a.district} onChange={set('district')} /></Field></div>
            <div className="two"><Field label="State" error={err.state}><input value={a.state} onChange={set('state')} /></Field><Field label="Pincode" error={err.pincode}><input value={a.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} /></Field></div>
          </section>

          <section className="card pad">
            <Step n="2" title="Delivery method" />
            <label style={{ display: 'flex', gap: 10, alignItems: 'center' }}><input type="radio" defaultChecked style={{ accentColor: 'var(--forest)' }} /><Icon name="truck" size={18} /> Standard delivery (2–5 days) · {subtotal >= 999 ? 'FREE' : '₹60'}</label>
          </section>

          {regulated.length > 0 && (
            <section className="card pad">
              <Step n="3" title="Regulated product confirmations" />
              <div className="notice" style={{ marginBottom: 12 }}><Icon name="shield" size={20} /><div>Your cart has crop-protection products: {regulated.map((l) => l.product.name).join(', ')}. Eligibility, licences and location rules are verified by our compliance team before dispatch; orders may be held or cancelled with a full refund if checks fail.</div></div>
              {complianceConfig.confirmations.map((c) => (
                <label key={c} style={{ display: 'flex', gap: 10, padding: '7px 0', cursor: 'pointer' }}>
                  <input type="checkbox" checked={acks.includes(c)} onChange={(e) => setAcks(e.target.checked ? [...acks, c] : acks.filter((x) => x !== c))} style={{ width: 20, height: 20, accentColor: 'var(--forest)', flex: 'none' }} /> {c}
                </label>
              ))}
              {err.acks && <div className="err" role="alert">{err.acks}</div>}
            </section>
          )}

          <section className="card pad">
            <Step n={regulated.length ? '4' : '3'} title="Payment" />
            <div className="chips">{PAYMENTS.map(([k, l]) => <button type="button" key={k} className={`chip ${pay === k ? 'on' : ''}`} onClick={() => setPay(k)} aria-pressed={pay === k}>{l}</button>)}</div>
            {pay === 'cod' && <p className="muted">COD availability depends on pincode, order value and product eligibility, confirmed at dispatch.</p>}
            <p className="muted" style={{ fontSize: '.85rem' }}>Payments go through a gateway (Razorpay / Cashfree ready). This demo does not charge anything.</p>
          </section>
        </div>
        <Summary><button className="btn lime block" style={{ marginTop: 18 }} disabled={busy}>{busy ? 'Placing order…' : 'Place order'}</button></Summary>
      </form>
    </div>
  )
}
