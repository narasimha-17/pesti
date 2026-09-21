import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { disc, inr, minVariant } from '../lib/api'
import { useState } from 'react'
import Icon, { ProductArt } from './Icon'

export const Stars = ({ v, n }) => (
  <span className="stars" aria-label={`${v} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="star" size={14} fill={i <= Math.round(v)} style={i > Math.round(v) ? { opacity: 0.35 } : null} />)}
    <span className="muted">{v}{n != null && ` (${n})`}</span>
  </span>
)

export const Skeletons = ({ n = 8 }) => (
  <div className="grid g-prod">{Array.from({ length: n }, (_, i) => <div key={i} className="skeleton" />)}</div>
)

export const Empty = ({ icon = 'sprout', title, children }) => (
  <div className="empty"><div className="ib"><Icon name={icon} size={38} /></div><h3>{title}</h3><div className="muted">{children}</div></div>
)

export function Modal({ onClose, children, label }) {
  return (
    <div className="modal-bg" onClick={onClose} role="dialog" aria-modal="true" aria-label={label}>
      <div className="modal" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <button className="btn ghost sm" style={{ float: 'right' }} onClick={onClose} autoFocus><Icon name="x" size={16} /> Close</button>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, error, children }) {
  return <div className="field"><label>{label}{children}</label>{error && <div className="err" role="alert">{error}</div>}</div>
}

export function SectionHead({ eyebrow, title, to, cta = 'View all' }) {
  return (
    <div className="section-head">
      <div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div>
      {to && <Link className="link-arrow" to={to}>{cta} <Icon name="arrow" size={16} /></Link>}
    </div>
  )
}

export function ProductCard({ p, onQuickView, deal }) {
  const { addToCart, wish, toggleWish, user, toast } = useApp()
  const nav = useNavigate()
  const save = () => { if (!user) { toast('Log in to save products'); nav('/login'); return } toggleWish(p.id) }
  const v = minVariant(p)
  const inWish = wish.includes(p.id)
  const claimed = Math.min(95, 38 + ((p.id * 17) % 52))
  return (
    <article className="pcard">
      <div className="pimg-wrap">
        <Link to={`/product/${p.slug}`} className="pimg" aria-label={p.name}><ProductArt p={p} fit="slice" /></Link>
        {p.isNew && <span className="new-tag">New</span>}
        <button className="wish" onClick={save} aria-label={inWish ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={inWish}><Icon name="heart" size={18} fill={inWish} /></button>
        <span className="rate"><b>{p.rating}</b><Icon name="star" size={12} fill /> <i>|</i> {p.reviews}</span>
      </div>
      <div className="pbody">
        <span className="brand">{p.brand}</span>
        <h3><Link to={`/product/${p.slug}`}>{p.name}</Link></h3>
        <div className="pline"><span className="price">{inr(v.price)}</span>{v.mrp > v.price && <><span className="mrp">{inr(v.mrp)}</span><span className="off">({disc(v)}% off)</span></>}</div>
        <div className="meta">{v.pack}{p.variants.length > 1 && ` · +${p.variants.length - 1} more`}</div>
        {deal && <div className="claimed"><i><u style={{ width: `${claimed}%` }} /></i><small>{claimed}% claimed</small></div>}
        <div className="row-btn">
          <button className="btn sm block ghost" disabled={v.stock === 0} onClick={() => addToCart(p, v)}>{v.stock ? 'Add to cart' : 'Out of stock'}</button>
          {onQuickView && <button className="btn ghost sm" onClick={() => onQuickView(p)} aria-label={`Quick view ${p.name}`}><Icon name="eye" size={16} /></button>}
        </div>
      </div>
    </article>
  )
}

// Person photo: /img/people/<name-slug>.jpg if present, then an illustrated avatar, then the initial.
export function Avatar({ name, className = 'av' }) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
  const srcs = [`/img/people/${slug}.jpg`, `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=e8f7dd`]
  const [i, setI] = useState(0)
  if (i >= srcs.length) return <span className={className}>{name[0]}</span>
  return <span className={`${className} has-img`}><img src={srcs[i]} alt={name} loading="lazy" onError={() => setI(i + 1)} /></span>
}
