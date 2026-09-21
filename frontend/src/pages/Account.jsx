import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, call, inr } from '../lib/api'
import { products } from '../data/mock'
import { useApp } from '../lib/store'
import { languages } from '../lib/i18n'
import { Avatar, Empty, Field, ProductCard } from '../components/ui'
import Icon from '../components/Icon'

const STATUS = { delivered: 'badge', shipped: 'badge warn', placed: 'badge warn' }
const NOTIFY = [['orders', 'Order updates', 'Shipping and delivery alerts'], ['offers', 'Offers and deals', 'Seasonal discounts and coupons'], ['advice', 'Crop advice', 'Seasonal tips for your crops']]
const DEFAULT_PREFS = { orders: true, offers: true, advice: false }

function Toggle({ on, onChange, label }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`sw ${on ? 'on' : ''}`} onClick={() => onChange(!on)}><i /></button>
}

function Settings() {
  const { user, login, toast, lang, setLang } = useApp()
  const [p, setP] = useState({ name: user.name, phone: user.phone || '' })
  const [pw, setPw] = useState({ current: '', next: '', again: '' })
  const [err, setErr] = useState({})
  const [prefs, setPrefs] = useState(() => { try { return JSON.parse(localStorage.getItem('agm_notify')) || DEFAULT_PREFS } catch { return DEFAULT_PREFS } })
  const setPref = (k, v) => {
    const n = { ...prefs, [k]: v }
    setPrefs(n)
    try { localStorage.setItem('agm_notify', JSON.stringify(n)) } catch { /* storage unavailable */ }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try { login(await call('/auth/profile', { name: p.name, phone: p.phone || null }, 'PATCH')); setErr({}); toast('Profile updated') } catch (x) { setErr({ profile: x.message }) }
  }
  const savePassword = async (e) => {
    e.preventDefault()
    if (pw.next.length < 8) return setErr({ pw: 'Use at least 8 characters' })
    if (pw.next !== pw.again) return setErr({ pw: 'Passwords do not match' })
    try { await call('/auth/password', { current_password: pw.current, new_password: pw.next }); setPw({ current: '', next: '', again: '' }); setErr({}); toast('Password changed') } catch (x) { setErr({ pw: x.message }) }
  }
  const setProfile = (k) => (e) => setP({ ...p, [k]: e.target.value })
  const setPass = (k) => (e) => setPw({ ...pw, [k]: e.target.value })

  return (
    <div className="set-grid">
      <form className="card pad set-card" onSubmit={saveProfile}>
        <h3><Icon name="user" size={18} /> Profile</h3>
        <Field label="Full name"><input value={p.name} onChange={setProfile('name')} autoComplete="name" /></Field>
        <Field label="Email"><input value={user.email} disabled /></Field>
        <Field label="Mobile number"><input value={p.phone} onChange={setProfile('phone')} inputMode="numeric" maxLength={10} placeholder="10-digit number" autoComplete="tel" /></Field>
        {err.profile && <p className="err" role="alert">{err.profile}</p>}
        <button className="btn sm">Save changes</button>
      </form>

      <form className="card pad set-card" onSubmit={savePassword}>
        <h3><Icon name="lock" size={18} /> Password</h3>
        <Field label="Current password"><input type="password" value={pw.current} onChange={setPass('current')} autoComplete="current-password" /></Field>
        <Field label="New password"><input type="password" value={pw.next} onChange={setPass('next')} autoComplete="new-password" /></Field>
        <Field label="Confirm new password"><input type="password" value={pw.again} onChange={setPass('again')} autoComplete="new-password" /></Field>
        {err.pw && <p className="err" role="alert">{err.pw}</p>}
        <button className="btn sm">Change password</button>
      </form>

      <div className="card pad set-card">
        <h3><Icon name="book" size={18} /> Language</h3>
        <p className="muted" style={{ margin: 0 }}>Choose the language used across the store.</p>
        <div className="chips">{Object.entries(languages).map(([k, v]) => <button type="button" key={k} className={`chip ${lang === k ? 'on' : ''}`} aria-pressed={lang === k} onClick={() => setLang(k)}>{v}</button>)}</div>
      </div>

      <div className="card pad set-card">
        <h3><Icon name="bell" size={18} /> Notifications</h3>
        {NOTIFY.map(([k, t, d]) => <div className="pref" key={k}><div><b>{t}</b><small>{d}</small></div><Toggle on={!!prefs[k]} onChange={(v) => setPref(k, v)} label={t} /></div>)}
      </div>
    </div>
  )
}

export default function Account() {
  const { user, logout, wish, cartCount, toast } = useApp()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'orders'
  const { data: orders = [] } = useQuery({ queryKey: ['orders'], queryFn: api.orders })
  if (!user) return <div className="container"><Empty icon="lock" title="Please log in"><Link className="btn" style={{ marginTop: 16 }} to="/login">Login</Link></Empty></div>
  const placed = sp.get('placed')
  const tabs = [['orders', 'Orders', 'box'], ['wishlist', 'Wishlist', 'heart'], ['addresses', 'Addresses', 'pin'], ['notifications', 'Notifications', 'bell'], ['settings', 'Settings', 'user']]
  const spent = orders.reduce((s, o) => s + o.total, 0)
  const addresses = [...new Map(orders.filter((o) => o.address?.line1 || o.address?.district).map((o) => [JSON.stringify(o.address), o.address])).values()]
  return (
    <div className="container acct">
      <header className="acct-hero">
        <Avatar name={user.name} className="av-l" />
        <div className="acct-id"><h1>{user.name}</h1><span>{user.email}</span>{user.role === 'admin' && <em>Admin</em>}</div>
        <div className="acct-stats">
          <div><b>{orders.length}</b><span>Orders</span></div>
          <div><b>{inr(spent)}</b><span>Spent</span></div>
          <div><b>{wish.length}</b><span>Saved</span></div>
          <div><b>{cartCount}</b><span>In cart</span></div>
        </div>
      </header>

      <div className="acct-body">
        <nav className="card pad acct-nav" aria-label="Account">
          {tabs.map(([k, l, ic]) => <a href="#main" key={k} className={tab === k ? 'on' : ''} onClick={(e) => { e.preventDefault(); setSp({ tab: k }) }}><Icon name={ic} size={18} />{l}</a>)}
          {user.role === 'admin' && <Link to="/admin"><Icon name="shield" size={18} />Admin panel</Link>}
          <button className="btn ghost sm block" style={{ marginTop: 12 }} onClick={logout}>Logout</button>
        </nav>
        <section className="acct-main">
          {placed && <div className="notice info" style={{ marginBottom: 16 }}><Icon name="check" size={20} /><div>Order <b>{placed}</b> placed. We will confirm shortly by SMS/WhatsApp.</div></div>}
          {tab === 'orders' && (orders.length ? (
            <div className="ord-list">{orders.map((o) => (
              <article className="card pad ord" key={o.number}>
                <div className="ord-top"><div><b>{o.number}</b><small>{o.date}</small></div><span className={STATUS[o.status]}>{o.status}</span><strong>{inr(o.total)}</strong></div>
                <ul>{(o.items || []).map((it, n) => <li key={n}><span>{it.name} <small>· {it.pack}</small></span><span>× {it.qty}</span></li>)}</ul>
                <div className="ord-act"><button className="btn ghost sm" onClick={() => toast('Invoice download (PDF) coming soon')}><Icon name="receipt" size={15} /> Invoice</button><button className="btn ghost sm" onClick={() => toast('Reorder coming soon')}>Reorder</button></div>
              </article>
            ))}</div>
          ) : <Empty icon="box" title="No orders yet"><Link className="btn" style={{ marginTop: 16 }} to="/products">Start shopping</Link></Empty>)}
          {tab === 'wishlist' && (wish.length ? <div className="grid g-prod">{products.filter((p) => wish.includes(p.id)).map((p) => <ProductCard key={p.id} p={p} />)}</div> : <Empty icon="heart" title="No saved products yet"><Link to="/products">Browse products</Link></Empty>)}
          {tab === 'addresses' && (addresses.length
            ? <div className="addr-grid">{addresses.map((a, n) => <div className="card pad addr" key={n}><Icon name="pin" size={20} /><b>{a.name || user.name}</b><p>{[a.line1, a.village, a.district, a.state].filter(Boolean).join(', ')}</p><small>PIN {a.pincode}{a.phone ? ` · ${a.phone}` : ''}</small></div>)}</div>
            : <Empty icon="pin" title="No saved addresses"><span className="muted">Addresses from your orders appear here.</span></Empty>)}
          {tab === 'notifications' && <div className="card pad"><h3>Notifications</h3><p style={{ display: 'flex', gap: 10 }}><Icon name="truck" size={18} /> Your latest order has shipped.</p><p style={{ display: 'flex', gap: 10 }}><Icon name="tag" size={18} /> Kharif offers are live, up to 25% off.</p></div>}
          {tab === 'settings' && <Settings />}
        </section>
      </div>
    </div>
  )
}
