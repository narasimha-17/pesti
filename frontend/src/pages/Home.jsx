import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, disc, minVariant } from '../lib/api'
import { brands, products } from '../data/mock'
import { ProductCard, Skeletons, Avatar } from '../components/ui'
import Icon from '../components/Icon'
import Rail from '../components/Rail'
import SeasonPlanner from '../components/SeasonPlanner'
import { useApp } from '../lib/store'
import { photo } from '../lib/photos'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const CAT_TONE = {
  insecticides: ['#fff0e0', '#ea6a0a'], fungicides: ['#dff6fb', '#0e7490'], herbicides: ['#fdf6d0', '#a77b00'], fertilizers: ['#e2f5e6', '#15803d'],
  'bio-pesticides': ['#eaf7d3', '#4d8a0b'], 'growth-promoters': ['#d9f5ef', '#0d9488'], micronutrients: ['#ece6fb', '#7c3aed'], seeds: ['#fbecc9', '#a16207'],
  'crop-protection': ['#e0e9fb', '#1d4ed8'], 'farm-equipment': ['#e6eaef', '#475569'], sprayers: ['#dcf0fb', '#0369a1'], accessories: ['#fde4e8', '#be123c'],
}
const PROBLEMS = [
  ['bug', 'Insects & pests', 'Borers, whitefly, bollworm', '/products?category=insecticides', '#fff0e0', '#ea6a0a'],
  ['mushroom', 'Fungus & disease', 'Blast, blight, mildew', '/products?category=fungicides', '#dff6fb', '#0e7490'],
  ['weed', 'Weeds', 'Grass and broadleaf weeds', '/products?category=herbicides', '#fdf6d0', '#a77b00'],
  ['flask', 'Weak growth', 'Yellowing, nutrient gaps', '/products?category=fertilizers', '#e2f5e6', '#15803d'],
  ['spray', 'Tools to spray', 'Sprayers and safety kits', '/products?category=sprayers', '#dcf0fb', '#0369a1'],
]

const ART_PHOTO = { 'paddy-kharif-guide': 'paddy', 'safe-spraying': 'sprayers', 'whitefly-cotton': 'cotton', 'soil-health': 'micronutrients' }
const PACK_FALLBACK = { fertilizers: 'micronutrients', accessories: 'farm-equipment' }
const pick = (pred, n = 3) => products.filter(pred).slice(0, n)
const SLIDES = [
  { tag: 'Kharif season sale', title: 'Up to 25% off on seeds, nutrients and fungicides', sub: 'Free delivery above ₹999. Offer ends this month.', cta: 'Shop the sale', to: '/products?sort=discount', tone: 'green', items: () => [...products].sort((a, b) => disc(minVariant(b)) - disc(minVariant(a))).slice(0, 3) },
  { tag: 'Go natural', title: 'Bio-products for healthier soil', sub: 'Neem oil, Trichoderma and growth promoters.', cta: 'Explore bio range', to: '/products?category=bio-pesticides', tone: 'amber', items: () => pick((p) => ['bio-pesticides', 'growth-promoters'].includes(p.category)) },
  { tag: 'Spray safe', title: 'Sprayers and safety kits, ready to ship', sub: 'Reliable equipment with PPE for safe application.', cta: 'View sprayers', to: '/products?category=sprayers', tone: 'blue', items: () => pick((p) => ['sprayers', 'accessories'].includes(p.category)) },
]

function MarketHero() {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || reduced()) return undefined
    const id = setTimeout(() => setI((x) => (x + 1) % SLIDES.length), 5500)
    return () => clearTimeout(id)
  }, [i, paused])
  const s = SLIDES[i]
  const items = s.items()
  const { pincode, setPincode, user } = useApp()
  const [pin, setPin] = useState(pincode)
  const [res, setRes] = useState(null)
  const check = async (e) => { e.preventDefault(); const r = await api.pincode(pin); setRes(r); if (r.ok) setPincode(pin) }

  return (
    <div className="mk-hero container">
      <div className={`mk-slide t-${s.tone}`} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Offers">
        <div className="mk-copy" key={i}>
          <span className="mk-tag">{s.tag}</span>
          <h1>{s.title}</h1>
          <p>{s.sub}</p>
          <Link to={s.to} className="btn lime">{s.cta} <Icon name="arrow" size={18} /></Link>
        </div>
        <div className="mk-photos" key={`p${i}`} aria-hidden="true">
          {items.map((p, n) => (
            <Link key={p.id} to={`/product/${p.slug}`} className={`mk-ph ph${n}`} tabIndex={-1}>
              <img src={photo(p.category) || photo(PACK_FALLBACK[p.category]) || photo('crop-protection')} alt="" />
              <span className="mk-ph-cap"><small>{p.brand}</small>{p.name}</span>
            </Link>
          ))}
        </div>
        <div className="mk-ctrl">
          <div className="mk-dots" role="tablist" aria-label="Slides">{SLIDES.map((x, n) => <button key={x.tag} role="tab" aria-selected={n === i} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={x.tag} />)}</div>
          <div className="mk-arrows"><button onClick={() => setI((i + SLIDES.length - 1) % SLIDES.length)} aria-label="Previous"><Icon name="arrow" size={16} style={{ transform: 'scaleX(-1)' }} /></button><button onClick={() => setI((i + 1) % SLIDES.length)} aria-label="Next"><Icon name="arrow" size={16} /></button></div>
        </div>
      </div>

      <div className="mk-side">
        <form className="mk-tile" onSubmit={check}>
          <span className="ib"><Icon name="truck" size={22} /></span>
          <div><b>Check delivery to your village</b><small>Enter your pincode for the delivery date</small></div>
          <div className="pin-row"><input inputMode="numeric" maxLength={6} placeholder="6-digit pincode" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} aria-label="Pincode" /><button className="btn sm" style={{ minHeight: 46 }}>Check</button></div>
          {res && <p className={`res ${res.ok ? 'ok' : ''}`} role="status"><Icon name={res.ok ? 'check' : 'warn'} size={15} /> {res.ok ? `Delivery by ${res.date} (${res.days} days)` : res.msg}</p>}
        </form>
        {user ? (
          <Link to="/crop-assistant" className="mk-tile dark">
            <span className="ib"><Icon name="pulse" size={22} /></span>
            <div><b>Crop Health Assistant</b><small>Choose crop and problem to learn more and see related products</small></div>
            <span className="go">Start <Icon name="arrow" size={16} /></span>
          </Link>
        ) : (
          <Link to="/register" className="mk-tile dark">
            <span className="ib"><Icon name="user" size={22} /></span>
            <div><b>Create your free account</b><small>Track orders, save products and get crop advice tools after you sign in</small></div>
            <span className="go">Sign up <Icon name="arrow" size={16} /></span>
          </Link>
        )}
      </div>
    </div>
  )
}

function DealsCountdown() {
  const end = useRef(new Date(new Date().setHours(24, 0, 0, 0))).current
  const [s, setS] = useState(Math.max(0, Math.floor((end - Date.now()) / 1000)))
  useEffect(() => { const id = setInterval(() => setS(Math.max(0, Math.floor((end - Date.now()) / 1000))), 1000); return () => clearInterval(id) }, [end])
  const t = [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, '0'))
  return <span className="cd-inline" role="timer" aria-label="Deals end in"><Icon name="clock" size={16} /> Ends in {t.map((x, i) => <b key={i}>{x}</b>)}</span>
}

function ProductRail({ eyebrow, title, to, params, deal, aside, className }) {
  const { data, isLoading } = useQuery({ queryKey: ['rail', title], queryFn: () => api.products(params) })
  return (
    <Rail eyebrow={eyebrow} title={title} to={to} aside={aside} className={className}>
      {isLoading ? <div style={{ minWidth: 600 }}><Skeletons n={3} /></div> : data.slice(0, 8).map((p) => <div className="rail-item" key={p.id}><ProductCard p={p} deal={deal} /></div>)}
    </Rail>
  )
}

export default function Home() {
  const { user } = useApp()
  const { data: cats = [] } = useQuery({ queryKey: ['cats'], queryFn: api.categories })
  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: api.crops })
  const { data: articles = [] } = useQuery({ queryKey: ['articles'], queryFn: api.articles })
  const { data: quotes = [] } = useQuery({ queryKey: ['quotes'], queryFn: api.testimonials })

  return (
    <>
      {!user && (
        <div className="guest-strip">
          <div className="container">
            <span className="gs-text"><Icon name="tag" size={18} /><span><b>New to AgriMart?</b> Sign up and get ₹100 off your first order above ₹999. Use code <b>WELCOME100</b>.</span></span>
          </div>
        </div>
      )}

      <MarketHero />

      <nav className="cat-wall container" aria-label="Shop by category">
        {cats.map((c, n) => {
          const [bg, fg] = CAT_TONE[c.slug] || ['#e2f5e6', '#15803d']
          const img = photo(c.slug) || photo(PACK_FALLBACK[c.slug])
          return (
            <Link key={c.slug} to={`/products?category=${c.slug}`} className={`cw ${n % 7 === 0 ? 'wide' : ''}`} style={{ '--bg': bg, '--fg': fg }}>
              {img && <img src={img} alt="" loading="lazy" />}
              <span className="cw-ic"><Icon name={c.icon} size={22} /></span>
              <b>{c.name}</b>
              <Icon name="arrow" size={16} className="cw-go" />
            </Link>
          )
        })}
      </nav>

      <ProductRail eyebrow="Limited time" title="Deals of the day" to="/products?sort=discount" params={{ sort: 'discount' }} deal aside={<DealsCountdown />} />

      <Rail eyebrow="Crop-first" title="Shop by crop" to="/crops" cta="All crops" className="alt">
        {crops.map((c) => <Link key={c.slug} to={`/products?crop=${c.slug}`} className="crop-photo">{photo(c.slug) && <img src={photo(c.slug)} alt="" loading="lazy" />}<span className="cp-season">{c.season}</span><span className="cp-ic"><Icon name={c.icon} size={20} /></span><b>{c.name}</b><span className="cp-go">Shop {c.name.toLowerCase()} <Icon name="arrow" size={14} /></span></Link>)}
      </Rail>

      <section className="rail-sec">
        <div className="container">
          <div className="rail-head"><div><span className="eyebrow">Find the right fix</span><h2>Shop by problem</h2></div>{user && <Link className="link-arrow" to="/crop-assistant">Not sure? Ask the assistant <Icon name="arrow" size={16} /></Link>}</div>
          <div className="prob-grid">
            {PROBLEMS.map(([ic, t, d, to, bg, fg]) => <Link key={t} to={to} className="prob" style={{ '--bg': bg, '--fg': fg }}><span className="ib"><Icon name={ic} size={28} /></span><b>{t}</b><small>{d}</small></Link>)}
          </div>
        </div>
      </section>

      <ProductRail eyebrow="Most loved" title="Best sellers" to="/products?flag=best" params={{ flag: 'best' }} className="alt" />

      <section className="rail-sec">
        <div className="container">
          <div className="promo-duo">
            <Link to="/products?category=seeds" className="pd-card g1"><span className="mk-tag">Seeds</span><h3>Certified seeds for this season</h3><p>Hybrid paddy, Bt cotton and more.</p><span className="go">Shop seeds <Icon name="arrow" size={16} /></span></Link>
            <Link to="/products?category=fertilizers" className="pd-card g2"><span className="mk-tag">Nutrition</span><h3>Fertilizers and micronutrients</h3><p>DAP, NPK, zinc and growth promoters.</p><span className="go">Shop nutrition <Icon name="arrow" size={16} /></span></Link>
          </div>
        </div>
      </section>

      <ProductRail eyebrow="Just landed" title="New arrivals" to="/products?flag=new" params={{ flag: 'new' }} />

      <section className="brand-sec">
        <div className="container">
          <div className="brand-head">
            <div><span className="eyebrow">Trusted names</span><h2>Shop by brand</h2></div>
            <p>Licensed manufacturers only. Every pack ships sealed with a valid invoice.</p>
          </div>
          <div className="brand-bento">
            {brands.map((b, i) => {
              const n = products.filter((p) => p.brand === b).length
              return (
                <Link key={b} to={`/products?brand=${encodeURIComponent(b)}`} className={`bb bb${i % 5} ${i < 2 ? 'big' : ''}`}>
                  <span className="bb-mark">{b[0]}</span>
                  <span className="bb-name">{b}</span>
                  <span className="bb-count">{n} {n === 1 ? 'product' : 'products'}</span>
                  <Icon name="arrow" size={18} className="bb-go" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rail-sec">
        <div className="container">
          <div className="rail-head"><div><span className="eyebrow">This month on your farm</span><h2>What should I do now?</h2></div><Link className="link-arrow" to="/learn">Crop guides <Icon name="arrow" size={16} /></Link></div>
          <SeasonPlanner />
        </div>
      </section>

      <section className="rail-sec alt">
        <div className="container">
          <div className="trust mk-trust">
            {[['truck', 'Farm-gate delivery', '2 to 5 days, pincode-wise'], ['shield', 'Genuine products', 'Licensed brands and suppliers'], ['lock', 'Secure payments', 'UPI, cards and net banking'], ['headset', 'Expert support', 'Call or WhatsApp, in your language']].map(([ic, a, s]) => (
              <div key={a}><span className="ib"><Icon name={ic} size={24} /></span><div><b>{a}</b><span>{s}</span></div></div>
            ))}
          </div>
        </div>
      </section>

      <section className="rail-sec">
        <div className="container">
          <div className="rail-head"><div><span className="eyebrow">Farmer education</span><h2>Learn before you spray</h2></div><Link className="link-arrow" to="/learn">More guides <Icon name="arrow" size={16} /></Link></div>
          <div className="grid g-3">{articles.map((a) => <Link to="/learn" key={a.slug} className="card article"><div className="top" style={{ '--bg': ART_PHOTO[a.slug] ? `url(${photo(ART_PHOTO[a.slug])})` : 'none' }}><span className="ab"><Icon name={a.icon} size={22} /></span></div><div className="txt"><span className="badge">{a.kind}</span><h3 style={{ marginTop: 12 }}>{a.title}</h3><p className="muted" style={{ margin: 0 }}>{a.summary}</p></div></Link>)}</div>
        </div>
      </section>

      {!user && (
      <section className="rail-sec alt">
        <div className="container">
          <div className="rail-head"><div><span className="eyebrow">Testimonials</span><h2>Trusted by farmers across India</h2></div><Link to="/testimonials" className="btn ghost sm">All farmer stories <Icon name="arrow" size={16} /></Link></div>
          <div className="notes">{quotes.map((q) => <div className="quote" key={q.name}><p>“{q.text}”</p><div className="who"><Avatar name={q.name} className="av-i" /><div><b>{q.name}</b><div className="muted" style={{ fontSize: '.82rem' }}>{q.place} · {q.crop} farmer</div></div></div></div>)}</div>
        </div>
      </section>
      )}
    </>
  )
}
