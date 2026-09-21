import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { Empty, ProductCard, Skeletons } from '../components/ui'
import Icon from '../components/Icon'
import { crops, pests, stages } from '../data/mock'
import { photo } from '../lib/photos'

const KIND_ICON = { pest: 'bug', disease: 'mushroom', weed: 'weed', deficiency: 'flask' }
const STEPS = ['Crop', 'Growth stage', 'Problem', 'Results']

export default function CropAssistant() {
  const [crop, setCrop] = useState('')
  const [stage, setStage] = useState('')
  const [problem, setProblem] = useState('')
  const problems = pests.filter((p) => !crop || p.crops.includes(crop))
  const ready = crop && stage && problem
  const step = !crop ? 1 : !stage ? 2 : !problem ? 3 : 4
  const { data, isFetching } = useQuery({ queryKey: ['health', crop, problem], queryFn: () => api.cropHealth({ crop, problem }), enabled: !!ready })
  const reset = () => { setCrop(''); setStage(''); setProblem('') }

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
    </div>
  )
}
