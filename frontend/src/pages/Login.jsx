import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Eye, EyeOff, BookOpen, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw]   = useState(false)

  function validate() {
    const e = {}
    if (!form.email.trim())          e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)              e.password = 'Password is required'
    else if (form.password.length < 6) e.password = 'At least 6 characters'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Check your credentials.'
      toast.error(msg)
      setErrors({ server: msg })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0f1120 0%, #131728 50%, #1a1f35 100%)' }}>
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative z-10">
          <LogoMark />
        </div>

        <div className="relative z-10 space-y-8">
          <blockquote className="space-y-3">
            <p className="text-2xl font-light leading-relaxed" style={{ color: '#e8eaf0' }}>
              "The more that you read, the more things you will know."
            </p>
            <footer className="text-sm" style={{ color: 'var(--text-muted)' }}>— Dr. Seuss</footer>
          </blockquote>

          <div className="flex gap-8">
            {[
              { n: '12+',  label: 'NCERT Chapters' },
              { n: '∞',    label: 'Questions Asked' },
              { n: '98%',  label: 'Source Accuracy' },
            ].map(({ n, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold" style={{ color: 'var(--accent-amber)' }}>{n}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Glowing orb accent */}
        <div className="absolute bottom-[-80px] left-[-80px] w-64 h-64 rounded-full opacity-20 blur-3xl"
             style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="lg:hidden mb-2">
            <LogoMark />
          </div>

          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Sign in to Study.AI
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Your AI-powered JEE & NEET study partner.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field
              label="Email address"
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="you@example.com"
              autoComplete="email"
              onChange={v => setForm(f => ({ ...f, email: v }))}
            />
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={`w-full pr-10 px-3.5 py-2.5 rounded-lg text-sm transition-colors ${
                    errors.password ? 'border-red-500/60' : 'border-transparent'
                  }`}
                  style={{
                    background: 'var(--bg-card)',
                    border: errors.password ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-md)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
                  onBlur={e => { if (!errors.password) e.target.style.borderColor = 'var(--border-md)' }}
                />
                <button type="button" onClick={() => setShowPw(s => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 transition-opacity">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
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
                background: loading ? 'rgba(245,158,11,0.6)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#0b0e1a',
                boxShadow: loading ? 'none' : '0 0 20px rgba(245,158,11,0.25)',
              }}
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium transition-colors hover:opacity-80"
                  style={{ color: 'var(--accent-amber)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
        <BookOpen size={16} color="#0b0e1a" strokeWidth={2.5} />
      </div>
      <span className="font-semibold text-lg tracking-tight" style={{ color: 'var(--text-primary)' }}>
        Study<span style={{ color: 'var(--accent-amber)' }}>.AI</span>
      </span>
    </div>
  )
}

function Field({ label, type = 'text', value, error, placeholder, autoComplete, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-3.5 py-2.5 rounded-lg text-sm transition-colors"
        style={{
          background: 'var(--bg-card)',
          border: error ? '1px solid rgba(239,68,68,0.5)' : '1px solid var(--border-md)',
          color: 'var(--text-primary)',
          outline: 'none',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = 'rgba(245,158,11,0.5)' }}
        onBlur={e => { if (!error) e.target.style.borderColor = 'var(--border-md)' }}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}
