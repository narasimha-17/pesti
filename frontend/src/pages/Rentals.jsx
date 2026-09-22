import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { inr } from '../lib/api'
import { useApp } from '../lib/store'
import { Empty, Field, Modal, SectionHead, Stars } from '../components/ui'
import Icon from '../components/Icon'

// Demo catalogue: farm equipment available for rent, priced per day. A real deployment would
// pull this from the backend (stock, live availability by depot) alongside the purchase catalog.
export const EQUIPMENT = [
  { id: 'tractor-35hp', name: 'Tractor (35 HP)', icon: 'tractor', unit: 'day', rate: 1800, deposit: 3000, rating: 4.6, reviews: 58,
    images: ['/img/cats/farm-equipment.jpg', '/img/cats/sprayers.jpg'],
    desc: 'Mahindra-class 35 HP tractor with driver on request. Fits ploughing, tilling and trolley haulage.',
    details: 'A well-maintained 35 HP tractor suited for medium land holdings — ploughing, harrowing, puddling and trolley haulage. Diesel and driver charges are separate unless a driver is requested at booking. Delivered to your field with a basic operational walkthrough.',
    specs: [['Power', '35 HP'], ['Fuel', 'Diesel'], ['Attachment compatibility', '3-point linkage, PTO'], ['Driver available', 'On request, extra charge']],
    people: [['Ramesh R.', 5, 'On time delivery, tractor was in great condition.'], ['Sunita K.', 4, 'Good machine, driver was helpful.']] },
  { id: 'mini-tiller', name: 'Mini Power Tiller', icon: 'tractor', unit: 'day', rate: 650, deposit: 1500, rating: 4.4, reviews: 31,
    images: ['/img/cats/farm-equipment.jpg'],
    desc: '7 HP petrol tiller, ideal for small plots and kitchen-garden prep.',
    details: 'Lightweight 7 HP petrol tiller for small and medium plots, kitchen gardens and inter-row cultivation. Easy to operate, low fuel consumption.',
    specs: [['Power', '7 HP petrol'], ['Working width', '450–600 mm'], ['Best for', 'Plots under 2 acres']],
    people: [['Venkatesh P.', 4, 'Worked well for my half-acre plot.']] },
  { id: 'rotavator-6ft', name: 'Rotavator (6 ft)', icon: 'tractor', unit: 'day', rate: 900, deposit: 2000, rating: 4.5, reviews: 22,
    images: ['/img/cats/farm-equipment.jpg'],
    desc: 'PTO-driven rotavator attachment for fine seedbed preparation.',
    details: 'A 6 ft PTO-driven rotavator that pulverises soil in a single pass, giving a fine seedbed. Requires a compatible tractor with PTO — pair with our tractor rental for a combined rate.',
    specs: [['Width', '6 ft'], ['Drive', 'PTO (tractor-mounted)'], ['Blades', '42']],
    people: [['Lakshmi D.', 5, 'Seedbed was ready in half the usual time.']] },
  { id: 'battery-sprayer', name: 'Power Sprayer (Battery, 16 L)', icon: 'spray', unit: 'day', rate: 250, deposit: 800, rating: 4.3, reviews: 74,
    images: ['/img/cats/sprayers.jpg'],
    desc: 'Battery-operated knapsack sprayer, up to 6 hours backup.',
    details: 'Battery-operated 16 L knapsack sprayer with adjustable nozzle, up to 6 hours of backup on a full charge. Comes with a spare nozzle and charger.',
    specs: [['Capacity', '16 L'], ['Battery backup', 'Up to 6 hours'], ['Nozzle', 'Adjustable, spare included']],
    people: [['Ramesh R.', 4, 'Battery lasted the full day of spraying.']] },
  { id: 'boom-sprayer', name: 'Boom Sprayer (Tractor-mounted)', icon: 'spray', unit: 'day', rate: 1200, deposit: 2500, rating: 4.5, reviews: 19,
    images: ['/img/cats/sprayers.jpg', '/img/cats/farm-equipment.jpg'],
    desc: '12 m boom, covers up to 8 acres a day.',
    details: '12 m boom sprayer, tractor-mounted, covers up to 8 acres a day with even coverage. Requires a compatible tractor.',
    specs: [['Boom width', '12 m'], ['Tank capacity', '400 L'], ['Coverage', 'Up to 8 acres/day']],
    people: [['Sunita K.', 5, 'Saved a lot of time compared to manual spraying.']] },
  { id: 'combine-harvester', name: 'Combine Harvester', icon: 'tractor', unit: 'day', rate: 4500, deposit: 8000, rating: 4.7, reviews: 40,
    images: ['/img/cats/farm-equipment.jpg'],
    desc: 'Self-propelled combine for paddy and wheat harvesting.',
    details: 'Self-propelled combine harvester for paddy and wheat, with grain tank and straw management. Operator included.',
    specs: [['Crop types', 'Paddy, wheat'], ['Operator', 'Included'], ['Cutting width', '14 ft']],
    people: [['Venkatesh P.', 5, 'Harvested 5 acres in a day, minimal grain loss.']] },
  { id: 'water-pump', name: 'Water Pump Set (5 HP diesel)', icon: 'drop', unit: 'day', rate: 400, deposit: 1000, rating: 4.2, reviews: 27,
    images: ['/img/cats/farm-equipment.jpg'],
    desc: 'Portable diesel pump set for field irrigation.',
    details: 'Portable 5 HP diesel pump set for field irrigation, easy to move between plots. Diesel not included.',
    specs: [['Power', '5 HP diesel'], ['Discharge', 'Up to 1000 LPM'], ['Portable', 'Yes']],
    people: [['Lakshmi D.', 4, 'Reliable, started on the first pull.']] },
  { id: 'seed-drill', name: 'Seed Drill (9-row)', icon: 'seed', unit: 'day', rate: 700, deposit: 1500, rating: 4.4, reviews: 15,
    images: ['/img/cats/seeds.jpg', '/img/cats/farm-equipment.jpg'],
    desc: 'Tractor-mounted seed-cum-fertilizer drill.',
    details: 'A 9-row tractor-mounted seed-cum-fertilizer drill for even spacing and depth control across the field.',
    specs: [['Rows', '9'], ['Function', 'Seed + fertilizer'], ['Drive', 'Tractor-mounted']],
    people: [['Ramesh R.', 4, 'Even spacing, good germination this season.']] },
]

export function BookingForm({ item, onClose }) {
  const { user, toast } = useApp()
  const [f, setF] = useState({ from: '', to: '', pincode: '', name: user?.name || '', phone: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const days = f.from && f.to ? Math.max(1, Math.round((new Date(f.to) - new Date(f.from)) / 864e5) + 1) : 1
  const submit = (e) => {
    e.preventDefault()
    toast(`Rental request sent for ${item.name} — our team will call to confirm pickup/delivery.`)
    onClose()
  }
  return (
    <Modal onClose={onClose} label={`Book ${item.name}`}>
      <h3>Book {item.name}</h3>
      <p className="muted" style={{ marginTop: -6 }}>{inr(item.rate)}/{item.unit} · refundable deposit {inr(item.deposit)}</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div className="grid g-2">
          <Field label="From date"><input required type="date" value={f.from} onChange={set('from')} /></Field>
          <Field label="To date"><input required type="date" value={f.to} onChange={set('to')} /></Field>
        </div>
        <Field label="Delivery pincode"><input required inputMode="numeric" pattern="[0-9]{6}" value={f.pincode} onChange={set('pincode')} /></Field>
        <div className="grid g-2">
          <Field label="Your name"><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Mobile number"><input required inputMode="numeric" pattern="[6-9][0-9]{9}" value={f.phone} onChange={set('phone')} /></Field>
        </div>
        <div className="notice info"><Icon name="info" size={18} />Estimated {days} day{days > 1 ? 's' : ''} · {inr(item.rate * days)} rental + {inr(item.deposit)} deposit (refunded on return, subject to inspection).</div>
        <button className="btn">Request booking</button>
      </form>
    </Modal>
  )
}

export default function Rentals() {
  const { user } = useApp()
  const nav = useNavigate()
  const [picked, setPicked] = useState(null)
  const book = (it) => (user ? setPicked(it) : nav('/login?next=/rentals'))
  return (
    <div className="container section">
      <SectionHead eyebrow="Farm machinery" title="Equipment for rent" />
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>Rent tractors, tillers, sprayers and harvesters by the day. Delivery and pickup arranged at your village. Demo rates — final pricing is confirmed on call.</p>
      <div className="grid g-3">
        {EQUIPMENT.map((it) => (
          <Link key={it.id} to={`/rentals/${it.id}`} className="card pad" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="ib"><Icon name={it.icon} size={30} /></div>
            <h3 style={{ margin: 0 }}>{it.name}</h3>
            <Stars v={it.rating} n={it.reviews} />
            <p className="muted" style={{ margin: 0, flex: 1 }}>{it.desc}</p>
            <div className="pline"><span className="price">{inr(it.rate)}</span><span className="muted">/{it.unit}</span></div>
            <div className="muted" style={{ fontSize: '.85rem' }}>Deposit {inr(it.deposit)} (refundable)</div>
            <button className="btn block" onClick={(e) => { e.preventDefault(); book(it) }}>Book rental</button>
          </Link>
        ))}
      </div>
      {picked && <BookingForm item={picked} onClose={() => setPicked(null)} />}
    </div>
  )
}

export function RentalDetail() {
  const { id } = useParams()
  const { user } = useApp()
  const nav = useNavigate()
  const [img, setImg] = useState(0)
  const [picked, setPicked] = useState(false)
  const item = EQUIPMENT.find((x) => x.id === id)
  if (!item) return <div className="container"><Empty icon="search" title="Equipment not found"><Link to="/rentals">Browse rentals</Link></Empty></div>
  const book = () => (user ? setPicked(true) : nav('/login?next=/rentals'))
  return (
    <div className="container">
      <div className="crumbs"><Link to="/rentals">Rentals</Link><Icon name="arrow" size={12} /><span>{item.name}</span></div>
      <div className="pd">
        <div>
          <div className="gal"><img src={item.images[img]} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          {item.images.length > 1 && (
            <div className="chips" style={{ marginTop: 10 }}>
              {item.images.map((src, i) => <button key={src} className={`chip ${i === img ? 'on' : ''}`} onClick={() => setImg(i)}><img src={src} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 6, verticalAlign: 'middle' }} /></button>)}
            </div>
          )}
        </div>
        <div>
          <span className="badge">Farm machinery</span>
          <h1 style={{ fontSize: 'clamp(1.8rem,3vw,2.5rem)', marginTop: 10 }}>{item.name}</h1>
          <Stars v={item.rating} n={item.reviews} />
          <div style={{ margin: '20px 0' }}>
            <span className="price" style={{ fontSize: '2.2rem' }}>{inr(item.rate)}</span><span className="muted">/{item.unit}</span>
            <div className="muted" style={{ fontSize: '.8rem' }}>Refundable deposit {inr(item.deposit)}</div>
          </div>
          <p>{item.desc}</p>
          <button className="btn" onClick={book}><Icon name="tractor" size={18} /> Book rental</button>
        </div>
      </div>

      <div className="card specs">
        {item.specs.map(([k, v]) => <div key={k}><small>{k}</small>{v}</div>)}
      </div>

      <div className="card pad" style={{ marginTop: 16 }}>
        <h3>Description</h3>
        <p>{item.details}</p>
      </div>

      <div className="card pad" style={{ marginTop: 16 }}>
        <h3>Reviews</h3>
        <Stars v={item.rating} n={item.reviews} />
        {item.people.map(([n, r, t]) => (
          <div key={n} style={{ borderTop: '1px solid var(--line)', marginTop: 14, paddingTop: 12 }}>
            <b>{n}</b> <span className="badge"><Icon name="check" size={12} /> Verified renter</span>
            <div><Stars v={r} /></div>
            <p style={{ margin: 0 }}>{t}</p>
          </div>
        ))}
      </div>

      {picked && <BookingForm item={item} onClose={() => setPicked(false)} />}
    </div>
  )
}
