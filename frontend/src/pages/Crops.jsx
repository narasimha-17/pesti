import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import Icon from '../components/Icon'
import { crops, products } from '../data/mock'
import { photo } from '../lib/photos'

const SEASONS = [['all', 'All crops'], ['kharif', 'Kharif'], ['rabi', 'Rabi'], ['year', 'Year-round']]
const TONES = ['#0f5b3e', '#8a4210', '#1c3f6e', '#5b3a8a', '#0d6b6b', '#7a5a08']

export function ShopByCrop() {
  const [q, setQ] = useState('')
  const [s, setS] = useState('all')
  const list = crops.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase()) &&
    (s === 'all' || (s === 'year' ? /all season|annual|perennial/i.test(c.season) : c.season.toLowerCase().includes(s))))
  const total = (slug) => products.filter((p) => p.crops.includes(slug)).length

  return (
    <>
      <section className="cp-hero">
        <div className="container">
          <span className="eyebrow" style={{ color: 'var(--lime)' }}>Crop-first shopping</span>
          <h1>What are you growing?</h1>
          <p>Choose a crop to see the seeds, nutrition and protection products used for it.</p>
          <div className="cp-tools">
            <label className="cp-search glass"><Icon name="search" size={18} /><span className="sr-only">Search crops</span><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search crops, e.g. paddy" /></label>
            <div className="cp-seasons" role="group" aria-label="Season">
              {SEASONS.map(([k, l]) => <button key={k} className={`glass ${s === k ? 'on' : ''}`} aria-pressed={s === k} onClick={() => setS(k)}>{l}</button>)}
            </div>
          </div>
        </div>
      </section>

      <div className="container cp-wrap">
        {list.length === 0 ? <div className="empty"><div className="ib"><Icon name="search" size={38} /></div><h3>No crops match</h3><div className="muted">Try a different name or season.</div></div> : (
          <div className="cp-grid">
            {list.map((c, i) => {
              const img = photo(c.slug)
              return (
                <Link key={c.slug} to={`/products?crop=${c.slug}`} className="gcard" style={{ '--t': TONES[i % TONES.length] }}>
                  {img && <img src={img} alt="" loading="lazy" />}
                  <span className="gicon"><Icon name={c.icon} size={26} /></span>
                  <span className="gtag glass">{c.season}</span>
                  <div className="gbody"><h3>{c.name}</h3><span>{total(c.slug)} {total(c.slug) === 1 ? 'product' : 'products'}</span></div>
                  <span className="garrow glass"><Icon name="arrow" size={18} /></span>
                </Link>
              )
            })}
          </div>
        )}
        <p className="muted" style={{ fontSize: '.8rem', margin: '26px 0 0' }}>Photos courtesy of Wikimedia Commons contributors. <Link to="/credits" style={{ textDecoration: 'underline' }}>Photo credits</Link></p>
      </div>
    </>
  )
}

export { default as CropAssistant } from './CropAssistant'
