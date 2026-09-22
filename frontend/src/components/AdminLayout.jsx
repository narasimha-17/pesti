import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store'
import { Avatar } from './ui'
import Icon, { Logo } from './Icon'

// A separate, minimal shell for /admin — no storefront search, categories or cart.
export default function AdminLayout() {
  const { user, logout } = useApp()
  const nav = useNavigate()
  return (
    <>
      <header className="header admin-hdr">
        <div className="container header-row">
          <Link to="/admin" aria-label="Lakshmi Agency admin"><Logo light /></Link>
          <span className="admin-badge"><Icon name="shield" size={14} /> Admin panel</span>
          <div className="hdr-actions">
            <Link to="/shop" className="btn ghost sm"><Icon name="home" size={16} /> View store</Link>
            {user && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={user.name} gender={user.gender} className="pp-av" />
                <button className="btn ghost sm" onClick={() => { logout(); nav('/') }}><Icon name="arrow" size={16} /> Logout</button>
              </span>
            )}
          </div>
        </div>
      </header>
      <main id="main"><Outlet /></main>
    </>
  )
}
