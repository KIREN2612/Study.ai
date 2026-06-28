import { useState } from 'react'
import { FileText, Globe, ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react'

function isWebSource(source) {
  return typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))
}

function getDisplayName(source) {
  if (isWebSource(source)) {
    try {
      return new URL(source).hostname.replace('www.', '')
    } catch {
      return source
    }
  }
  return source?.replace(/\.pdf$/i, '') || 'Unknown'
}

function SourceCard({ chunk, index }) {
  const [expanded, setExpanded] = useState(false)
  const web = isWebSource(chunk.source)

  return (
    <div
      className={`source-card rounded-xl overflow-hidden transition-all duration-200 ${web ? 'web-source' : ''}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Icon */}
        <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
          web ? 'bg-indigo-500/15' : 'bg-amber-500/10'
        }`}>
          {web
            ? <Globe size={13} style={{ color: '#a5b4fc' }} />
            : <FileText size={13} style={{ color: 'var(--accent-amber)' }} />
          }
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          {/* Source name */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: web ? '#a5b4fc' : 'var(--accent-amber)' }}>
              {web ? 'Web' : 'PDF'}
            </span>
            {chunk.page_num && chunk.page_num !== 'web' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)' }}>
                p.{chunk.page_num}
              </span>
            )}
          </div>
          <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}
             title={chunk.source}>
            {getDisplayName(chunk.source)}
          </p>
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
            {chunk.excerpt}
          </p>
        </div>

        <div className="shrink-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Expanded full text */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)' }}>
            {chunk.full_text}
          </div>
          {web && (
            <a
              href={chunk.source}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: '#93c5fd' }}
            >
              <ExternalLink size={11} />
              Open source
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function SourcesPanel({ sources, visible }) {
  if (!visible || !sources?.length) return null

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-3 px-1">
        <BookOpen size={13} style={{ color: 'var(--accent-amber)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Sources used
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)' }}>
          {sources.length}
        </span>
      </div>
      <div className="space-y-2">
        {sources.map((chunk, i) => (
          <SourceCard key={`${chunk.source}-${chunk.chunk_id ?? i}`} chunk={chunk} index={i} />
        ))}
      </div>
    </div>
  )
}
