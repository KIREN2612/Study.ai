import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, LogOut, ChevronLeft, ChevronRight, FolderOpen, Sparkles, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { documentsAPI } from '../api/client'
import DocumentList from './DocumentList'
import UploadButton from './UploadButton'

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth()
  const [documents, setDocuments]   = useState([])
  const [docsLoading, setDocsLoading] = useState(true)

  async function fetchDocs() {
    setDocsLoading(true)
    try {
      const res = await documentsAPI.list()
      setDocuments(res.data?.documents || [])
    } catch {
      setDocuments([])
    } finally {
      setDocsLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  function handleDelete(docId) {
    setDocuments(d => d.filter(x => x.doc_id !== docId))
  }

  const emailLabel = user?.email?.split('@')[0] || 'Student'

  return (
    <aside
      className="sidebar-transition flex flex-col h-full border-r relative"
      style={{
        width: collapsed ? '56px' : '240px',
        background: 'var(--bg-surface)',
        borderColor: 'var(--border)',
        minWidth: collapsed ? '56px' : '240px',
      }}
    >
      {/* Header */}
      <div className="flex items-center px-3 h-14 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className={`flex items-center gap-2.5 overflow-hidden transition-all ${collapsed ? 'w-0 opacity-0' : 'w-full opacity-100'}`}
             style={{ transitionDuration: '200ms' }}>
          <div className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <BookOpen size={14} color="#0b0e1a" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-sm tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
            Study<span style={{ color: 'var(--accent-amber)' }}>.AI</span>
          </span>
        </div>
        {collapsed && (
          <div className="w-7 h-7 rounded-md flex items-center justify-center mx-auto"
               style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <BookOpen size={14} color="#0b0e1a" strokeWidth={2.5} />
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-10 z-10 w-6 h-6 rounded-full border flex items-center justify-center transition-colors"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-md)',
          color: 'var(--text-muted)',
        }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 min-h-0">
        {!collapsed && (
          <>
            {/* Upload section */}
            <section className="px-3 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'var(--text-muted)' }}>
                My Documents
              </p>
              <UploadButton onUploaded={fetchDocs} />
            </section>

            <div className="h-px mx-3" style={{ background: 'var(--border)' }} />

            {/* Doc list */}
            <section className="space-y-1">
              <DocumentList documents={documents} loading={docsLoading} onDelete={handleDelete} />
            </section>
          </>
        )}

        {collapsed && (
          <div className="flex flex-col items-center gap-3 pt-2">
            <SidebarIconBtn
              icon={<FolderOpen size={16} />}
              tooltip="Documents"
              onClick={onToggle}
            />
          </div>
        )}
      </div>

      {/* Tip banner */}
      {!collapsed && (
        <div className="mx-3 mb-3 p-3 rounded-xl" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
          <div className="flex gap-2">
            <Sparkles size={13} className="shrink-0 mt-0.5" style={{ color: 'var(--accent-amber)' }} />
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Upload any PDF — notes, textbooks, PYQs — and ask questions from it alongside NCERT.
            </p>
          </div>
        </div>
      )}

      {/* Footer / User */}
      <div className="border-t px-3 py-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold uppercase"
               style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--accent-amber)' }}>
            {emailLabel[0]}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>{emailLabel}</p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="shrink-0 p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
                title="Sign out"
              >
                <LogOut size={13} className="text-red-400" />
              </button>
            </>
          )}
          {collapsed && (
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors" title="Sign out">
              <LogOut size={13} className="text-red-400" />
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

function SidebarIconBtn({ icon, tooltip, onClick }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
      style={{ color: 'var(--text-secondary)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {icon}
    </button>
  )
}
