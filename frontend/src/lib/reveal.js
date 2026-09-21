// Scroll-reveal: elements fade/rise into view with a small stagger. Skipped for reduced-motion users.
const SEL = [
  '.section-head', '.card', '.pcard', '.tile', '.promo', '.lp-step', '.lp-feat', '.lp-cat', '.quote', '.article',
  '.lp-faq details', '.pl-card', '.band', '.trust > div', '.lp-stats .container > div', '.brands span', '.summary', '.planner',
].join(',')

export function initReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      const el = e.target
      io.unobserve(el)
      el.classList.add('rv-in')
      const delay = parseInt(el.style.getPropertyValue('--d'), 10) || 0
      // hand transitions back to the element's own styles (hover effects etc.)
      setTimeout(() => el.classList.remove('rv', 'rv-in'), 900 + delay)
    })
  }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' })

  const scan = () => {
    document.querySelectorAll(SEL).forEach((el) => {
      if (el.dataset.rv || el.closest('.modal, .suggest, .hero, .auth, .toasts')) return
      el.dataset.rv = '1'
      const i = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0
      el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`)
      el.classList.add('rv')
      io.observe(el)
    })
  }
  let queued = false
  const queue = () => { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; scan() }) }
  scan()
  new MutationObserver(queue).observe(document.getElementById('root'), { childList: true, subtree: true })
}
