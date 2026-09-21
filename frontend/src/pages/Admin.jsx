import { useState } from 'react'
import { Link } from 'react-router-dom'
import { articles, products } from '../data/mock'
import { inr } from '../lib/api'
import { useApp } from '../lib/store'
import { Empty, SectionHead } from '../components/ui'
import Icon from '../components/Icon'

const ROLES = ['Super Admin', 'Admin', 'Inventory Manager', 'Sales Manager', 'Support Agent', 'Warehouse Staff', 'Supplier', 'Customer']
const TABS = [['Dashboard', 'grid'], ['Products', 'box'], ['Inventory', 'flask'], ['Orders', 'receipt'], ['Coupons', 'tag'], ['Users & roles', 'user']]

export function Learn() {
  return (
    <div className="container section">
      <SectionHead eyebrow="Learn" title="Farmer education" />
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>Crop guides, pest & disease guides, application guides and seasonal advice. General information only. Always follow product labels and local recommendations.</p>
      <div className="grid g-3">{articles.map((a) => <article key={a.slug} className="card article"><div className="top"><Icon name={a.icon} size={54} /></div><div className="txt"><span className="badge">{a.kind}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="muted" style={{ margin: 0 }}>{a.summary}</p></div></article>)}</div>
    </div>
  )
}

export default function Admin() {
  const { user } = useApp()
  const [tab, setTab] = useState('Dashboard')
  // Frontend guard is UX only. The API enforces RBAC.
  if (!user) return <div className="container"><Empty icon="lock" title="Admin login required"><Link className="btn" style={{ marginTop: 16 }} to="/login?next=/admin">Login</Link></Empty></div>
  const low = products.flatMap((p) => p.variants.map((v) => ({ p, v }))).filter(({ v }) => v.stock < 25)
  const sales = [42, 55, 38, 70, 64, 88, 96]
  return (
    <div className="container admin">
      <nav className="card pad" aria-label="Admin" style={{ alignSelf: 'start' }}>
        {TABS.map(([t, ic]) => <a href="#main" key={t} className={tab === t ? 'on' : ''} onClick={(e) => { e.preventDefault(); setTab(t) }}><Icon name={ic} size={18} />{t}</a>)}
      </nav>
      <section>
        <div className="notice info" style={{ marginBottom: 16 }}><Icon name="info" size={20} />Demo view with sample data. It connects to the FastAPI admin endpoints in the next phase.</div>
        {tab === 'Dashboard' && <>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', marginBottom: 20 }}>
            {[['Revenue (7d)', inr(452300)], ['Orders', '318'], ['Customers', '1,204'], ['Low stock', low.length]].map(([a, b]) => <div className="card stat" key={a}><span className="muted">{a}</span><b>{b}</b></div>)}
          </div>
          <div className="card pad"><h3>Sales, last 7 days</h3><div className="bars">{sales.map((h, i) => <div key={i} style={{ height: `${h}%` }}><span>D{i + 1}</span></div>)}</div></div>
        </>}
        {tab === 'Products' && <div className="card pad table-wrap"><h3>Products ({products.length})</h3><table><thead><tr><th>Name</th><th>Category</th><th>Brand</th><th>Variants</th><th>Regulated</th></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td><b>{p.name}</b></td><td>{p.category}</td><td>{p.brand}</td><td>{p.variants.length}</td><td>{p.regulated ? 'Yes' : '—'}</td></tr>)}</tbody></table></div>}
        {tab === 'Inventory' && <div className="card pad table-wrap"><h3>Low-stock alerts</h3><table><thead><tr><th>SKU</th><th>Product</th><th>Pack</th><th>Stock</th></tr></thead><tbody>{low.map(({ p, v }) => <tr key={v.sku}><td>{v.sku}</td><td>{p.name}</td><td>{v.pack}</td><td><span className="badge warn">{v.stock}</span></td></tr>)}</tbody></table></div>}
        {tab === 'Orders' && <div className="card pad"><h3>Orders</h3><p className="muted">Order queue, status updates, shipments and refunds will appear here.</p></div>}
        {tab === 'Coupons' && <div className="card pad"><h3>Coupons</h3><p>KISAN10: 10% off (min ₹500) · WELCOME100: ₹100 off (min ₹999)</p></div>}
        {tab === 'Users & roles' && <div className="card pad"><h3>Roles</h3><div className="chips">{ROLES.map((r) => <span className="badge" key={r}>{r}</span>)}</div></div>}
      </section>
    </div>
  )
}
