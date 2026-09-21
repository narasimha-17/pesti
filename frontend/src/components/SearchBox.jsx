import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import Icon, { ProductArt } from './Icon'

const POPULAR = ['Neem oil', 'Paddy', 'Sprayer', 'Fungicide', 'DAP']

export default function SearchBox() {
  const { t, recent, addRecent } = useApp()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef()
  const s = api.suggest(q)

  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const go = (term) => { addRecent(term); setOpen(false); setQ(''); nav(`/products?q=${encodeURIComponent(term)}`) }
  const none = !s.products.length && !s.categories.length && !s.crops.length && !s.brands.length

  return (
    <form className="search" ref={ref} role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) go(q.trim()) }}>
      <label className="sr-only" htmlFor="site-search">Search</label>
      <input id="site-search" value={q} autoComplete="off" placeholder={t('search.placeholder')} onFocus={() => setOpen(true)} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)} />
      <button className="btn sm go" aria-label="Search"><Icon name="search" size={20} /></button>
      {open && (
        <div className="suggest">
          {!q ? (
            <>
              {recent.length > 0 && <><h5>Recent</h5>{recent.map((r) => <button type="button" key={r} onClick={() => go(r)}><Icon name="clock" size={16} /> {r}</button>)}</>}
              <h5>Popular</h5>{POPULAR.map((r) => <button type="button" key={r} onClick={() => go(r)}><Icon name="flame" size={16} /> {r}</button>)}
            </>
          ) : none ? (
            <div className="pad muted">No matches for “{q}”. Try another spelling.</div>
          ) : (
            <>
              {s.products.length > 0 && <><h5>Products</h5>{s.products.map((p) => <Link key={p.id} to={`/product/${p.slug}`} onClick={() => setOpen(false)}><span className="thumb"><ProductArt p={p} /></span>{p.name}<span className="muted"> · {p.brand}</span></Link>)}</>}
              {s.crops.length > 0 && <><h5>Crops</h5>{s.crops.map((c) => <Link key={c.slug} to={`/products?crop=${c.slug}`} onClick={() => setOpen(false)}><Icon name={c.icon} size={18} /> {c.name}</Link>)}</>}
              {s.categories.length > 0 && <><h5>Categories</h5>{s.categories.map((c) => <Link key={c.slug} to={`/products?category=${c.slug}`} onClick={() => setOpen(false)}><Icon name={c.icon} size={18} /> {c.name}</Link>)}</>}
              {s.brands.length > 0 && <><h5>Brands</h5>{s.brands.map((b) => <button type="button" key={b} onClick={() => go(b)}><Icon name="tag" size={16} /> {b}</button>)}</>}
            </>
          )}
        </div>
      )}
    </form>
  )
}
