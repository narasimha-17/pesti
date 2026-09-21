import { useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useCountUp(target, active, ms = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!active) return undefined
    if (reduced()) { setV(target); return undefined }
    let raf; const t0 = performance.now()
    const tick = (t) => { const p = Math.min((t - t0) / ms, 1); setV(target * (1 - (1 - p) ** 3)); if (p < 1) raf = requestAnimationFrame(tick) }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, active])
  return v
}

// Number that counts up the first time it scrolls into view.
export default function Stat({ to, decimals = 0, suffix = '', label }) {
  const ref = useRef(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { setSeen(true); return undefined }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.4 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  const v = useCountUp(to, seen)
  return <div ref={ref}><b>{v.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</b><span>{label}</span></div>
}
