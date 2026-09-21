import { useState } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Typical windows for south/central India (0 = January). Real values come from the admin-managed crop calendar.
const CROPS = {
  paddy: { name: 'Paddy', sow: [5, 6], grow: [7, 8], harvest: [9, 10] },
  cotton: { name: 'Cotton', sow: [4, 6], grow: [7, 9], harvest: [10, 11] },
  chilli: { name: 'Chilli', sow: [5, 7], grow: [8, 10], harvest: [11, 11] },
  tomato: { name: 'Tomato', sow: [6, 7], grow: [8, 9], harvest: [10, 11] },
  maize: { name: 'Maize', sow: [5, 6], grow: [7, 8], harvest: [9, 9] },
  groundnut: { name: 'Groundnut', sow: [5, 6], grow: [7, 8], harvest: [9, 9] },
  soybean: { name: 'Soybean', sow: [5, 6], grow: [7, 8], harvest: [9, 9] },
  sugarcane: { name: 'Sugarcane', sow: [1, 2], grow: [3, 10], harvest: [11, 11] },
}

const STATUS = {
  sow: { label: 'Sow now', tip: 'Plant seeds now. Keep good seed and basic fertilizer ready.', cta: 'Shop seeds & fertilizer' },
  grow: { label: 'Growing', tip: 'The crop is growing. Feed it and check the leaves often for pests or disease.', cta: 'Shop crop care' },
  harvest: { label: 'Harvest now', tip: 'Harvest time. Keep tools ready and plan safe storage.', cta: 'Shop tools & equipment' },
  off: { label: 'Off season', tip: 'No field work needed this month.', cta: 'Browse products' },
}
const ORDER = { sow: 0, harvest: 1, grow: 2, off: 3 }
const inRange = (m, [a, b]) => m >= a && m <= b
const statusOf = (c, m) => (inRange(m, c.sow) ? 'sow' : inRange(m, c.harvest) ? 'harvest' : inRange(m, c.grow) ? 'grow' : 'off')
const range = ([a, b]) => (a === b ? MONTHS[a] : `${MONTHS[a]} to ${MONTHS[b]}`)

export default function SeasonPlanner() {
  const now = new Date().getMonth()
  const [month, setMonth] = useState(now)
  const [filter, setFilter] = useState('all')

  const rows = Object.entries(CROPS).map(([slug, c]) => ({ slug, c, s: statusOf(c, month) })).sort((a, b) => ORDER[a.s] - ORDER[b.s])
  const count = (k) => rows.filter((r) => r.s === k).length
  const shown = filter === 'all' ? rows : rows.filter((r) => r.s === filter)
  const chips = [['all', 'All', rows.length], ['sow', 'Sow now', count('sow')], ['grow', 'Growing', count('grow')], ['harvest', 'Harvest now', count('harvest')]]

  return (
    <div className="planner">
      <div className="pl-months" role="radiogroup" aria-label="Choose a month">
        {MONTHS.map((m, i) => (
          <button key={m} role="radio" aria-checked={i === month} className={i === month ? 'on' : ''} onClick={() => setMonth(i)}>{m}{i === now && <small>Now</small>}</button>
        ))}
      </div>

      <div className="pl-bar">
        <h3>{FULL[month]}: {count('sow') ? `${count('sow')} to sow` : 'nothing to sow'}{count('harvest') ? `, ${count('harvest')} to harvest` : ''}</h3>
        <div className="pl-filters" role="group" aria-label="Filter crops">
          {chips.map(([k, l, n]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l} <b>{n}</b></button>)}
        </div>
      </div>

      <div className="pl-grid">
        {shown.map(({ slug, c, s }) => {
          const st = STATUS[s]
          return (
            <article key={slug} className={`pl-card ${s}`}>
              <div className="pl-top"><span className={`pl-tag ${s}`}>{st.label}</span><span className="pl-ic"><Icon name={slug} size={30} /></span></div>
              <h4>{c.name}</h4>
              <p>{st.tip}</p>
              <div className="pl-strip" role="img" aria-label={`Sow ${range(c.sow)}, harvest ${range(c.harvest)}`}>
                {MONTHS.map((m, i) => {
                  const k = inRange(i, c.sow) ? 'sow' : inRange(i, c.harvest) ? 'harvest' : inRange(i, c.grow) ? 'grow' : 'off'
                  return <i key={m} className={`${k} ${i === month ? 'cur' : ''}`}><em>{m[0]}</em></i>
                })}
              </div>
              <div className="pl-when"><span><small>Sow</small>{range(c.sow)}</span><span><small>Harvest</small>{range(c.harvest)}</span></div>
              <Link to={`/products?crop=${slug}`} className="pl-cta">{st.cta} <Icon name="arrow" size={15} /></Link>
            </article>
          )
        })}
      </div>

      <div className="pl-key"><span><i className="sow" />Sowing</span><span><i className="grow" />Growing</span><span><i className="harvest" />Harvest</span><span className="muted">Typical months. Your dates depend on your area, rain and variety. Ask your local agriculture office.</span></div>
    </div>
  )
}
