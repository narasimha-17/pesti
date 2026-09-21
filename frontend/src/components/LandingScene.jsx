import { useRef } from 'react'
import { products } from '../data/mock'
import Icon, { ProductArt } from './Icon'

const ROWS = [
  { y: 392, n: 12, s: 0.62, c: '#4aa85a' },
  { y: 432, n: 10, s: 0.82, c: '#348f49' },
  { y: 484, n: 8, s: 1.05, c: '#237a3b' },
  { y: 545, n: 6, s: 1.4, c: '#186a31' },
]
const pack = (id) => products.find((p) => p.id === id)

function Plant({ x, y, s, c, delay }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <g className="sway" style={{ animationDelay: `${delay}s` }}>
        <path d="M0 0V-34" stroke={c} strokeWidth="3" strokeLinecap="round" />
        <path d="M0 -12C-16 -14 -21 -27 -19 -34C-8 -30 -2 -22 0 -12Z" fill={c} />
        <path d="M0 -18C16 -20 21 -33 19 -40C8 -36 2 -28 0 -18Z" fill={c} opacity=".92" />
        <path d="M0 -30C-9 -36 -8 -46 -3 -52C4 -46 4 -37 0 -30Z" fill={c} />
      </g>
    </g>
  )
}

// Illustrated field with pointer parallax (--mx/--my set on the wrapper).
export default function LandingScene() {
  const ref = useRef(null)
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5) * 2)
    ref.current.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5) * 2)
  }
  const reset = () => { ref.current.style.setProperty('--mx', 0); ref.current.style.setProperty('--my', 0) }

  return (
    <div className="lx-scene" ref={ref} onMouseMove={onMove} onMouseLeave={reset}>
      <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe9a8" /><stop offset=".55" stopColor="#e8f6b8" /><stop offset="1" stopColor="#c8ec9c" /></linearGradient></defs>
        <rect width="800" height="600" fill="url(#sky)" />
        <g className="px px-a">
          <circle cx="600" cy="120" r="78" fill="#fff" opacity=".35" />
          <g className="rays" style={{ transformOrigin: '600px 120px' }}>
            {Array.from({ length: 14 }, (_, i) => <line key={i} x1="600" y1="28" x2="600" y2="44" stroke="#ffc94a" strokeWidth="5" strokeLinecap="round" transform={`rotate(${i * (360 / 14)} 600 120)`} />)}
          </g>
          <circle cx="600" cy="120" r="46" fill="#ffc94a" />
          <g className="cloud c1" fill="#fff" opacity=".9"><ellipse cx="120" cy="96" rx="46" ry="16" /><ellipse cx="152" cy="84" rx="32" ry="18" /><ellipse cx="94" cy="88" rx="26" ry="13" /></g>
          <g className="cloud c2" fill="#fff" opacity=".75"><ellipse cx="60" cy="170" rx="38" ry="12" /><ellipse cx="88" cy="160" rx="26" ry="14" /></g>
        </g>
        <g className="px px-b"><path d="M-40 306C100 236 230 282 350 252S600 214 860 282V620H-40Z" fill="#9fd66f" /></g>
        <g className="px px-c"><path d="M-40 350C140 292 300 350 470 316S720 296 860 340V620H-40Z" fill="#62b856" /></g>
        <g className="px px-d">
          <path d="M-40 384C200 350 430 396 860 362V620H-40Z" fill="#2f8a47" />
          {ROWS.map((r, ri) => Array.from({ length: r.n }, (_, i) => (
            <Plant key={`${ri}-${i}`} x={(i + 0.5) * (800 / r.n) + (ri % 2 ? -22 : 10)} y={r.y} s={r.s} c={r.c} delay={((i * 0.17 + ri * 0.45) % 2.4).toFixed(2)} />
          )))}
        </g>
      </svg>
      <div className="lx-pack p1"><ProductArt p={pack(1)} /></div>
      <div className="lx-pack p2"><ProductArt p={pack(7)} /></div>
      <div className="lx-pack p3"><ProductArt p={pack(9)} /></div>
      <div className="float f1"><span className="dot"><Icon name="truck" size={18} /></span><div>Delivery in 3 days<small>to Guntur, 522001</small></div></div>
      <div className="float f2"><span className="dot"><Icon name="shield" size={18} /></span><div>100% genuine<small>invoice with every order</small></div></div>
    </div>
  )
}
