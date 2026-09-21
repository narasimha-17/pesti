import { useRef } from 'react'
import { Link } from 'react-router-dom'
import Icon from './Icon'

// Horizontal scroll-snap rail with arrow buttons (desktop) and native swipe (touch).
export default function Rail({ eyebrow, title, to, cta = 'View all', aside, children, className = '' }) {
  const ref = useRef(null)
  const go = (dir) => ref.current?.scrollBy({ left: dir * Math.max(ref.current.clientWidth * 0.8, 260), behavior: 'smooth' })
  return (
    <section className={`rail-sec ${className}`}>
      <div className="container">
        <div className="rail-head">
          <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2>{title}</h2></div>
          {aside}
          <div className="rail-nav">
            {to && <Link className="link-arrow" to={to}>{cta} <Icon name="arrow" size={16} /></Link>}
            <button onClick={() => go(-1)} aria-label="Scroll left"><Icon name="arrow" size={18} style={{ transform: 'scaleX(-1)' }} /></button>
            <button onClick={() => go(1)} aria-label="Scroll right"><Icon name="arrow" size={18} /></button>
          </div>
        </div>
        <div className="rail" ref={ref} tabIndex={0} aria-label={title}>{children}</div>
      </div>
    </section>
  )
}
