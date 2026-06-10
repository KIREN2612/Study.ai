import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import ChatWindow from '../components/ChatWindow'

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) setMobileSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(s => !s)}
        />
      </div>

      {/* ── Mobile sidebar overlay ── */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileSidebarOpen(false)}
          />
          {/* Panel */}
          <div className="relative z-50 h-full" style={{ width: '280px' }}>
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
            />
          </div>
          {/* Close button */}
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-12 border-b shrink-0"
             style={{ borderColor: 'var(--border)', background: 'var(--bg-surface)' }}>
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
          <div className="w-8" /> {/* Spacer */}
        </div>

        <ChatWindow />
      </main>
    </div>
  )
}
