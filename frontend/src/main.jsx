import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppProvider, useApp } from './lib/store'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import Home from './pages/Home'
import { initReveal } from './lib/reveal'
import './styles.css'

const Landing = lazy(() => import('./pages/Landing'))
const Testimonials = lazy(() => import('./pages/Testimonials'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Cart = lazy(() => import('./pages/Cart'))
const Checkout = lazy(() => import('./pages/Checkout'))
const Account = lazy(() => import('./pages/Account'))
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: () => <m.Auth /> })))
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: () => <m.Auth register /> })))
const ShopByCrop = lazy(() => import('./pages/Crops').then((m) => ({ default: m.ShopByCrop })))
const CropAssistant = lazy(() => import('./pages/Crops').then((m) => ({ default: m.CropAssistant })))
const Admin = lazy(() => import('./pages/Admin'))
const Credits = lazy(() => import('./pages/Credits'))
const Rentals = lazy(() => import('./pages/Rentals'))
const RentalDetail = lazy(() => import('./pages/Rentals').then((m) => ({ default: m.RentalDetail })))
const Learn =lazy(() => import('./pages/Admin').then((m) => ({ default: m.Learn })))

// Visitors see the marketing landing page; signed-in users go straight to the store.
function Gate() {
  const { user } = useApp()
  return user ? <Navigate to="/shop" replace /> : <Landing />
}

// Public pages meant for visitors only; signed-in users go to the store.
function GuestOnly({ children }) {
  const { user } = useApp()
  return user ? <Navigate to="/shop" replace /> : children
}

// Account features need a login; guests are sent to the login page and come back afterwards.
function Protected({ children }) {
  const { user } = useApp()
  const { pathname } = useLocation()
  return user ? children : <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />
}

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } } })

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <AppProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="container pad"><div className="skeleton" /></div>}>
            <Routes>
              <Route path="/" element={<Gate />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route element={<Layout />}>
                <Route path="testimonials" element={<GuestOnly><Testimonials /></GuestOnly>} />
              </Route>
              <Route element={<Protected><Layout /></Protected>}>
                <Route path="shop" element={<Home />} />
                <Route path="products" element={<Products />} />
                <Route path="product/:slug" element={<ProductDetail />} />
                <Route path="cart" element={<Protected><Cart /></Protected>} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="crops" element={<ShopByCrop />} />
                <Route path="crop-assistant" element={<Protected><CropAssistant /></Protected>} />
                <Route path="learn" element={<Learn />} />
                <Route path="rentals" element={<Rentals />} />
                <Route path="rentals/:id" element={<RentalDetail />} />
                <Route path="account" element={<Protected><Account /></Protected>} />
                <Route path="credits" element={<Credits />} />
                <Route path="*" element={<div className="container pad"><h1>Page not found</h1></div>} />
              </Route>
              <Route element={<Protected><AdminLayout /></Protected>}>
                <Route path="admin" element={<Admin />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AppProvider>
    </QueryClientProvider>
  </StrictMode>,
)

requestAnimationFrame(initReveal)

// Offline-capable shell (production builds only)
if ('serviceWorker' in navigator && import.meta.env.PROD) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
