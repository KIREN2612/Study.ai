// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react'
import { Menu, X, MessageSquare, Layers } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'
import FlashcardPanel from '../components/FlashcardPanel'

const TABS = [
  { id: 'chat',       label: 'Chat',       Icon: MessageSquare },
  { id: 'flashcards', label: 'Flashcards', Icon: Layers        },
]

export default function Dashboard() {
  const [sidebarCollapsed,  setSidebarCollapsed]  = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [activeTab,         setActiveTab]          = useState('chat')
  const [activeDocId,       setActiveDocId]        = useState(null)

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(s => !s)}
          onDocSelect={(docId) => {
            setActiveDocId(docId)
            // Switching to flashcards is intentional — remove this line
            // if you want doc selection to stay on the current tab.
            setActiveTab('flashcards')
          }}
        />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 h-full" style={{ width: '280px' }}>
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              onDocSelect={(docId) => {
                setActiveDocId(docId)
                setMobileSidebarOpen(false)
              }}
            />
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">

        {/* Mobile top bar */}
        <div
          className="md:hidden flex items-center justify-between px-4 h-12 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}
        >
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Study<span style={{ color: 'var(--accent-amber)' }}>.AI</span>
          </span>
          <div className="w-8" />
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 px-4 border-b shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)', height: '44px' }}
        >
          {TABS.map(({ id, label, Icon }) => {
            const active = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative"
                style={{
                  color:      active ? 'var(--accent-amber)' : 'var(--text-muted)',
                  background: active ? 'rgba(245,158,11,0.08)' : 'transparent',
                }}
              >
                <Icon size={13} />
                {label}
                {/* Active underline */}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                    style={{ background: 'var(--accent-amber)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* ── Tab panels ───────────────────────────────────────────────── */}
        {/* Keep both mounted so chat state is preserved when switching tabs */}
        <div className="flex-1 min-h-0 overflow-hidden" style={{ display: activeTab === 'chat' ? 'flex' : 'none', flexDirection: 'column' }}>
          <ChatWindow />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden" style={{ display: activeTab === 'flashcards' ? 'flex' : 'none', flexDirection: 'column' }}>
          <FlashcardPanel activeDocId={activeDocId} />
        </div>

      </main>
    </div>
  )
}