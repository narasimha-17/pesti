import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api, inr, minVariant } from '../lib/api'
import { Empty, Modal, ProductCard, Skeletons, Stars } from '../components/ui'
import Icon, { ProductArt } from '../components/Icon'
import { useApp } from '../lib/store'
import { photo } from '../lib/photos'

const PAGE = 8
const PRICE_BANDS = [['Under ₹500', 0, 500], ['₹500 to ₹1,000', 500, 1000], ['₹1,000 to ₹5,000', 1000, 5000], ['Over ₹5,000', 5000, 0]]
const SORTS = [['', 'Relevance'], ['popular', 'Popularity'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['rating', 'Customer rating'], ['discount', 'Biggest discount']]

// One filter button that opens its own dropdown (bottom sheet on phones).
function FilterPop({ id, open, setOpen, icon, label, value, active, align = 'left', children }) {
  const ref = useRef(null)
  const isOpen = open === id
  useEffect(() => {
    if (!isOpen) return undefined
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(null) }
    const esc = (e) => { if (e.key === 'Escape') setOpen(null) }
    document.addEventListener('mousedown', off); document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', off); document.removeEventListener('keydown', esc) }
  }, [isOpen, setOpen])
  return (
    <div className="fdd" ref={ref}>
      <button className={`fbtn ${active ? 'active' : ''} ${isOpen ? 'open' : ''}`} aria-expanded={isOpen} aria-haspopup="dialog" onClick={() => setOpen(isOpen ? null : id)}>
        <Icon name={icon} size={16} /><span>{label}</span>{value && <em>{value}</em>}<Icon name="chevron" size={14} className="chev" />
      </button>
      {isOpen && (
        <>
          <div className="sheet-bg" onClick={() => setOpen(null)} aria-hidden="true" />
          <div className={`fpop ${align}`} role="dialog" aria-label={label}>
            <div className="fpop-head"><b>{label}</b><button onClick={() => setOpen(null)} aria-label="Close"><Icon name="x" size={16} /></button></div>
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export default function Products() {
  const [sp, setSp] = useSearchParams()
  const { addToCart } = useApp()
  const [view, setView] = useState('grid')
  const [open, setOpen] = useState(null)
  const [quick, setQuick] = useState(null)
  const [compare, setCompare] = useState([])
  const [shown, setShown] = useState(PAGE)

  const f = {
    category: sp.get('category') || '', crop: sp.get('crop') || '', q: sp.get('q') || '', flag: sp.get('flag') || '', sort: sp.get('sort') || '',
    brands: sp.getAll('brand'), min: Number(sp.get('min')) || 0, max: Number(sp.get('max')) || 0, rating: Number(sp.get('rating')) || 0, inStock: sp.get('stock') === '1',
  }
  const setMany = (obj) => { const n = new URLSearchParams(sp); Object.entries(obj).forEach(([k, v]) => { if (v) n.set(k, v); else n.delete(k) }); setSp(n); setShown(PAGE) }
  const set = (k, v) => setMany({ [k]: v })
  const toggleBrand = (b) => { const n = new URLSearchParams(sp); const cur = n.getAll('brand'); n.delete('brand'); (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]).forEach((x) => n.append('brand', x)); setSp(n); setShown(PAGE) }
  const pick = (obj) => { setMany(obj); setOpen(null) }

  const { data: cats = [] } = useQuery({ queryKey: ['cats'], queryFn: api.categories })
  const { data: crops = [] } = useQuery({ queryKey: ['crops'], queryFn: api.crops })
  const { data: brands = [] } = useQuery({ queryKey: ['brands'], queryFn: api.brands })
  const { data, isLoading } = useQuery({ queryKey: ['products', sp.toString()], queryFn: () => api.products(f) })

  const catName = cats.find((c) => c.slug === f.category)?.name
  const cropName = crops.find((c) => c.slug === f.crop)?.name
  const band = PRICE_BANDS.find(([, a, b]) => a === f.min && b === f.max)
  const title = f.q ? `Results for “${f.q}”` : catName || (cropName ? `${cropName} inputs` : 'All products')
  const toggleCmp = (p) => setCompare((c) => (c.includes(p) ? c.filter((x) => x !== p) : c.length < 3 ? [...c, p] : c))

  const chips = [
    catName && [catName, () => set('category', '')],
    cropName && [cropName, () => set('crop', '')],
    ...f.brands.map((b) => [b, () => toggleBrand(b)]),
    (f.min || f.max) && [band ? band[0] : `Up to ${inr(f.max)}`, () => setMany({ min: '', max: '' })],
    f.rating && [`${f.rating} stars & up`, () => set('rating', '')],
    f.inStock && ['In stock', () => set('stock', '')],
  ].filter(Boolean)
  const sortLabel = SORTS.find(([k]) => k === f.sort)?.[1]

  return (
    <div className="container">
      <div className="crumbs"><Link to="/shop">Home</Link><Icon name="arrow" size={12} /><span>Products</span></div>
      <div className="cat-glass" role="group" aria-label="Browse categories">
        {cats.map((c) => (
          <button key={c.slug} className={`gcat ${f.category === c.slug ? 'on' : ''}`} aria-pressed={f.category === c.slug} onClick={() => set('category', f.category === c.slug ? '' : c.slug)}>
            {photo(c.slug) && <img src={photo(c.slug)} alt="" loading="lazy" />}
            <span className="gicon sm"><Icon name={c.icon} size={22} /></span>
            <b>{c.name}</b>
          </button>
        ))}
      </div>

      <div className="ptitle"><h1>{title}</h1><span className="muted">{data ? `${data.length} ${data.length === 1 ? 'product' : 'products'}` : 'Loading…'}</span></div>

      <div className="fbar" role="toolbar" aria-label="Filter and sort">
        <div className="fbar-l">
          <FilterPop id="crop" open={open} setOpen={setOpen} icon="paddy" label="Crop" value={cropName} active={!!f.crop}>
            <div className="opt-grid">{crops.map((c) => <button key={c.slug} className={`opt ${f.crop === c.slug ? 'on' : ''}`} onClick={() => pick({ crop: f.crop === c.slug ? '' : c.slug })}><Icon name={c.icon} size={18} />{c.name}</button>)}</div>
          </FilterPop>

          <FilterPop id="brand" open={open} setOpen={setOpen} icon="tag" label="Brand" value={f.brands.length ? `${f.brands.length}` : ''} active={f.brands.length > 0}>
            <div className="opt-list">{brands.map((b) => <button key={b} className={`opt row ${f.brands.includes(b) ? 'on' : ''}`} onClick={() => toggleBrand(b)} aria-pressed={f.brands.includes(b)}><span className="box">{f.brands.includes(b) && <Icon name="check" size={13} />}</span>{b}</button>)}</div>
            <div className="fpop-foot"><button className="btn ghost sm" onClick={() => { const n = new URLSearchParams(sp); n.delete('brand'); setSp(n) }}>Clear</button><button className="btn sm" onClick={() => setOpen(null)}>Done</button></div>
          </FilterPop>

          <FilterPop id="price" open={open} setOpen={setOpen} icon="receipt" label="Price" value={band ? band[0] : f.max ? `≤ ${inr(f.max)}` : ''} active={!!(f.min || f.max)}>
            <div className="opt-list">{PRICE_BANDS.map(([l, a, b]) => <button key={l} className={`opt row ${band?.[0] === l ? 'on' : ''}`} onClick={() => pick({ min: a || '', max: b || '' })}><span className="rad" />{l}</button>)}</div>
            <div className="fpop-foot"><button className="btn ghost sm" onClick={() => pick({ min: '', max: '' })}>Any price</button></div>
          </FilterPop>

          <FilterPop id="rating" open={open} setOpen={setOpen} icon="star" label="Rating" value={f.rating ? `${f.rating}+` : ''} active={!!f.rating}>
            <div className="opt-list">{[4, 3].map((r) => <button key={r} className={`opt row ${f.rating === r ? 'on' : ''}`} onClick={() => pick({ rating: f.rating === r ? '' : r })}><span className="rad" />{r} stars and above</button>)}</div>
          </FilterPop>

          <button className={`fbtn ${f.inStock ? 'active' : ''}`} aria-pressed={f.inStock} onClick={() => set('stock', f.inStock ? '' : '1')}><Icon name="check" size={16} /><span>In stock</span></button>
        </div>

        <div className="fbar-r">
          <FilterPop id="sort" open={open} setOpen={setOpen} icon="list" label="Sort" value={f.sort ? sortLabel : ''} active={!!f.sort} align="right">
            <div className="opt-list">{SORTS.map(([k, l]) => <button key={l} className={`opt row ${f.sort === k ? 'on' : ''}`} onClick={() => pick({ sort: k })}><span className="rad" />{l}</button>)}</div>
          </FilterPop>
          <div className="vtoggle" role="group" aria-label="View">
            <button className={view === 'grid' ? 'on' : ''} aria-pressed={view === 'grid'} onClick={() => setView('grid')} aria-label="Grid view"><Icon name="grid" size={17} /></button>
            <button className={view === 'list' ? 'on' : ''} aria-pressed={view === 'list'} onClick={() => setView('list')} aria-label="List view"><Icon name="list" size={17} /></button>
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="fchips" aria-label="Active filters">
          {chips.map(([l, off]) => <button key={l} className="fchip" onClick={off} aria-label={`Remove ${l}`}>{l}<Icon name="x" size={13} /></button>)}
          <button className="fclear" onClick={() => { setSp(f.q ? { q: f.q } : {}); setShown(PAGE) }}>Clear all</button>
        </div>
      )}

      <div className={`plist ${view === 'list' ? 'list-view' : ''}`}>
        {isLoading ? <Skeletons /> : !data.length ? (
          <Empty icon="search" title="No products found">Try removing some filters or checking your spelling.</Empty>
        ) : (
          <div className="grid g-prod">
            {data.slice(0, shown).map((p) => (
              <div key={p.id}>
                <ProductCard p={p} onQuickView={setQuick} />
                <label className="muted cmp"><input type="checkbox" checked={compare.includes(p)} onChange={() => toggleCmp(p)} /> Compare</label>
              </div>
            ))}
          </div>
        )}
      </div>
      {data && shown < data.length && <div style={{ textAlign: 'center', marginTop: 28 }}><button className="btn ghost" onClick={() => setShown(shown + PAGE)}>Load more products</button></div>}

      {compare.length > 1 && <Modal label="Compare products" onClose={() => setCompare([])}>
        <h3>Compare products</h3>
        <div className="table-wrap"><table>
          <thead><tr><th></th>{compare.map((p) => <th key={p.id}>{p.name}</th>)}</tr></thead>
          <tbody>{[['Brand', (p) => p.brand], ['Price', (p) => inr(minVariant(p).price)], ['Active ingredient', (p) => p.activeIngredient], ['Formulation', (p) => p.formulation], ['Type', (p) => p.productType], ['Rating', (p) => `${p.rating} / 5`]].map(([k, fn]) => <tr key={k}><th>{k}</th>{compare.map((p) => <td key={p.id}>{fn(p)}</td>)}</tr>)}</tbody>
        </table></div>
      </Modal>}

      {quick && <Modal label={quick.name} onClose={() => setQuick(null)}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,200px) 1fr', gap: 24, alignItems: 'center' }}>
          <div style={{ borderRadius: 20, overflow: 'hidden' }}><ProductArt p={quick} /></div>
          <div>
            <span className="badge">{quick.brand}</span><h2 style={{ marginTop: 8 }}>{quick.name}</h2><Stars v={quick.rating} n={quick.reviews} />
            <p>{quick.description}</p>
            <p><b>Active ingredient:</b> {quick.activeIngredient}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => { addToCart(quick, minVariant(quick)); setQuick(null) }}><Icon name="cart" size={16} /> Add · {inr(minVariant(quick).price)}</button>
              <Link className="btn ghost" to={`/product/${quick.slug}`}>Full details</Link>
            </div>
          </div>
        </div>
      </Modal>}
    </div>
  )
}
