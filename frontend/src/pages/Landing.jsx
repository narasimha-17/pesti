import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, inr, minVariant } from '../lib/api'
import { products } from '../data/mock'
import Icon, { Logo, ProductArt } from '../components/Icon'
import LandingScene from '../components/LandingScene'
import Stat from '../components/Stat'
import WhatsAppButton from '../components/WhatsAppButton'

const BRANDS = ['Bayer', 'Syngenta', 'UPL', 'Dhanuka', 'Coromandel', 'IFFCO', 'Tata Rallis', 'Katyayani', 'Neptune', 'Kisan Kraft']
const STEPS = [
  ['paddy', 'Pick your crop', 'Tell us what you grow. We show only the products that suit it.'],
  ['cart', 'Choose and pay', 'Compare pack sizes and prices. Pay by UPI, card or on delivery where available.'],
  ['truck', 'Get it at your village', 'Enter your pincode to see the delivery date. Track the order until it arrives.'],
]
const FEATURES = [
  ['shield', 'Genuine products', 'Only licensed brands and suppliers, with an invoice for every order.'],
  ['truck', 'Delivery to your pincode', 'Check the delivery date before you buy and follow the parcel.'],
  ['book', 'Safe-use guidance', 'Plain guides on reading labels, spraying safely and storing products.'],
  ['headset', 'Real support', 'Call or WhatsApp our team, seven days a week.'],
]
const FAQ = [
  ['Do I need an account to shop?', 'Yes. Create a free account or sign in with your mobile number to browse the store, fill your cart and track orders.'],
  ['Are the products genuine?', 'Yes. We buy from licensed brands and suppliers, and every order comes with an invoice.'],
  ['Can I buy pesticides online?', 'Yes, where the law allows. Some products need extra confirmations at checkout, and we check the licence and your delivery area before dispatch.'],
  ['How long does delivery take?', 'Usually 2 to 5 days, depending on your pincode. You can check the estimated date on any product page.'],
]

function Marquee({ rev = false, children }) {
  return <div className={`lx-marq ${rev ? 'rev' : ''}`}><div className="track">{children}{children}</div></div>
}

export default function Landing() {
  const { data: quotes = [] } = useQuery({ queryKey: ['quotes'], queryFn: api.testimonials })
  const [solid, setSolid] = useState(false)
  useEffect(() => { document.title = 'Lakshmi Agency – Farm inputs delivered to your village' }, [])
  useEffect(() => {
    const on = () => setSolid(window.scrollY > 40)
    on(); window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  const packs = products.filter((p) => p.category !== 'farm-equipment')

  return (
    <div className="lp">
      <header className={`lx-nav ${solid ? 'solid' : ''}`}>
        <div className="container lp-nav-row">
          <Link to="/" aria-label="Lakshmi Agency home"><Logo light={!solid} /></Link>
          <nav className="lp-links" aria-label="Sections"><a href="#how">How it works</a><a href="#why">Why Lakshmi Agency</a><Link to="/testimonials">Stories</Link><a href="#faq">FAQ</a></nav>
          <div className="lp-actions">
            <Link to="/login" className="btn ghost sm">Login</Link>
            <Link to="/register" className="btn lime sm">Get started</Link>
          </div>
        </div>
      </header>

      <section className="lx-hero">
        <div className="lx-glow g1" /><div className="lx-glow g2" />
        <div className="container lx-hero-grid">
          <div className="lx-copy">
            <span className="hero-tag"><i>New</i> Kharif season deliveries are open</span>
            <h1>Farm inputs, <em>delivered to your village.</em></h1>
            <p className="lead">Seeds, fertilizers, crop protection and tools from licensed brands. Simple to find, safe to use, delivered to your door.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn lime">Create free account <Icon name="arrow" size={18} /></Link>
              <Link to="/shop" className="btn ghost">Browse the store</Link>
            </div>
            <ul className="lp-ticks">
              <li><Icon name="check" size={16} /> Free delivery above ₹999</li>
              <li><Icon name="check" size={16} /> Genuine, licensed brands</li>
              <li><Icon name="check" size={16} /> Call or WhatsApp support</li>
            </ul>
          </div>
          <LandingScene />
        </div>
      </section>

      <section className="lx-stats">
        <div className="container"><div className="lx-stats-card">
          <Stat to={2000} suffix="+" label="Genuine products" /><Stat to={10} suffix=" lakh+" label="Farmers served" /><Stat to={500} suffix="+" label="Districts delivered to" /><Stat to={4.7} decimals={1} suffix=" / 5" label="Average rating" />
        </div></div>
      </section>

      <div className="lx-brands" aria-label="Brands we stock"><Marquee>{BRANDS.map((b) => <span key={b}>{b}</span>)}</Marquee></div>

      <section className="lp-sec" id="how">
        <div className="container">
          <div className="lp-head"><span className="eyebrow">How it works</span><h2>From your crop to your doorstep</h2><p className="muted">No confusing terms. Just choose, order and receive.</p></div>
          <div className="lx-steps on">
            <div className="lx-line"><u /></div>
            {STEPS.map(([ic, t, d], n) => (
              <div key={t} className="lx-step" style={{ '--i': n }}><span className="num">{n + 1}</span><span className="ic-wrap"><Icon name={ic} size={30} /></span><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="lx-packs" id="products">
        <div className="container lp-head" style={{ marginBottom: 34 }}><span className="eyebrow">2,000+ products</span><h2>Trusted brands, every category</h2></div>
        <Marquee>{packs.map((p) => <Link key={p.id} to={`/product/${p.slug}`} className="lx-pcard"><span className="im"><ProductArt p={p} /></span><b>{p.name}</b><small>{p.brand} · {inr(minVariant(p).price)}</small></Link>)}</Marquee>
        <Marquee rev>{[...packs].reverse().map((p) => <Link key={p.id} to={`/product/${p.slug}`} className="lx-pcard"><span className="im"><ProductArt p={p} /></span><b>{p.name}</b><small>{p.brand} · {inr(minVariant(p).price)}</small></Link>)}</Marquee>
        <div style={{ textAlign: 'center', marginTop: 34 }}><Link to="/shop" className="btn">Explore all products <Icon name="arrow" size={18} /></Link></div>
      </section>

      <section className="lp-sec alt" id="why">
        <div className="container">
          <div className="lp-head"><span className="eyebrow">Why Lakshmi Agency</span><h2>Made to be simple and safe</h2></div>
          <div className="lp-feats">{FEATURES.map(([ic, t, d]) => <div key={t} className="lp-feat"><span className="ib"><Icon name={ic} size={24} /></span><h3>{t}</h3><p>{d}</p></div>)}</div>
        </div>
      </section>

      <section className="lp-sec">
        <div className="container">
          <div className="lp-head"><span className="eyebrow">Farmers say</span><h2>Trusted across India</h2></div>
          <div className="notes">{quotes.slice(0, 3).map((q) => <div className="quote" key={q.name}><p>“{q.text}”</p><div className="who"><i>{q.name[0]}</i><div><b>{q.name}</b><div className="muted" style={{ fontSize: '.82rem' }}>{q.place} · {q.crop} farmer</div></div></div></div>)}</div>
          <div style={{ textAlign: 'center', marginTop: 32 }}><Link to="/testimonials" className="btn ghost">Read more farmer stories <Icon name="arrow" size={18} /></Link></div>
        </div>
      </section>

      <section className="lp-sec alt" id="faq">
        <div className="container" style={{ maxWidth: 820 }}>
          <div className="lp-head"><span className="eyebrow">Questions</span><h2>Common questions</h2></div>
          <div className="lp-faq">{FAQ.map(([q, a], i) => <details key={q}><summary><span className="qn">{String(i + 1).padStart(2, '0')}</span><span className="qt">{q}</span><span className="pm" aria-hidden="true" /></summary><p>{a}</p></details>)}</div>
        </div>
      </section>

      <section className="container" style={{ padding: '72px 24px' }}>
        <div className="band lx-cta">
          <div>
            <h2>Ready to order for this season?</h2>
            <p>Create a free account in a minute. Sign in with your email or mobile number.</p>
            <div className="hero-cta" style={{ marginTop: 18 }}>
              <Link to="/register" className="btn lime">Create free account <Icon name="arrow" size={18} /></Link>
              <Link to="/login" className="btn ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>I already have an account</Link>
            </div>
          </div>
          <div className="steps">{['Free to join', 'No hidden charges', 'Returns as per policy'].map((t) => <div key={t}><span className="n"><Icon name="check" size={16} /></span>{t}</div>)}</div>
        </div>
      </section>

      <footer className="footer" style={{ marginTop: 0 }}>
        <div className="container">
          <div className="cols">
            <div><Logo light /><p style={{ maxWidth: 320 }}>Farm inputs delivered to your village. Genuine brands, clear safety information and farmer-first support.</p></div>
            <div><h4>Store</h4><Link to="/shop">Browse products</Link><Link to="/products?sort=discount">Deals</Link></div>
            <div><h4>Account</h4><Link to="/login">Login</Link><Link to="/register">Create account</Link></div>
            <div><h4>More</h4><Link to="/testimonials">Farmer stories</Link><a href="#faq">FAQ</a></div>
          </div>
          <div className="copy">© 2026 Lakshmi Agency demo. Crop-protection products must be used as per the label and local regulations. Content here is educational and not a substitute for advice from your agriculture officer.</div>
        </div>
      </footer>
      <WhatsAppButton />
    </div>
  )
}
