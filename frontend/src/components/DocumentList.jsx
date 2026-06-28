import { useState } from 'react'
import { FileText, Trash2, Loader2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { documentsAPI } from '../api/client'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  if (hrs < 24)   return `${hrs}h ago`
  return `${days}d ago`
}

function truncate(str, max = 24) {
  if (!str) return ''
  const name = str.replace(/\.pdf$/i, '')
  return name.length > max ? name.slice(0, max) + '…' : name
}

export default function DocumentList({ documents, loading, onDelete }) {
  const [deletingId, setDeletingId] = useState(null)

  async function handleDelete(docId, filename) {
    if (!confirm(`Remove "${filename}"?`)) return
    setDeletingId(docId)
    try {
      await documentsAPI.delete(docId)
      toast.success(`Removed ${filename}`)
      onDelete(docId)
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2 px-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-10 skeleton rounded-lg" />
        ))}
      </div>
    )
  }

  if (!documents.length) {
    return (
      <div className="px-3 py-6 text-center">
        <FileText size={28} className="mx-auto mb-2 opacity-20" />
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No documents yet.<br />Upload a PDF to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1 px-2">
      {documents.map(doc => (
        <div
          key={doc.doc_id}
          className="group flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors"
          style={{ background: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div className="shrink-0 w-6 h-6 rounded flex items-center justify-center"
               style={{ background: 'rgba(245,158,11,0.12)' }}>
            <FileText size={12} style={{ color: 'var(--accent-amber)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}
               title={doc.filename}>
              {truncate(doc.filename, 22)}
            </p>
            {doc.created_at && (
              <p className="text-[10px] flex items-center gap-0.5 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <Clock size={9} />
                {timeAgo(doc.created_at)}
              </p>
            )}
          </div>

          <button
            onClick={() => handleDelete(doc.doc_id, doc.filename)}
            disabled={deletingId === doc.doc_id}
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/10"
            title="Remove document"
          >
            {deletingId === doc.doc_id
              ? <Loader2 size={12} className="animate-spin text-red-400" />
              : <Trash2 size={12} className="text-red-400" />
            }
          </button>
        </div>
      ))}
    </div>
  )
}
