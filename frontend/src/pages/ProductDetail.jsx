import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, disc, inr } from '../lib/api'
import { crops as allCrops, pests as allPests } from '../data/mock'
import { Empty, ProductCard, SectionHead, Stars } from '../components/ui'
import Icon, { ProductArt } from '../components/Icon'
import { useApp } from '../lib/store'

const TABS = ['Description', 'Usage & dosage', 'Safety', 'FAQs', 'Reviews']

export default function ProductDetail() {
  const { slug } = useParams()
  const { addToCart, pincode, setPincode, wish, toggleWish, user, toast } = useApp()
  const nav = useNavigate()
  const { data: p, isLoading } = useQuery({ queryKey: ['product', slug], queryFn: () => api.product(slug) })
  const { data: related = [] } = useQuery({ queryKey: ['related', p?.id], queryFn: () => api.related(p), enabled: !!p })
  const [vi, setVi] = useState(0)
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState(0)
  const [pin, setPin] = useState(pincode)
  const [del, setDel] = useState(null)
  useEffect(() => { setVi(0); setQty(1); setTab(0) }, [slug])
  useEffect(() => { if (p) document.title = `${p.name} – AgriMart` }, [p])

  if (isLoading) return <div className="container pad"><div className="skeleton" style={{ minHeight: 420 }} /></div>
  if (!p) return <div className="container"><Empty icon="search" title="Product not found"><Link to="/products">Browse products</Link></Empty></div>

  const v = p.variants[vi]
  const cropNames = allCrops.filter((c) => p.crops.includes(c.slug)).map((c) => c.name)
  const targets = allPests.filter((x) => p.pests.includes(x.id)).map((x) => x.name)
  const check = async () => { const r = await api.pincode(pin); setDel(r); if (r.ok) setPincode(pin) }
  const ld = { '@context': 'https://schema.org', '@type': 'Product', name: p.name, brand: { '@type': 'Brand', name: p.brand }, aggregateRating: { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews }, offers: { '@type': 'Offer', priceCurrency: 'INR', price: v.price, availability: v.stock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } }

  return (
    <div className="container">
      <script type="application/ld+json">{JSON.stringify(ld)}</script>
      <div className="crumbs"><Link to="/shop">Home</Link><Icon name="arrow" size={12} /><Link to={`/products?category=${p.category}`}>{p.category.replace('-', ' ')}</Link><Icon name="arrow" size={12} /><span>{p.name}</span></div>
      <div className="pd">
        <div className="gal"><ProductArt p={p} /></div>
        <div>
          <span className="badge">{p.brand}</span>
          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', marginTop: 10 }}>{p.name}</h1>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><Stars v={p.rating} n={p.reviews} /><span className="muted" style={{ fontSize: '.85rem' }}>SKU {v.sku}</span></div>
          <div style={{ margin: '20px 0' }}>
            <span className="price" style={{ fontSize: '2.2rem' }}>{inr(v.price)}</span>
            {v.mrp > v.price && <><span className="mrp" style={{ fontSize: '1rem' }}>{inr(v.mrp)}</span> <span className="badge off" style={{ marginLeft: 8 }}>{disc(v)}% OFF</span></>}
            <div className="muted" style={{ fontSize: '.8rem' }}>Inclusive of all taxes</div>
          </div>
          <b style={{ fontSize: '.85rem' }}>Pack size</b>
          <div className="chips" style={{ margin: '10px 0 18px' }} role="radiogroup" aria-label="Pack size">
            {p.variants.map((x, i) => <button key={x.id} role="radio" aria-checked={i === vi} className={`chip ${i === vi ? 'on' : ''}`} onClick={() => setVi(i)}>{x.pack} · {inr(x.price)}</button>)}
          </div>
          <p style={{ margin: '0 0 16px' }}>{v.stock > 10 ? <span className="badge"><Icon name="check" size={13} /> In stock</span> : v.stock > 0 ? <span className="badge warn">Only {v.stock} left</span> : <span className="badge red">Out of stock</span>}</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="qty"><button onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease"><Icon name="minus" size={16} /></button><span>{qty}</span><button onClick={() => setQty(Math.min(v.stock, qty + 1))} aria-label="Increase"><Icon name="plus" size={16} /></button></div>
            <button className="btn" disabled={!v.stock} onClick={() => addToCart(p, v, qty)}><Icon name="cart" size={18} /> Add to cart</button>
            <button className="btn ghost" onClick={() => { if (!user) { toast('Log in to save products'); nav('/login'); return } toggleWish(p.id) }} aria-pressed={wish.includes(p.id)}><Icon name="heart" size={18} fill={wish.includes(p.id)} /> {wish.includes(p.id) ? 'Saved' : 'Wishlist'}</button>
          </div>

          <div className="card pad" style={{ marginTop: 22 }}>
            <b style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="truck" size={18} /> Check delivery</b>
            <div className="pin-row" style={{ marginTop: 10 }}>
              <input inputMode="numeric" maxLength={6} placeholder="Enter 6-digit pincode" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="Pincode" />
              <button className="btn sm" style={{ minHeight: 46 }} onClick={check}>Check</button>
            </div>
            {del && <p style={{ margin: '10px 0 0', display: 'flex', gap: 8, alignItems: 'center' }} role="status"><Icon name={del.ok ? 'check' : 'warn'} size={16} />{del.ok ? `Deliverable · estimated by ${del.date} (${del.days} days)` : del.msg}</p>}
          </div>

          {p.regulated && <div className="notice" style={{ marginTop: 16 }}><Icon name="shield" size={20} /><div><b>Regulated product.</b> Sale is subject to eligibility, licence and location checks, plus label confirmations at checkout. {p.licence && <>Reg.: {p.licence}.</>}</div></div>}
        </div>
      </div>

      <div className="card specs">
        {[['Active ingredient', p.activeIngredient], ['Formulation', p.formulation], ['Suitable crops', cropNames.join(', ') || '—'], ['Target pest / disease', targets.join(', ') || '—'], ['Manufacturer', p.manufacturer], ['Licence / reg.', p.licence || 'Not applicable']].map(([k, val]) => <div key={k}><small>{k}</small>{val}</div>)}
      </div>

      <div className="tabs" role="tablist" style={{ marginTop: 32 }}>{TABS.map((t, i) => <button key={t} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>)}</div>
      <div className="card pad" style={{ marginTop: 16 }} role="tabpanel">
        {tab === 0 && <><p>{p.description}</p><h4>Storage</h4><p>{p.storage}</p></>}
        {tab === 1 && <><h4>Dosage</h4><p>{p.dosage}</p><h4>Application</h4><p>{p.application}</p><div className="notice info"><Icon name="info" size={20} />Always follow the label on the pack. Recommendations vary by crop, region and pest pressure. Consult your local agriculture officer.</div></>}
        {tab === 2 && <><h4>Precautions</h4><p>{p.precautions}</p></>}
        {tab === 3 && p.faqs.map(([q, a]) => <details key={q} style={{ padding: '10px 0', borderBottom: '1px solid var(--line)' }}><summary style={{ cursor: 'pointer' }}><b>{q}</b></summary><p className="muted">{a}</p></details>)}
        {tab === 4 && <><Stars v={p.rating} n={p.reviews} />{[['Ramesh R.', 5, 'Worked as described, packaging was intact.'], ['Sunita K.', 4, 'Good product, delivery took 4 days.']].map(([n, r, t]) => <div key={n} style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 12 }}><b>{n}</b> <span className="badge"><Icon name="check" size={12} /> Verified purchase</span><div><Stars v={r} /></div><p style={{ margin: 0 }}>{t}</p></div>)}</>}
      </div>

      <div className="buybar">
        <div><b>{inr(v.price)}</b><small>{v.pack}</small></div>
        <button className="btn" disabled={!v.stock} onClick={() => addToCart(p, v, qty)}><Icon name="cart" size={18} /> {v.stock ? 'Add to cart' : 'Out of stock'}</button>
      </div>

      {related.length > 0 && <section className="section"><SectionHead eyebrow="Pairs well" title="You may also need" /><div className="grid g-prod">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  )
}
