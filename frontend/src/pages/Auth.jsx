import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useApp } from '../lib/store'
import { call } from '../lib/api'
import Icon, { HeroScene, Logo } from '../components/Icon'
import { Select } from '../components/ui'

function OtpBoxes({ value, onChange }) {
  const refs = useRef([])
  const set = (i, ch) => {
    const d = value.split('')
    d[i] = ch.replace(/\D/g, '').slice(-1)
    onChange(d.join('').slice(0, 4))
    if (ch && i < 3) refs.current[i + 1]?.focus()
  }
  return (
    <div className="otp" role="group" aria-label="4-digit code">
      {[0, 1, 2, 3].map((i) => (
        <input key={i} ref={(el) => { refs.current[i] = el }} inputMode="numeric" maxLength={1} value={value[i] || ''} aria-label={`Digit ${i + 1}`}
          onChange={(e) => set(i, e.target.value)} onKeyDown={(e) => { if (e.key === 'Backspace' && !value[i] && i > 0) refs.current[i - 1]?.focus() }} />
      ))}
    </div>
  )
}

export function Auth({ register = false }) {
  const { login, toast } = useApp()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [method, setMethod] = useState('email') // email | otp
  const [show, setShow] = useState(false)
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', gender: '' })
  const [otp, setOtp] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState({})
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const next = sp.get('next') || '/shop'

  const [busy, setBusy] = useState(false)
  const [demo, setDemo] = useState([])
  useEffect(() => { if (!register) call('/auth/demo-accounts').then(setDemo).catch(() => {}) }, [register])

  const finish = (s) => {
    localStorage.setItem('agm_token', s.access_token); localStorage.setItem('agm_refresh', s.refresh_token)
    login(s.user); toast(register ? 'Account created' : 'Signed in'); nav(s.user.role === 'admin' && !sp.get('next') ? '/admin' : next)
  }

  const submit = async (e) => {
    e.preventDefault()
    const er = {}
    if (register && f.name.trim().length < 2) er.name = 'Enter your name'
    if (register && !f.gender) er.gender = 'Select a gender'
    if (method === 'email') {
      if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email address'
      if (f.password.length < 8) er.password = 'Use at least 8 characters'
    } else {
      if (!/^[6-9]\d{9}$/.test(f.phone)) er.phone = 'Enter a valid 10-digit mobile number'
      if (sent && otp.length < 4) er.otp = 'Enter the 4-digit code'
    }
    setErr(er)
    if (Object.keys(er).length) return
    setBusy(true)
    try {
      if (method === 'otp') {
        if (!sent) { const r = await call('/auth/otp', { phone: f.phone }); setSent(true); toast(r.hint); return }
        finish(await call('/auth/otp', { phone: f.phone, code: otp, name: f.name }))
      } else {
        finish(await call(register ? '/auth/register' : '/auth/login', register
          ? { name: f.name, email: f.email, password: f.password, gender: f.gender }
          : { email: f.email, password: f.password }))
      }
    } catch (x) {
      setErr({ form: x.message })
    } finally { setBusy(false) }
  }

  return (
    <div className="auth">
      <section className="auth-form">
        <div className="auth-top">
          <Link to="/" aria-label="Lakshmi Agency home"><Logo /></Link>
          <Link to="/" className="link-arrow" style={{ fontSize: '.86rem' }}><Icon name="arrow" size={15} style={{ transform: 'scaleX(-1)' }} /> Back to home</Link>
        </div>

        <form className="auth-card" onSubmit={submit} noValidate>
          <div className="seg" role="tablist" aria-label="Account">
            <Link role="tab" aria-selected={!register} className={!register ? 'on' : ''} to={`/login${sp.get('next') ? `?next=${sp.get('next')}` : ''}`}>Sign in</Link>
            <Link role="tab" aria-selected={register} className={register ? 'on' : ''} to={`/register${sp.get('next') ? `?next=${sp.get('next')}` : ''}`}>Create account</Link>
          </div>

          <div>
            <h1>{register ? 'Start shopping smarter' : 'Welcome back'}</h1>
            <p className="muted" style={{ margin: 0 }}>{register ? 'Track orders, save products and reorder in a tap.' : 'Sign in to track orders and pick up where you left off.'}</p>
          </div>

          <div className="method" role="radiogroup" aria-label="Sign in method">
            <button type="button" role="radio" aria-checked={method === 'email'} className={method === 'email' ? 'on' : ''} onClick={() => { setMethod('email'); setErr({}) }}><Icon name="mail" size={16} /> Email</button>
            <button type="button" role="radio" aria-checked={method === 'otp'} className={method === 'otp' ? 'on' : ''} onClick={() => { setMethod('otp'); setErr({}) }}><Icon name="phone" size={16} /> Mobile OTP</button>
          </div>

          {register && <div className="af"><label htmlFor="a-name">Full name</label><div className="inp"><Icon name="user" size={18} /><input id="a-name" value={f.name} onChange={set('name')} autoComplete="name" placeholder="Ramesh Reddy" /></div>{err.name && <p className="err" role="alert">{err.name}</p>}</div>}

          {register && (
            <div className="af">
              <label htmlFor="a-gender">Gender</label>
              <Select id="a-gender" icon="user" value={f.gender} onChange={(v) => setF({ ...f, gender: v })}
                options={[['female', 'Female'], ['male', 'Male'], ['other', 'Other / prefer not to say']]} />
              {err.gender && <p className="err" role="alert">{err.gender}</p>}
            </div>
          )}

          {method === 'email' ? (
            <>
              <div className="af"><label htmlFor="a-email">Email</label><div className="inp"><Icon name="mail" size={18} /><input id="a-email" type="email" value={f.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" /></div>{err.email && <p className="err" role="alert">{err.email}</p>}</div>
              <div className="af">
                <label htmlFor="a-pass" style={{ display: 'flex', justifyContent: 'space-between' }}>Password {!register && <a href="#main" className="forgot" onClick={(e) => { e.preventDefault(); toast('Password reset link would be emailed') }}>Forgot password?</a>}</label>
                <div className="inp"><Icon name="lock" size={18} /><input id="a-pass" type={show ? 'text' : 'password'} value={f.password} onChange={set('password')} autoComplete={register ? 'new-password' : 'current-password'} placeholder="At least 8 characters" />
                  <button type="button" className="eye" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'eyeoff' : 'eye'} size={18} /></button></div>
                {err.password && <p className="err" role="alert">{err.password}</p>}
              </div>
            </>
          ) : (
            <>
              <div className="af"><label htmlFor="a-phone">Mobile number</label><div className="inp"><span className="cc">+91</span><input id="a-phone" inputMode="numeric" maxLength={10} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value.replace(/\D/g, '') })} autoComplete="tel-national" placeholder="98765 43210" /></div>{err.phone && <p className="err" role="alert">{err.phone}</p>}</div>
              {sent && <div className="af"><label>Enter the code we sent</label><OtpBoxes value={otp} onChange={setOtp} />{err.otp && <p className="err" role="alert">{err.otp}</p>}<button type="button" className="forgot" style={{ marginTop: 8, background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={() => toast('Code resent')}>Resend code</button></div>}
            </>
          )}

          {err.form && <p className="err" role="alert" style={{ marginBottom: 10 }}>{err.form}</p>}
          <button className="btn block" style={{ minHeight: 52 }} disabled={busy}>{busy ? 'Please wait…' : ''}{!busy && (method === 'otp' && !sent ? 'Send OTP' : register ? 'Create account' : 'Sign in')} {!busy && <Icon name="arrow" size={18} />}</button>

          {!register && demo.length > 0 && (
            <div className="demo-box">
              <b>Demo accounts</b>
              {demo.map((d) => <button type="button" key={d.email} onClick={() => { setMethod('email'); setF({ ...f, email: d.email, password: d.password }) }}><span>{d.role === 'admin' ? 'Admin' : 'Customer'}</span>{d.email}<i>{d.password}</i></button>)}
            </div>
          )}

          <div className="or"><span>or</span></div>
          <button type="button" className="btn ghost block" onClick={() => toast('Google sign-in needs OAuth keys (backend phase)')}><span className="gmark">G</span> Continue with Google</button>

          <p className="muted fine">By continuing you agree to our Terms and Privacy Policy. Crop-protection purchases need extra confirmation at checkout.</p>
        </form>
      </section>

      <aside className="auth-side" aria-hidden="true">
        <div className="side-copy">
          <span className="hero-tag"><i>New</i> Kharif season is live</span>
          <h2>Your season’s inputs, one sign-in away.</h2>
          <ul>
            <li><Icon name="truck" size={18} /> Track every order to your village</li>
            <li><Icon name="heart" size={18} /> Save products for each crop</li>
            <li><Icon name="receipt" size={18} /> GST invoices, always at hand</li>
          </ul>
        </div>
        <div className="side-scene"><HeroScene tone="green" /></div>
        <div className="float f1"><span className="dot"><Icon name="truck" size={18} /></span><div>Order AGM-2609 shipped<small>Arriving Thursday, Guntur</small></div></div>
        <div className="float f2"><span className="dot"><Icon name="paddy" size={18} /></span><div>Paddy · tillering stage<small>Scout before you spray</small></div></div>
      </aside>
    </div>
  )
}
