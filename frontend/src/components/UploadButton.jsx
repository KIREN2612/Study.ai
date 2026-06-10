import { useRef, useState } from 'react'
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsAPI } from '../api/client'

const MAX_MB = 20
const ALLOWED = ['application/pdf']

export default function UploadButton({ onUploaded }) {
  const inputRef = useRef(null)
  const [state, setState] = useState('idle') // idle | uploading | done | error
  const [progress, setProgress] = useState(0)

  async function handleFile(file) {
    if (!file) return
    if (!ALLOWED.includes(file.type)) {
      toast.error('Only PDF files are supported')
      return
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large — max ${MAX_MB} MB`)
      return
    }

    setState('uploading')
    setProgress(0)

    // Fake progress for UX
    const interval = setInterval(() => {
      setProgress(p => (p < 80 ? p + 10 : p))
    }, 200)

    try {
      const res = await documentsAPI.upload(file)
      clearInterval(interval)
      setProgress(100)
      setState('done')
      toast.success(`Uploaded — ${res.data?.message || file.name}`)
      onUploaded?.()
      setTimeout(() => setState('idle'), 1800)
    } catch (err) {
      clearInterval(interval)
      setState('error')
      const msg = err.response?.data?.detail || 'Upload failed'
      toast.error(msg)
      setTimeout(() => setState('idle'), 2000)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const icons = {
    idle:      <Upload size={13} />,
    uploading: <Loader2 size={13} className="animate-spin" />,
    done:      <CheckCircle2 size={13} />,
    error:     <AlertCircle size={13} />,
  }
  const labels = {
    idle:      'Upload PDF',
    uploading: `Uploading… ${progress}%`,
    done:      'Uploaded!',
    error:     'Upload failed',
  }
  const colors = {
    idle:      { background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)', border: '1px solid rgba(245,158,11,0.2)' },
    uploading: { background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)' },
    done:      { background: 'rgba(34,197,94,0.12)',  color: '#86efac',  border: '1px solid rgba(34,197,94,0.2)' },
    error:     { background: 'rgba(239,68,68,0.12)',  color: '#fca5a5',  border: '1px solid rgba(239,68,68,0.2)' },
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        onChange={e => handleFile(e.target.files?.[0])}
      />
      <button
        onClick={() => state === 'idle' && inputRef.current?.click()}
        disabled={state !== 'idle'}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200"
        style={colors[state]}
      >
        {icons[state]}
        {labels[state]}
      </button>

      {/* Progress bar */}
      {state === 'uploading' && (
        <div className="h-0.5 rounded-full mx-1 overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-200"
            style={{ width: `${progress}%`, background: '#6366f1' }}
          />
        </div>
      )}
    </>
  )
}
