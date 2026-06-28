import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { register, login } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '', confirm: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)
  const [done, setDone]       = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim())               e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)                   e.password = 'Password is required'
    else if (form.password.length < 6)    e.password = 'At least 6 characters'
    if (form.confirm !== form.password)   e.confirm = 'Passwords do not match'
    return e
  }

  const pwStrength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 8)        s++
    if (/[A-Z]/.test(p))      s++
    if (/[0-9]/.test(p))      s++
    if (/[^A-Za-z0-9]/.test(p)) s++
    return s
  })()

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await register(form.email, form.password)
      setDone(true)
      toast.success('Account created! Logging you in…')
      // Auto-login after register
      setTimeout(async () => {
        try {
          await login(form.email, form.password)
          navigate('/dashboard')
        } catch {
          navigate('/login')
        }
      }, 800)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Registration failed. Try again.'
      toast.error(msg)
      setErrors({ server: msg })
    } finally {
      setLoading(false)
    }
  }

  const strengthColors = ['', '#ef4444', '#f59e0b', '#84cc16', '#22c55e']
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong']

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
         style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <BookOpen size={16} color="#0b0e1a" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Study<span style={{ color: 'var(--accent-amber)' }}>.AI</span>
          </span>
        </div>

        {done ? (
          <div className="text-center space-y-4 py-8">
            <CheckCircle2 size={48} className="mx-auto" style={{ color: '#22c55e' }} />
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              You're all set!
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Redirecting you to the dashboard…
            </p>
          </div>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                Create your account
              </h1>
              <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                Free to use. No credit card needed.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-card)',
                    border: errors.email ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => { if (!errors.email) e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
                  onBlur={e => { if (!errors.email) e.target.style.borderColor = 'var(--border-md)' }}
                />
                {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                    className="w-full pr-10 px-3.5 py-2.5 rounded-lg text-sm"
                    style={{
                      background: 'var(--bg-card)',
                      border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-md)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                    onFocus={e => { if (!errors.password) e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
                    onBlur={e => { if (!errors.password) e.target.style.borderColor = 'var(--border-md)' }}
                  />
                  <button type="button" onClick={() => setShowPw(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                             style={{ background: i <= pwStrength ? strengthColors[pwStrength] : 'var(--border-md)' }} />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: strengthColors[pwStrength] }}>
                      {strengthLabels[pwStrength]}
                    </p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                  Confirm password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm"
                  style={{
                    background: 'var(--bg-card)',
                    border: errors.confirm ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => { if (!errors.confirm) e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
                  onBlur={e => { if (!errors.confirm) e.target.style.borderColor = 'var(--border-md)' }}
                />
                {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm}</p>}
              </div>

              {errors.server && (
                <div className="rounded-lg px-3.5 py-2.5 text-sm text-red-300 border border-red-500/20"
                     style={{ background: 'rgba(239,68,68,0.08)' }}>
                  {errors.server}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#0b0e1a',
                  boxShadow: '0 0 20px rgba(245,158,11,0.2)',
                }}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {loading ? 'Creating account…' : 'Get started — it\'s free'}
              </button>
            </form>

            <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" className="font-medium transition-colors hover:opacity-80"
                    style={{ color: 'var(--accent-amber)' }}>
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
