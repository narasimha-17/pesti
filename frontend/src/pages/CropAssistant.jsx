import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useApp } from '../lib/store'
import { Empty, Field, Modal, ProductCard, Skeletons } from '../components/ui'
import Icon from '../components/Icon'
import { crops, pests, stages } from '../data/mock'
import { photo } from '../lib/photos'

const KIND_ICON = { pest: 'bug', disease: 'mushroom', weed: 'weed', deficiency: 'flask' }
const STEPS = ['Crop', 'Growth stage', 'Problem', 'Results']

function VisitRequestForm({ crop, cropName, onClose }) {
  const { user, toast } = useApp()
  const [f, setF] = useState({ name: user?.name || '', phone: '', address: '', note: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const mut = useMutation({
    mutationFn: () => api.visitRequest({ name: f.name, phone: f.phone, crop: cropName || crop, address: f.address, note: f.note }),
    onSuccess: () => { toast('Visit request sent — the admin will contact you to schedule it.'); onClose() },
    onError: (e) => setErr(e.message),
  })
  return (
    <Modal onClose={onClose} label="Request a farm visit">
      <h3>Request a farm visit</h3>
      <p className="muted" style={{ marginTop: -6 }}>Ask the admin/agronomist to visit your field in person for {cropName || crop || 'your crop'}.</p>
      <form onSubmit={(e) => { e.preventDefault(); setErr(''); mut.mutate() }} style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div className="grid g-2">
          <Field label="Your name"><input required value={f.name} onChange={set('name')} /></Field>
          <Field label="Mobile number"><input required inputMode="numeric" pattern="[6-9][0-9]{9}" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })} /></Field>
        </div>
        <Field label="Field address / village"><input required value={f.address} onChange={set('address')} placeholder="Field location, village, landmark" /></Field>
        <Field label="Anything to add? (optional)"><textarea rows={3} value={f.note} onChange={set('note')} placeholder="What's troubling the crop, best time to visit, etc." /></Field>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn" disabled={mut.isPending}>{mut.isPending ? 'Sending…' : 'Send request'}</button>
      </form>
    </Modal>
  )
}

export default function CropAssistant() {
  const { user, toast } = useApp()
  const [crop, setCrop] = useState('')
  const [stage, setStage] = useState('')
  const [problem, setProblem] = useState('')
  const [showVisit, setShowVisit] = useState(false)
  const problems = pests.filter((p) => !crop || p.crops.includes(crop))
  const ready = crop && stage && problem
  const step = !crop ? 1 : !stage ? 2 : !problem ? 3 : 4
  const { data, isFetching } = useQuery({ queryKey: ['health', crop, problem], queryFn: () => api.cropHealth({ crop, problem }), enabled: !!ready })
  const reset = () => { setCrop(''); setStage(''); setProblem('') }
  const cropName = crops.find((c) => c.slug === crop)?.name
  const askVisit = () => (user ? setShowVisit(true) : toast('Log in to request a farm visit'))

  return (
    <div className="ch">
      <section className="ch-hero">
        <div className="container">
          <span className="eyebrow">Crop Health Assistant</span>
          <h1>What is troubling your crop?</h1>
          <p>Answer three quick questions to learn about the problem and see related products.</p>
          <ol className="ch-steps" aria-label="Progress">
            {STEPS.map((s, i) => <li key={s} className={step > i + 1 ? 'done' : step === i + 1 ? 'now' : ''}><i>{step > i + 1 ? <Icon name="check" size={14} /> : i + 1}</i>{s}</li>)}
          </ol>
        </div>
      </section>

      <div className="container ch-body">
        <div className="ch-note"><Icon name="info" size={20} /><div><b>Educational guide only.</b> This is not a diagnosis or prescription. Confirm the problem with your local agriculture officer or a licensed dealer.</div></div>

        <div className="card pad" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="pin" size={20} /><span>Want someone to see the crop in person? Request a farm visit from our admin.</span></div>
          <button className="btn ghost sm" onClick={askVisit}><Icon name="phone" size={16} /> Request a farm visit</button>
        </div>

        <section className="ch-block">
          <h3><span>1</span> Which crop are you growing?</h3>
          <div className="ch-crops">
            {crops.map((c) => (
              <button key={c.slug} className={`ch-crop ${crop === c.slug ? 'on' : ''}`} aria-pressed={crop === c.slug} onClick={() => { setCrop(c.slug); setProblem('') }}>
                {photo(c.slug) && <img src={photo(c.slug)} alt="" loading="lazy" />}
                <span className="ci"><Icon name={c.icon} size={20} /></span><b>{c.name}</b>
              </button>
            ))}
          </div>
        </section>

        <section className={`ch-block ${crop ? '' : 'lock'}`}>
          <h3><span>2</span> Growth stage</h3>
          <div className="chips">
            {stages.map((s) => <button key={s} className={`chip ${stage === s ? 'on' : ''}`} aria-pressed={stage === s} disabled={!crop} onClick={() => setStage(s)}>{s}</button>)}
          </div>
        </section>

        <section className={`ch-block ${crop && stage ? '' : 'lock'}`}>
          <h3><span>3</span> What do you see?</h3>
          <div className="ch-probs">
            {problems.map((p) => (
              <button key={p.id} className={`ch-prob ${problem === p.id ? 'on' : ''}`} aria-pressed={problem === p.id} disabled={!crop || !stage} onClick={() => setProblem(p.id)}>
                <span className="pi"><Icon name={KIND_ICON[p.kind] || 'leaf'} size={22} /></span>
                <b>{p.name}</b><small>{p.symptoms}</small><em>{p.kind}</em>
              </button>
            ))}
          </div>
        </section>

        {ready && (
          <section className="ch-result">
            {isFetching || !data ? <Skeletons n={2} /> : (
              <>
                <div className="ch-diag">
                  <span className="badge">{data.pest.kind}</span>
                  <h2>{data.pest.name}</h2>
                  <p><b>Typical signs:</b> {data.pest.symptoms}</p>
                  <p className="muted">Stage selected: {stage}. Scout your field first, avoid spraying without confirming the problem, and prefer integrated methods (resistant varieties, field hygiene, bio-products) where suitable.</p>
                  <button className="btn ghost sm" onClick={reset}>Start over</button>
                </div>
                <h3 style={{ marginTop: 28 }}>Related products</h3>
                <p className="muted">Shown because they list this crop and problem in catalogue data. This is not a recommendation to buy. Follow label instructions.</p>
                {data.products.length
                  ? <div className="grid g-prod">{data.products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
                  : <Empty icon="sprout" title="No catalogue products listed for this combination">Please consult your local agriculture officer.</Empty>}
              </>
            )}
          </section>
        )}
      </div>
      {showVisit && <VisitRequestForm crop={crop} cropName={cropName} onClose={() => setShowVisit(false)} />}
    </div>
  )
}
