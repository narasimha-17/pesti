import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { languages } from '../lib/i18n'
import SearchBox from './SearchBox'
import { Avatar } from './ui'
import Icon, { Logo } from './Icon'
import { photo } from '../lib/photos'
import WhatsAppButton from './WhatsAppButton'

export default function Layout() {
  const { t, lang, setLang, cartCount, wish, user, logout } = useApp()
  const nav = useNavigate()
  const [dd, setDd] = useState(null)
  const ddRef = useRef(null)
  const ddRef2 = useRef(null)
  const { data: cats = [] } = useQuery({ queryKey: ['cats'], queryFn: api.categories })
  const { pathname, search } = useLocation()
  const here = pathname + search
  const [scrolled, setScrolled] = useState(false)
  const [far, setFar] = useState(false)
  const [p, setP] = useState(0)
  const [menu, setMenu] = useState(false)
  const [hotSlug, setHotSlug] = useState(null)
  const hot = cats.find((c) => c.slug === hotSlug) || cats[0]
  const megaRef = useRef(null)
  const guest = !user

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  useEffect(() => { setMenu(false); setDd(null) }, [pathname, search])
  useEffect(() => {
    if (!dd) return undefined
    const close = (e) => { const r = dd === 'lang' ? ddRef.current : ddRef2.current; if (r && !r.contains(e.target)) setDd(null) }
    const esc = (e) => { if (e.key === 'Escape') setDd(null) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [dd])
  useEffect(() => {
    if (!menu) return undefined
    const close = (e) => { if (megaRef.current && !megaRef.current.contains(e.target)) setMenu(false) }
    const esc = (e) => { if (e.key === 'Escape') setMenu(false) }
    document.addEventListener('mousedown', close); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [menu])
  useEffect(() => {
    let raf = 0
    const on = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight
        setScrolled(y > 8); setFar(y > 700); setP(max > 0 ? Math.min(y / max, 1) : 0)
      })
    }
    window.addEventListener('scroll', on, { passive: true })
    on()
    return () => { window.removeEventListener('scroll', on); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <a href="#main" className="sr-only">Skip to content</a>
      <div className="utility">
        <div className="container">
          <span><Icon name="truck" size={15} /> Free delivery above <b>₹999</b></span>
          <span className="hide-m"><Icon name="shield" size={15} /> Genuine products from licensed brands</span>
          {!guest && <span className="hide-s"><Icon name="phone" size={15} /> 1800-000-0000 (demo)</span>}
        </div>
      </div>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container header-row">
          <Link to="/shop" aria-label="Lakshmi Agency store home"><Logo light /></Link>
          <SearchBox />
          <div className="hdr-actions">
            {guest ? (
              <>
                <Link to="/login" className="btn ghost sm hdr-login hdr-customer"><Icon name="user" size={16} /> Customer login</Link>
                <Link to="/register" className="btn sm hide-s">Sign up</Link>
              </>
            ) : (
              <>
                <div className="dd" ref={ddRef}>
                  <button className="hdr-ic" aria-haspopup="menu" aria-expanded={dd === 'lang'} aria-label="Language" onClick={() => setDd(dd === 'lang' ? null : 'lang')}><Icon name="globe" size={20} /></button>
                  {dd === 'lang' && (
                    <div className="dd-panel" role="menu">
                      <span className="dd-title">Language</span>
                      {Object.entries(languages).map(([k, v]) => <button key={k} role="menuitemradio" aria-checked={lang === k} className={lang === k ? 'on' : ''} onClick={() => { setLang(k); setDd(null) }}>{v}{lang === k && <Icon name="check" size={16} />}</button>)}
                    </div>
                  )}
                </div>
                <Link className="icon-btn" to="/account?tab=wishlist"><Icon name="heart" size={22} />{wish.length > 0 && <span key={wish.length} className="count pop">{wish.length}</span>}<span className="lbl">{t('wishlist')}</span></Link>
                <Link className="icon-btn hide-m" to="/cart"><Icon name="cart" size={22} />{cartCount > 0 && <span key={cartCount} className="count pop">{cartCount}</span>}<span className="lbl">{t('cart')}</span></Link>
                <div className="dd" ref={ddRef2}>
                  <button className="hdr-av" aria-haspopup="menu" aria-expanded={dd === 'me'} aria-label="Account menu" onClick={() => setDd(dd === 'me' ? null : 'me')}><Avatar name={user.name} gender={user.gender} className="pp-av" /></button>
                  {dd === 'me' && (
                    <div className="dd-panel me" role="menu">
                      <div className="dd-user"><Avatar name={user.name} gender={user.gender} className="pp-av" /><div><b>{user.name}</b><small>{user.email}</small></div></div>
                      <Link role="menuitem" to="/account"><Icon name="user" size={18} /> My account</Link>
                      <Link role="menuitem" to="/account?tab=orders"><Icon name="box" size={18} /> Orders</Link>
                      <Link role="menuitem" to="/account?tab=wishlist"><Icon name="heart" size={18} /> Wishlist</Link>
                      <Link role="menuitem" to="/account?tab=settings"><Icon name="sparkle" size={18} /> Settings</Link>
                      {user.role === 'admin' && <Link role="menuitem" to="/admin"><Icon name="shield" size={18} /> Admin panel</Link>}
                      <button role="menuitem" className="out" onClick={() => { setDd(null); logout(); nav('/') }}><Icon name="arrow" size={18} /> Logout</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        <nav className="catnav guest" aria-label="Shop">
          <div className="container">
              <div className="mega" ref={megaRef}>
                <button className="mega-btn" aria-expanded={menu} aria-haspopup="true" onClick={() => setMenu(!menu)}><Icon name="grid" size={16} /> All categories <Icon name="chevron" size={16} className={menu ? 'flip' : ''} /></button>
                {menu && (
                  <div className="mega-panel mp2" role="menu">
                    <div className="mp-list">
                      <span className="mp-title">Shop by category</span>
                      {cats.map((c) => <Link key={c.slug} role="menuitem" className={c.slug === (hot?.slug || cats[0]?.slug) ? 'on' : ''} onMouseEnter={() => setHotSlug(c.slug)} onFocus={() => setHotSlug(c.slug)} to={`/products?category=${c.slug}`}><span className="mi"><Icon name={c.icon} size={18} /></span>{c.name}<Icon name="arrow" size={14} className="go" /></Link>)}
                    </div>
                    {hot && (
                      <Link to={`/products?category=${hot.slug}`} className="mp-feature" style={{ '--bg': photo(hot.slug) ? `url(${photo(hot.slug)})` : 'none' }}>
                        <span className="mp-tag">Featured</span>
                        <b>{hot.name}</b>
                        <span className="mp-cta">Shop {hot.name.toLowerCase()} <Icon name="arrow" size={16} /></span>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            {!guest && <Link className={`hl ${pathname === '/crops' ? 'active' : ''}`} to="/crops">{t('nav.shopByCrop')}</Link>}
            {!guest && <Link className={`hl ${pathname === '/crop-assistant' ? 'active' : ''}`} to="/crop-assistant">{t('nav.assistant')}</Link>}
            <Link className={pathname === '/rentals' ? 'active' : ''} to="/rentals"><Icon name="tractor" size={16} style={{ marginRight: 4, verticalAlign: '-3px' }} />Rentals</Link>
            <Link className={here === '/products?sort=discount' ? 'active' : ''} to="/products?sort=discount">Deals</Link>
            <Link className={here === '/products?flag=new' ? 'active' : ''} to="/products?flag=new">New arrivals</Link>
            <Link className={here === '/products?flag=best' ? 'active' : ''} to="/products?flag=best">Best sellers</Link>
            {!guest && <Link className={pathname === '/learn' ? 'active' : ''} to="/learn">{t('nav.learn')}</Link>}
          </div>
        </nav>
        <div className="progress" style={{ '--p': p }} aria-hidden="true" />
      </header>

      <main id="main"><div key={pathname} className="page"><Outlet /></div></main>

      <footer className="footer">
        <div className="container">
          <div className="cols">
            <div>
              <Logo light />
              <p style={{ maxWidth: 320 }}>Farm inputs delivered to your doorstep. Genuine brands, clear safety information and farmer-first support in every language.</p>
              <p style={{ display: 'flex', gap: 8, alignItems: 'center' }}><Icon name="headset" size={18} /> Call or WhatsApp support, 7 days</p>
            </div>
            <div><h4>Shop</h4>{cats.slice(0, 6).map((c) => <Link key={c.slug} to={`/products?category=${c.slug}`}>{c.name}</Link>)}<Link to="/rentals">Equipment rental</Link></div>
            <div><h4>Help</h4><Link to="/learn">Farmer education</Link>{!guest && <Link to="/crop-assistant">Crop Health Assistant</Link>}<Link to={guest ? "/login?next=/account" : "/account"}>Track order</Link><Link to={guest ? "/login?next=/account" : "/account"}>Returns & refunds</Link></div>
            <div><h4>Company</h4><a href="#main">About us</a><a href="#main">Licences & compliance</a><a href="#main">Privacy policy</a><Link to="/credits">Photo credits</Link>{!guest && <Link to="/admin">Admin</Link>}</div>
          </div>
          <div className="copy">© 2026 Lakshmi Agency demo. Crop-protection products must be used as per the label and local regulations. Content here is educational and not a substitute for advice from your agriculture officer.</div>
        </div>
      </footer>

      <button className={`totop ${far ? 'show' : ''}`} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><Icon name="arrow" size={20} style={{ transform: 'rotate(-90deg)' }} /></button>
      <WhatsAppButton />

      <nav className="tabbar" aria-label="Quick navigation">
        <NavLink to="/shop" end><Icon name="home" size={22} /><span>Shop</span></NavLink>
        {guest ? <NavLink to="/products" end><Icon name="grid" size={22} /><span>Browse</span></NavLink> : <NavLink to="/crops"><Icon name="paddy" size={22} /><span>Crops</span></NavLink>}
        {!guest && <NavLink to="/crop-assistant"><Icon name="pulse" size={22} /><span>Health</span></NavLink>}
        {!guest && <NavLink to="/cart"><Icon name="cart" size={22} />{cartCount > 0 && <b key={cartCount} className="count pop">{cartCount}</b>}<span>Cart</span></NavLink>}
        <NavLink to={guest ? '/login' : '/account'}><Icon name="user" size={22} /><span>{guest ? 'Login' : 'Account'}</span></NavLink>
      </nav>
    </>
  )
}
