import { useState } from 'react'
// Custom line-icon set (24×24, 1.8 stroke) + illustrated product art. No emoji anywhere in the UI.
const S = {
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
  pin: <><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
  heart: <path d="M12 20s-7.5-4.6-9-9.5C1.9 6.6 4.4 4 7.2 4c1.9 0 3.4 1 4.8 2.8C13.4 5 14.9 4 16.8 4c2.8 0 5.3 2.6 4.2 6.5-1.5 4.9-9 9.5-9 9.5z" />,
  cart: <><path d="M3 4h2.5l2.2 10.5a1 1 0 001 .8h8.6a1 1 0 001-.8L20 8H6.2" /><circle cx="9.5" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></>,
  truck: <><path d="M2 6h11v10H2zM13 9h4.5l3 3.5V16H13" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="17" cy="17.5" r="1.8" /></>,
  shield: <><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>,
  lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  headset: <><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="3" y="14" width="4" height="6" rx="1.5" /><rect x="17" y="14" width="4" height="6" rx="1.5" /><path d="M19 20c0 1.5-2 2-5 2" /></>,
  leaf: <><path d="M5 19C4 10 9 4 20 4c0 11-6 16-15 15z" /><path d="M5 19c3-5 6-8 10-10" /></>,
  sprout: <><path d="M12 21v-9" /><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z" /><path d="M12 14c0-3 2.5-5 7-5 0 3.5-3 5-7 5z" /></>,
  flask: <><path d="M9 3h6M10 3v6l-5.5 9.5A1.5 1.5 0 005.8 21h12.4a1.5 1.5 0 001.3-2.5L14 9V3" /><path d="M7.5 15h9" /></>,
  atom: <><circle cx="12" cy="12" r="1.5" /><ellipse cx="12" cy="12" rx="9" ry="3.6" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(60 12 12)" /><ellipse cx="12" cy="12" rx="9" ry="3.6" transform="rotate(120 12 12)" /></>,
  bug: <><ellipse cx="12" cy="14" rx="4.5" ry="6" /><path d="M9 8a3 3 0 016 0M3 12l4 1.5M21 12l-4 1.5M3 19l4-2M21 19l-4-2M4 6l4 3M20 6l-4 3M12 8v12" /></>,
  mushroom: <><path d="M3 12a9 8 0 0118 0z" /><path d="M9.5 12v6a2.5 2.5 0 005 0v-6" /></>,
  weed: <path d="M12 21V10M12 10C12 6 9 4 5 4c0 4 3 6 7 6zM12 13c0-3 2-5 6-5 0 3-2 5-6 5zM8 21h8" />,
  drop: <path d="M12 3s6 6.5 6 11a6 6 0 01-12 0c0-4.5 6-11 6-11z" />,
  tractor: <><circle cx="7" cy="17" r="3.5" /><circle cx="18" cy="18" r="2.2" /><path d="M10.5 17H16M3.5 17V9h6l2 5h5.5M9 9V5h3" /></>,
  spray: <><rect x="6" y="10" width="9" height="11" rx="2" /><path d="M9 10V6h5l3-2M19 7h2M19 10h2M18 13h2" /></>,
  glove: <path d="M7 21v-6l-2-4a1.3 1.3 0 012.3-1L9 13V5a1.3 1.3 0 012.6 0v5-6a1.3 1.3 0 012.6 0v6-4a1.3 1.3 0 012.6 0v9c0 3-2 6-5 6z" />,
  seed: <><path d="M12 3c4 3 6 6 6 10a6 6 0 01-12 0c0-4 2-7 6-10z" /><path d="M12 9v9" /></>,
  box: <path d="M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8" />,
  book: <path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 21V5M8 7h7" />,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  flame: <path d="M12 3c1 4 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z" />,
  tag: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.3" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeoff: <><path d="M3 3l18 18" /><path d="M10.6 5.1A10 10 0 0112 5c6 0 10 7 10 7a17 17 0 01-3.2 4M6.6 6.6A17 17 0 002 12s4 7 10 7c1.6 0 3-.4 4.3-1" /><path d="M9.9 9.9a3 3 0 004.2 4.2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  home: <path d="M3 11l9-8 9 8v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" />,
  filter: <path d="M3 5h18l-7 8v6l-4 2v-8z" />,
  grid: <><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>,
  list: <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />,
  arrow: <path d="M4 12h16M14 6l6 6-6 6" />,
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" />,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />,
  bell: <path d="M6 16V11a6 6 0 0112 0v5l2 2H4zM10 21h4" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.01" /></>,
  warn: <path d="M12 3l10 18H2zM12 10v5M12 18v.01" />,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  // crops
  paddy: <><path d="M12 21V8" /><path d="M12 8c-2-1-3-3-3-5 2 1 3 3 3 5zM12 8c2-1 3-3 3-5-2 1-3 3-3 5zM12 13c-2-1-4-2-4-4 2 0 4 1 4 4zM12 13c2-1 4-2 4-4-2 0-4 1-4 4zM12 18c-2-1-4-2-4-4 2 0 4 1 4 4zM12 18c2-1 4-2 4-4-2 0-4 1-4 4z" /></>,
  cotton: <><circle cx="8.5" cy="10" r="3.2" /><circle cx="15.5" cy="10" r="3.2" /><circle cx="12" cy="6.5" r="3.2" /><path d="M6 14.5l6 6.5 6-6.5M12 13v8" /></>,
  chilli: <><path d="M6 6c6-2 13 1 13 8 0 4-2 6-5 7 2-3 1-6-2-8-2-1-4-2-6-7z" /><path d="M6 6L4 3.5" /></>,
  tomato: <><circle cx="12" cy="13.5" r="7.5" /><path d="M8 7l4 2 4-2M12 9V4.5" /></>,
  maize: <><path d="M12 3c4 3 5 9 4 15l-4 3-4-3c-1-6 0-12 4-15z" /><path d="M12 6v14M9 10h6M9 14h6" /></>,
  groundnut: <path d="M9 3a4 4 0 00-4 4c0 2 1 3 2 4-1 1-2 2-2 4a5 5 0 0010 0c0-2-1-3-2-4 1-1 2-2 2-4a4 4 0 00-6-4z" transform="rotate(30 12 12)" />,
  soybean: <><path d="M4 15c0-6 5-11 15-11 0 8-4 14-11 14-2 0-4-1-4-3z" /><circle cx="10" cy="12" r="1.2" /><circle cx="14" cy="9" r="1.2" /></>,
  sugarcane: <><path d="M9 21L15 3M8.5 15.5l3.5-1M10.5 10l3.5-1M12.5 5l3-1" /><path d="M15 3c2 1 4 3 5 6M15 3c-2 0-4 1-5 3" /></>,
  vegetables: <><circle cx="8" cy="9" r="3.5" /><circle cx="16" cy="9" r="3.5" /><circle cx="12" cy="6" r="3.5" /><path d="M12 10v11M9 21h6" /></>,
  fruits: <path d="M12 8c-3-2-8-1-8 5 0 4 3 8 6 8 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-4 6-8 0-6-5-7-8-5zM12 8c0-2 1-4 3-5" />,
  other: <><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></>,
}

export default function Icon({ name, size = 20, fill = false, className = '', style, ...rest }) {
  return (
    <svg className={`ic ${className}`} width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style} {...rest}>
      {S[name] || S.leaf}
    </svg>
  )
}

export const Logo = ({ light }) => (
  <span className={`logo ${light ? 'light' : ''}`}>
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true"><rect width="34" height="34" rx="11" fill="#b6e04a" /><path d="M9 25c-1-9 4-15 16-15 0 11-6 16-16 15z" fill="#0d3b26" /><path d="M9 25c4-6 8-10 12-12" stroke="#b6e04a" strokeWidth="1.8" strokeLinecap="round" fill="none" /></svg>
    <span>Agri<em>Mart</em></span>
  </span>
)

// ---------- Product pack-shot illustrations ----------
const TONE = {
  insecticides: ['#f97316', '#ffedd5'], fungicides: ['#0e7490', '#cffafe'], herbicides: ['#ca8a04', '#fef9c3'], fertilizers: ['#15803d', '#dcfce7'],
  'bio-pesticides': ['#65a30d', '#ecfccb'], 'growth-promoters': ['#0d9488', '#ccfbf1'], micronutrients: ['#7c3aed', '#ede9fe'], seeds: ['#a16207', '#fef3c7'],
  'crop-protection': ['#1d4ed8', '#dbeafe'], 'farm-equipment': ['#475569', '#e2e8f0'], sprayers: ['#0369a1', '#e0f2fe'], accessories: ['#be123c', '#ffe4e6'],
}
const lines = (name, max = 13) => {
  const out = []; let cur = ''
  name.split(' ').forEach((w) => { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w } else cur = (cur + ' ' + w).trim() })
  out.push(cur); return out.slice(0, 3)
}
const isLiquid = (p) => ['SC', 'SL', 'EC', 'Liquid'].includes(p.formulation)

function ProductArtSvg({ p, className = '', fit = 'meet' }) {
  const [c, bg] = TONE[p.category] || TONE.fertilizers
  const ls = lines(p.name, isLiquid(p) ? 10 : 13)
  const label = (x, y, w, fs = 8) => (
    <g>
      <rect x={x} y={y} width={w} height="56" rx="6" fill="#fff" />
      <rect x={x} y={y} width={w} height="9" rx="4" fill={c} />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fontSize={fs > 7 ? 6.5 : 5.5} fontWeight="700" fill={c} letterSpacing=".5">{p.brand.toUpperCase().slice(0, 14)}</text>
      {ls.map((l, i) => <text key={i} x={x + w / 2} y={y + 33 + i * 9} textAnchor="middle" fontSize={fs} fontWeight="700" fill="#14231a">{l}</text>)}
    </g>
  )
  let art
  if (p.category === 'sprayers' || p.category === 'farm-equipment') {
    art = <g><circle cx="100" cy="98" r="62" fill="none" stroke={c} strokeOpacity=".25" strokeWidth="2" strokeDasharray="3 6" /><circle cx="100" cy="100" r="48" fill={c} /><circle cx="100" cy="100" r="48" fill="url(#pgloss)" /><g transform="translate(70 70) scale(2.5)" color="#fff"><Icon name={p.category === 'sprayers' ? 'spray' : 'tractor'} size={24} style={{ overflow: 'visible' }} /></g><circle cx="150" cy="56" r="6" fill="#fff" /><circle cx="52" cy="142" r="4" fill={c} opacity=".5" /></g>
  } else if (p.category === 'accessories') {
    art = <g><circle cx="100" cy="98" r="62" fill="none" stroke={c} strokeOpacity=".25" strokeWidth="2" strokeDasharray="3 6" /><circle cx="100" cy="100" r="48" fill={c} /><circle cx="100" cy="100" r="48" fill="url(#pgloss)" /><g transform="translate(70 70) scale(2.5)" color="#fff"><Icon name={'glove'} size={24} style={{ overflow: 'visible' }} /></g><circle cx="150" cy="56" r="6" fill="#fff" /><circle cx="52" cy="142" r="4" fill={c} opacity=".5" /></g>
  } else if (p.category === 'fertilizers' && !isLiquid(p) && p.formulation !== 'Powder') {
    art = <g><path d="M52 62c0-8 96-8 96 0l6 98c0 8-108 8-108 0z" fill={c} /><path d="M52 62c10 8 86 8 96 0" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="3" />{label(64, 84, 72)}</g>
  } else if (p.category === 'seeds') {
    art = <g><rect x="56" y="42" width="88" height="126" rx="8" fill={c} /><path d="M56 56h88" stroke="#fff" strokeOpacity=".5" strokeDasharray="4 3" /><path d="M100 76c14 8 22 20 22 34a22 22 0 01-44 0c0-14 8-26 22-34z" fill="#fff" opacity=".9" /><path d="M100 88v34" stroke={c} strokeWidth="3" />{label(64, 130, 72)}</g>
  } else if (isLiquid(p) || p.category === 'growth-promoters') {
    art = <g><rect x="86" y="34" width="28" height="18" rx="3" fill="#14231a" /><path d="M88 52h24l22 20v88a10 10 0 01-10 10H76a10 10 0 01-10-10V72z" fill={c} />{label(72, 94, 56, 6.6)}<path d="M72 80v70" stroke="#fff" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" /></g>
  } else {
    art = <g><path d="M60 50l8 6h64l8-6 4 110a8 8 0 01-8 8H64a8 8 0 01-8-8z" fill={c} /><path d="M60 50h80" stroke="#fff" strokeOpacity=".5" strokeWidth="2" strokeDasharray="4 3" />{label(70, 92, 60)}</g>
  }
  return (
    <svg className={`art ${className}`} viewBox="0 0 200 200" role="img" aria-label={p.name} preserveAspectRatio={`xMidYMid ${fit}`}>
      <defs><radialGradient id="pgloss" cx=".3" cy=".25" r=".9"><stop offset="0" stopColor="#fff" stopOpacity=".35" /><stop offset="1" stopColor="#000" stopOpacity=".18" /></radialGradient></defs>
      <rect width="200" height="200" fill={bg} />
      <circle cx="165" cy="35" r="46" fill="#fff" opacity=".45" /><circle cx="30" cy="175" r="38" fill={c} opacity=".08" />
      <ellipse cx="100" cy="172" rx="52" ry="7" fill="#14231a" opacity=".12" />
      {art}
    </svg>
  )
}

// Shows a real photo from /img/products/<slug>.jpg (or p.image) when one exists, otherwise the illustrated pack.
export function ProductArt({ p, className = '', fit = 'meet' }) {
  const [broken, setBroken] = useState(false)
  if (broken) return <ProductArtSvg p={p} className={className} fit={fit} />
  return <img className={`art photo ${className}`} src={p.image || `/img/products/${p.slug}.jpg`} alt={p.name} loading="lazy" onError={() => setBroken(true)} />
}

// ---------- Hero scene: layered fields, sun, crop rows ----------
export function HeroScene({ tone = 'green' }) {
  const t = { green: ['#e9f7b7', '#8cc63f', '#3f9a2e', '#1f7a3f', '#14532d'], orange: ['#ffe7c2', '#f6a04a', '#d9711b', '#a94c12', '#7a3208'], brown: ['#f5e6c8', '#c49a5b', '#9a6b33', '#6f4a22', '#4a2f12'] }[tone] || []
  const rows = (y, col, n, h) => Array.from({ length: n }, (_, i) => <path key={i} d={`M${i * (600 / n) + 10} ${y + h}q3-${h} 8-${h}q-2 ${h * 0.6}-8 ${h}`} fill={col} />)
  return (
    <svg className="scene" viewBox="0 0 600 460" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="600" height="460" fill={t[0]} />
      <circle cx="450" cy="120" r="62" fill="#fff" opacity=".7" /><circle cx="450" cy="120" r="40" fill={t[1]} />
      <path d="M0 250C120 200 240 240 360 215S540 190 600 220V460H0z" fill={t[1]} />
      <path d="M0 300C140 250 260 300 400 270S540 260 600 280V460H0z" fill={t[2]} />
      {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M-20 ${330 + i * 28}Q300 ${290 + i * 28} 620 ${335 + i * 28}`} stroke={t[3]} strokeWidth="2" fill="none" opacity=".5" />)}
      <g opacity=".95">{rows(318, t[4], 22, 20)}{rows(352, t[4], 18, 26)}{rows(392, t[4], 14, 34)}</g>
      <path d="M0 430h600v30H0z" fill={t[4]} />
    </svg>
  )
}
