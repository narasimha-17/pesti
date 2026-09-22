import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { articles, categories, products as mockProducts } from '../data/mock'
import { api, inr } from '../lib/api'
import { useApp } from '../lib/store'
import { Empty, Field, Modal, SectionHead } from '../components/ui'
import Icon from '../components/Icon'

const ROLE_LABELS = { admin: 'Admin', customer: 'Customer', inventory_manager: 'Inventory Manager', sales_manager: 'Sales Manager', support_agent: 'Support Agent', warehouse_staff: 'Warehouse Staff', supplier: 'Supplier' }
const ROLES = Object.keys(ROLE_LABELS)
const TABS = [['Dashboard', 'grid'], ['Products', 'box'], ['Inventory', 'flask'], ['Orders', 'receipt'], ['Coupons', 'tag'], ['Visit requests', 'pin'], ['Users & roles', 'user']]
const VISIT_STATUS_LABELS = { new: 'New', contacted: 'Contacted', scheduled: 'Scheduled', done: 'Done' }
const VISIT_STATUSES = Object.keys(VISIT_STATUS_LABELS)

export function Learn() {
  return (
    <div className="container section">
      <SectionHead eyebrow="Learn" title="Farmer education" />
      <p className="muted" style={{ marginTop: -12, marginBottom: 24 }}>Crop guides, pest & disease guides, application guides and seasonal advice. General information only. Always follow product labels and local recommendations.</p>
      <div className="grid g-3">{articles.map((a) => <article key={a.slug} className="card article"><div className="top"><Icon name={a.icon} size={54} /></div><div className="txt"><span className="badge">{a.kind}</span><h3 style={{ marginTop: 10 }}>{a.title}</h3><p className="muted" style={{ margin: 0 }}>{a.summary}</p></div></article>)}</div>
    </div>
  )
}

const emptyForm = { name: '', category: categories[0]?.slug || '', brand: '', activeIngredient: '', crops: '', sku: '', pack: '', price: '', mrp: '', stock: '', image: '' }
const MAX_IMAGE_MB = 2

function ImageField({ value, onChange }) {
  const [err, setErr] = useState('')
  const pick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { setErr(`Image must be under ${MAX_IMAGE_MB} MB`); return }
    setErr('')
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }
  return (
    <Field label="Product image (optional)">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {value && <img src={value} alt="Preview" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)', flex: 'none' }} />}
        <div style={{ flex: 1 }}>
          <input type="file" accept="image/*" onChange={pick} />
          {err && <div className="err" role="alert">{err}</div>}
        </div>
        {value && <button type="button" className="btn ghost sm" onClick={() => onChange('')}>Remove</button>}
      </div>
      <small className="muted">No image needed — a default illustration is used automatically if you skip this.</small>
    </Field>
  )
}

function ProductForm({ onClose, onSaved }) {
  const [f, setF] = useState(emptyForm)
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const mut = useMutation({
    mutationFn: () => api.adminCreateProduct({
      name: f.name, category: f.category, brand: f.brand, activeIngredient: f.activeIngredient,
      crops: f.crops.split(',').map((s) => s.trim()).filter(Boolean), image: f.image || undefined,
      variants: [{ sku: f.sku, pack: f.pack, price: Number(f.price), mrp: Number(f.mrp || f.price), stock: Number(f.stock) }],
    }),
    onSuccess: () => onSaved(),
    onError: (e) => setErr(e.message),
  })
  return (
    <Modal onClose={onClose} label="Add product">
      <h3>Add product</h3>
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); mut.mutate() }} style={{ display: 'grid', gap: 14, marginTop: 12 }}>
        <div className="grid g-2">
          <Field label="Product name"><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Brand"><input required value={f.brand} onChange={set('brand')} /></Field>
        </div>
        <div className="grid g-2">
          <Field label="Category">
            <select required value={f.category} onChange={set('category')}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Active ingredient"><input value={f.activeIngredient} onChange={set('activeIngredient')} /></Field>
        </div>
        <Field label="Crops (comma-separated slugs, e.g. paddy, cotton)"><input value={f.crops} onChange={set('crops')} /></Field>
        <div className="grid g-3">
          <Field label="SKU"><input required value={f.sku} onChange={set('sku')} /></Field>
          <Field label="Pack size"><input required placeholder="e.g. 1 L" value={f.pack} onChange={set('pack')} /></Field>
          <Field label="Stock (units)"><input required type="number" min="0" value={f.stock} onChange={set('stock')} /></Field>
        </div>
        <div className="grid g-2">
          <Field label="Price (₹)"><input required type="number" min="1" value={f.price} onChange={set('price')} /></Field>
          <Field label="MRP (₹)"><input type="number" min="1" value={f.mrp} onChange={set('mrp')} /></Field>
        </div>
        <ImageField value={f.image} onChange={(v) => setF({ ...f, image: v })} />
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn" disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Add product'}</button>
      </form>
    </Modal>
  )
}

function StockCell({ p, v, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(v.stock)
  const mut = useMutation({
    mutationFn: () => api.adminUpdateStock(p.slug, v.sku, Number(val)),
    onSuccess: () => { setEditing(false); onSaved() },
  })
  if (!editing) return (
    <span className={`badge ${v.stock < 25 ? 'warn' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setEditing(true)} title="Click to update stock">{v.stock}</span>
  )
  return (
    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
      <input type="number" min="0" value={val} onChange={(e) => setVal(e.target.value)} style={{ width: 72 }} autoFocus />
      <button className="btn ghost sm" disabled={mut.isPending} onClick={() => mut.mutate()}><Icon name="check" size={14} /></button>
      <button className="btn ghost sm" onClick={() => setEditing(false)}><Icon name="x" size={14} /></button>
    </span>
  )
}

function CouponForm({ onClose, onSaved }) {
  const [f, setF] = useState({ code: '', kind: 'percent', value: '', min_order: '', expires_at: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const mut = useMutation({
    mutationFn: () => api.adminCreateCoupon({ code: f.code, kind: f.kind, value: Number(f.value), min_order: Number(f.min_order || 0), expires_at: f.expires_at ? new Date(f.expires_at).toISOString() : undefined }),
    onSuccess: onSaved,
    onError: (e) => setErr(e.message),
  })
  return (
    <Modal onClose={onClose} label="Create coupon">
      <h3>Create coupon</h3>
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); mut.mutate() }} style={{ display: 'grid', gap: 14, marginTop: 12 }}>
        <Field label="Coupon code"><input required value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="e.g. HARVEST20" /></Field>
        <div className="grid g-2">
          <Field label="Discount type">
            <select value={f.kind} onChange={set('kind')}>
              <option value="percent">Percent off (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </Field>
          <Field label={f.kind === 'percent' ? 'Discount (%)' : 'Discount (₹)'}><input required type="number" min="1" value={f.value} onChange={set('value')} /></Field>
        </div>
        <div className="grid g-2">
          <Field label="Minimum order (₹)"><input type="number" min="0" value={f.min_order} onChange={set('min_order')} /></Field>
          <Field label="Expires on (optional)"><input type="date" value={f.expires_at} onChange={set('expires_at')} /></Field>
        </div>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn" disabled={mut.isPending}>{mut.isPending ? 'Saving…' : 'Create coupon'}</button>
      </form>
    </Modal>
  )
}

function RoleCell({ u, onSaved }) {
  const { toast } = useApp()
  const mut = useMutation({
    mutationFn: (role) => api.adminSetRole(u.id, role),
    onSuccess: () => { toast(`${u.name}'s role updated`); onSaved() },
    onError: (e) => toast(e.message),
  })
  return (
    <select value={u.role} disabled={mut.isPending} onChange={(e) => mut.mutate(e.target.value)}>
      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
    </select>
  )
}

function VisitStatusCell({ v, onSaved }) {
  const { toast } = useApp()
  const mut = useMutation({
    mutationFn: (status) => api.adminUpdateVisitStatus(v.id, status),
    onSuccess: onSaved,
    onError: (e) => toast(e.message),
  })
  return (
    <select value={v.status} disabled={mut.isPending} onChange={(e) => mut.mutate(e.target.value)}>
      {VISIT_STATUSES.map((s) => <option key={s} value={s}>{VISIT_STATUS_LABELS[s]}</option>)}
    </select>
  )
}

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Admin() {
  const { user, toast } = useApp()
  const [tab, setTab] = useState('Dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [showCoupon, setShowCoupon] = useState(false)
  const qc = useQueryClient()
  // Frontend guard is UX only. The API enforces RBAC.
  const isAdmin = user?.role === 'admin'
  const { data: products = mockProducts, refetch } = useQuery({ queryKey: ['admin-products'], queryFn: api.adminProducts, enabled: isAdmin })
  const { data: users = [], refetch: refetchUsers } = useQuery({ queryKey: ['admin-users'], queryFn: api.adminUsers, enabled: isAdmin && tab === 'Users & roles' })
  const { data: logs = [], refetch: refetchLogs } = useQuery({ queryKey: ['admin-logs'], queryFn: api.adminLogs, enabled: isAdmin && tab === 'Users & roles', refetchInterval: 15000 })
  const { data: coupons = [], refetch: refetchCoupons } = useQuery({ queryKey: ['admin-coupons'], queryFn: api.adminCoupons, enabled: isAdmin && tab === 'Coupons' })
  const { data: visits = [], refetch: refetchVisits } = useQuery({ queryKey: ['admin-visits'], queryFn: api.adminVisitRequests, enabled: isAdmin && tab === 'Visit requests', refetchInterval: 20000 })
  const del = useMutation({ mutationFn: (slug) => api.adminDeleteProduct(slug), onSuccess: () => { toast('Product deleted'); refetch() }, onError: (e) => toast(e.message) })
  const toggleCoupon = useMutation({ mutationFn: ({ id, active }) => api.adminUpdateCoupon(id, { active }), onSuccess: refetchCoupons, onError: (e) => toast(e.message) })
  const delCoupon = useMutation({ mutationFn: (id) => api.adminDeleteCoupon(id), onSuccess: () => { toast('Coupon deleted'); refetchCoupons() }, onError: (e) => toast(e.message) })

  if (!user) return <div className="container"><Empty icon="lock" title="Admin login required"><Link className="btn" style={{ marginTop: 16 }} to="/login?next=/admin">Login</Link></Empty></div>
  if (!isAdmin) return <div className="container"><Empty icon="lock" title="Admin access only">This account does not have admin permissions.</Empty></div>

  const low = products.flatMap((p) => p.variants.map((v) => ({ p, v }))).filter(({ v }) => v.stock < 25)
  const sales = [42, 55, 38, 70, 64, 88, 96]
  const saved = () => { refetch(); qc.invalidateQueries({ queryKey: ['products'] }) }
  const savedUsers = () => { refetchUsers(); refetchLogs() }

  return (
    <div className="container admin">
      <nav className="card pad" aria-label="Admin">
        {TABS.map(([t, ic]) => <a href="#main" key={t} className={tab === t ? 'on' : ''} onClick={(e) => { e.preventDefault(); setTab(t) }}><Icon name={ic} size={18} />{t}</a>)}
      </nav>
      <section>
        {tab === 'Dashboard' && <>
          <div className="admin-head"><div><h2>Dashboard</h2><p className="muted">Store performance at a glance.</p></div></div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', marginBottom: 20, flex: 'none' }}>
            {[['Revenue (7d)', inr(452300)], ['Orders', '318'], ['Customers', '1,204'], ['Low stock', low.length]].map(([a, b]) => <div className="card stat" key={a}><span className="muted">{a}</span><b>{b}</b></div>)}
          </div>
          <div className="card pad" style={{ flex: 'none' }}><h3>Sales, last 7 days</h3><div className="bars">{sales.map((h, i) => <div key={i} style={{ height: `${h}%` }}><span>D{i + 1}</span></div>)}</div></div>
        </>}
        {tab === 'Products' && <>
          <div className="admin-head">
            <div><h2>Products ({products.length})</h2><p className="muted">Add, edit and remove catalog items.</p></div>
            <button className="btn sm" onClick={() => setShowAdd(true)}><Icon name="plus" size={16} /> Add product</button>
          </div>
          <div className="card pad table-wrap">
            <table><thead><tr><th /><th>Name</th><th>Category</th><th>Brand</th><th>Variants</th><th>Stock</th><th /></tr></thead><tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.image ? <img src={p.image} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 8 }} /> : <span className="ib" style={{ width: 34, height: 34 }}><Icon name="box" size={16} /></span>}</td>
                  <td><b>{p.name}</b></td><td>{p.category}</td><td>{p.brand}</td><td>{p.variants.length}</td>
                  <td>{p.variants.reduce((s, v) => s + v.stock, 0)}</td>
                  <td><button className="btn ghost sm" onClick={() => { if (confirm(`Delete ${p.name}?`)) del.mutate(p.slug) }}><Icon name="trash" size={14} /></button></td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </>}
        {tab === 'Inventory' && <>
          <div className="admin-head"><div><h2>Stock visibility</h2><p className="muted">Click a stock value to update it.</p></div></div>
          <div className="card pad table-wrap">
            <table><thead><tr><th>SKU</th><th>Product</th><th>Pack</th><th>Stock</th></tr></thead><tbody>
              {products.flatMap((p) => p.variants.map((v) => (
                <tr key={v.sku}><td>{v.sku}</td><td>{p.name}</td><td>{v.pack}</td><td><StockCell p={p} v={v} onSaved={saved} /></td></tr>
              )))}
            </tbody></table>
          </div>
        </>}
        {tab === 'Orders' && <div className="card pad"><h3>Orders</h3><p className="muted">Order queue, status updates, shipments and refunds will appear here.</p></div>}
        {tab === 'Coupons' && <>
          <div className="admin-head">
            <div><h2>Coupons ({coupons.length})</h2><p className="muted">Create and manage discount codes.</p></div>
            <button className="btn sm" onClick={() => setShowCoupon(true)}><Icon name="plus" size={16} /> Create coupon</button>
          </div>
          <div className="card pad table-wrap">
            <table><thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expires</th><th>Status</th><th /></tr></thead><tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td><b>{c.code}</b></td>
                  <td>{c.kind === 'percent' ? `${c.value}% off` : inr(c.value) + ' off'}</td>
                  <td>{c.min_order ? inr(c.min_order) : '—'}</td>
                  <td className="muted">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'No expiry'}</td>
                  <td>
                    <button className={`badge ${c.active ? '' : 'warn'}`} style={{ cursor: 'pointer', border: 'none' }} onClick={() => toggleCoupon.mutate({ id: c.id, active: !c.active })}>
                      {c.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td><button className="btn ghost sm" onClick={() => { if (confirm(`Delete ${c.code}?`)) delCoupon.mutate(c.id) }}><Icon name="trash" size={14} /></button></td>
                </tr>
              ))}
              {!coupons.length && <tr><td colSpan={6} className="muted">No coupons yet.</td></tr>}
            </tbody></table>
          </div>
        </>}
        {tab === 'Visit requests' && <>
          <div className="admin-head"><div><h2>Farm visit requests ({visits.length})</h2><p className="muted">Farmers who asked for an in-person visit from Crop Health Assistant.</p></div></div>
          <div className="card pad table-wrap">
            <table><thead><tr><th>When</th><th>Name</th><th>Phone</th><th>Crop</th><th>Address</th><th>Note</th><th>Status</th></tr></thead><tbody>
              {visits.map((v) => (
                <tr key={v.id}>
                  <td className="muted" title={new Date(v.created_at).toLocaleString('en-IN')}>{timeAgo(v.created_at)}</td>
                  <td><b>{v.name}</b></td>
                  <td>{v.phone}</td>
                  <td>{v.crop}</td>
                  <td className="muted">{v.address}</td>
                  <td className="muted">{v.note || '—'}</td>
                  <td><VisitStatusCell v={v} onSaved={refetchVisits} /></td>
                </tr>
              ))}
              {!visits.length && <tr><td colSpan={7} className="muted">No visit requests yet.</td></tr>}
            </tbody></table>
          </div>
        </>}
        {tab === 'Users & roles' && <>
          <div className="admin-head"><div><h2>Users & roles</h2><p className="muted">Change a user's access level. Every change is logged below.</p></div></div>
          <div className="card pad table-wrap" style={{ marginBottom: 20, flex: 'none' }}>
            <table><thead><tr><th>Name</th><th>Contact</th><th>Joined</th><th>Role</th></tr></thead><tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.name}</b></td>
                  <td className="muted">{u.email || u.phone}</td>
                  <td className="muted">{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><RoleCell u={u} onSaved={savedUsers} /></td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={4} className="muted">No users yet.</td></tr>}
            </tbody></table>
          </div>
          <div className="card pad table-wrap">
            <h3 style={{ marginTop: 0 }}>Activity log</h3>
            <table><thead><tr><th>When</th><th>By</th><th>Action</th></tr></thead><tbody>
              {logs.map((l) => (
                <tr key={l.id}><td className="muted" title={new Date(l.at).toLocaleString('en-IN')}>{timeAgo(l.at)}</td><td><b>{l.actor}</b></td><td>{l.detail}</td></tr>
              ))}
              {!logs.length && <tr><td colSpan={3} className="muted">No activity yet.</td></tr>}
            </tbody></table>
          </div>
        </>}
      </section>
      {showAdd && <ProductForm onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); toast('Product added'); saved() }} />}
      {showCoupon && <CouponForm onClose={() => setShowCoupon(false)} onSaved={() => { setShowCoupon(false); toast('Coupon created'); refetchCoupons() }} />}
    </div>
  )
}
