// Minimal service worker: cache the app shell and static images, network-first for everything else.
const CACHE = 'lakshmi-agency-v2'
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png']

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())) })
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', (e) => {
  const req = e.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api')) return
  const isStatic = /\.(png|jpg|jpeg|svg|webp|woff2?|css|js)$/.test(url.pathname)
  if (isStatic) {
    // Stale-while-revalidate: serve the cached copy instantly if present, but always refetch in the
    // background and update the cache — so a new build is picked up on the very next load instead of
    // being stuck behind a cache-first hit indefinitely.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE)
      const hit = await cache.match(req)
      const network = fetch(req).then((res) => { cache.put(req, res.clone()); return res }).catch(() => null)
      return hit || (await network) || fetch(req)
    })())
    return
  }
  e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res }).catch(() => caches.match(req).then((hit) => hit || caches.match('/'))))
})
