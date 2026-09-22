import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { crops } from '../data/mock'
import Icon from '../components/Icon'
import Stat from '../components/Stat'
import { Stars, Avatar } from '../components/ui'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const TINTS = ['t-lime', 't-cream', 't-white', 't-amber']
const cropIcon = (name) => crops.find((c) => c.name.toLowerCase() === name.toLowerCase())?.icon || 'other'

function Spotlight({ list }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || reduced() || list.length < 2) return undefined
    const id = setTimeout(() => setI((x) => (x + 1) % list.length), 7000)
    return () => clearTimeout(id)
  }, [i, paused, list.length])
  const q = list[i % list.length]
  if (!q) return null
  return (
    <div className="spot-t" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel" aria-label="Featured stories">
      <div className="spot-side">
        <span className="spot-ic"><Icon name={cropIcon(q.crop)} size={54} /></span>
        <b>{q.crop} farmer</b>
        <small>{q.place}</small>
      </div>
      <figure key={i} className="spot-body">
        <span className="qm" aria-hidden="true">“</span>
        <blockquote>{q.text}</blockquote>
        <figcaption>
          <Avatar name={q.name} />
          <span><b>{q.name}</b><small>{q.place}</small></span>
          <Stars v={q.rating} />
          {q.product && <span className="bought"><Icon name="check" size={13} /> Verified purchase · {q.product}</span>}
        </figcaption>
      </figure>
      <div className="spot-ctrl">
        <div className="dots" role="tablist" aria-label="Stories">{list.map((x, n) => <button key={x.name} role="tab" aria-selected={n === i % list.length} className={n === i % list.length ? 'on' : ''} onClick={() => setI(n)} aria-label={`Story ${n + 1}`} />)}</div>
        <div className="arrows"><button onClick={() => setI((i + list.length - 1) % list.length)} aria-label="Previous"><Icon name="arrow" size={16} style={{ transform: 'scaleX(-1)' }} /></button><button onClick={() => setI((i + 1) % list.length)} aria-label="Next"><Icon name="arrow" size={16} /></button></div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const { data: all = [] } = useQuery({ queryKey: ['quotes'], queryFn: api.testimonials })
  const [crop, setCrop] = useState('all')
  useEffect(() => { document.title = 'Farmer stories – Lakshmi Agency' }, [])
  const cropsUsed = [...new Set(all.map((q) => q.crop))]
  const list = crop === 'all' ? all : all.filter((q) => q.crop === crop)

  return (
    <>
      <section className="ts-hero">
        <div className="container">
          <span className="eyebrow" style={{ color: 'var(--lime)' }}>Farmer stories</span>
          <h1>Voices from the field.</h1>
          <p>Real experiences from farmers who order their seeds, nutrition and crop protection through Lakshmi Agency.</p>
          <div className="ts-stats"><Stat to={4.7} decimals={1} suffix=" / 5" label="Average rating" /><Stat to={10} suffix=" lakh+" label="Farmers served" /><Stat to={96} suffix="%" label="Would order again" /></div>
        </div>
      </section>

      <div className="container ts-wrap">
        <Spotlight list={all.slice(0, 5)} />

        <div className="ts-filter" role="group" aria-label="Filter stories by crop">
          <span className="eyebrow">The wall</span>
          <div className="chips">
            <button className={`chip ${crop === 'all' ? 'on' : ''}`} aria-pressed={crop === 'all'} onClick={() => setCrop('all')}>All stories <b>{all.length}</b></button>
            {cropsUsed.map((c) => <button key={c} className={`chip ${crop === c ? 'on' : ''}`} aria-pressed={crop === c} onClick={() => setCrop(c)}><Icon name={cropIcon(c)} size={15} /> {c}</button>)}
          </div>
        </div>

        <div className="wall">
          {list.map((q, i) => (
            <article key={q.name} className={`tcard ${TINTS[i % TINTS.length]} ${i % 5 === 0 ? 'tall' : ''}`}>
              <header><span className="tc-ic"><Icon name={cropIcon(q.crop)} size={20} /></span><span className="tc-crop">{q.crop}</span><Stars v={q.rating} /></header>
              <p>{q.text}</p>
              <footer>
                <Avatar name={q.name} />
                <span><b>{q.name}</b><small>{q.place}</small></span>
              </footer>
              {q.product && <span className="tc-bought"><Icon name="check" size={12} /> Bought: {q.product}</span>}
            </article>
          ))}
        </div>

        <div className="band ts-cta">
          <div><h2>Ordered from Lakshmi Agency?</h2><p>Log in and share your experience. Your story helps other farmers choose with confidence.</p></div>
          <div className="hero-cta"><Link to="/register" className="btn lime">Create account <Icon name="arrow" size={18} /></Link><Link to="/shop" className="btn ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.4)' }}>Browse the store</Link></div>
        </div>
      </div>
    </>
  )
}
