// src/components/FlashcardPanel.jsx
import { useState, useEffect } from 'react'
import {
  Layers, ChevronLeft, ChevronRight, RotateCcw,
  Loader, AlertCircle, BookOpen, Hash, Library,
  RefreshCw, Plus, Minus,
} from 'lucide-react'
import { flashcardsAPI } from '../api/flashcards'
import toast from 'react-hot-toast'

// ─── Single flippable card ───────────────────────────────────────────────────
function FlipCard({ card, index, total }) {
  const [flipped, setFlipped] = useState(false)

  // Reset flip when card changes
  useEffect(() => { setFlipped(false) }, [index])

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Counter */}
      <div className="flex items-center gap-1.5">
        <Hash size={11} style={{ color: 'var(--text-muted)' }} />
        <span className="text-[11px] font-medium tabular-nums" style={{ color: 'var(--text-muted)' }}>
          {index + 1} / {total}
        </span>
      </div>

      {/* Card face */}
      <div
        onClick={() => setFlipped(f => !f)}
        className="w-full max-w-xl rounded-2xl p-8 cursor-pointer select-none transition-all duration-200 active:scale-[0.99]"
        style={{
          background: flipped
            ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.05))'
            : 'var(--bg-card)',
          border: flipped
            ? '1px solid rgba(245,158,11,0.25)'
            : '1px solid var(--border-md)',
          minHeight: '200px',
        }}
      >
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-5">
          <div
            className="px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest"
            style={{
              background: flipped ? 'rgba(245,158,11,0.12)' : 'var(--bg-surface)',
              color: flipped ? 'var(--accent-amber)' : 'var(--text-muted)',
              border: flipped ? '1px solid rgba(245,158,11,0.2)' : '1px solid var(--border)',
            }}
          >
            {flipped ? 'Answer' : 'Question'}
          </div>
        </div>

        {/* Content */}
        <p
          className="text-base leading-relaxed font-medium"
          style={{ color: flipped ? 'var(--text-primary)' : 'var(--text-secondary)' }}
        >
          {flipped ? card.answer : card.question}
        </p>

        {/* Flip hint */}
        <p className="mt-6 text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {flipped ? 'Click to see question' : 'Click to reveal answer'}
        </p>
      </div>
    </div>
  )
}

// ─── Progress bar ────────────────────────────────────────────────────────────
function ProgressBar({ current, total }) {
  const pct = total > 0 ? ((current + 1) / total) * 100 : 0
  return (
    <div className="w-full max-w-xl h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}
      />
    </div>
  )
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function EmptyState({ onGenerate, generating }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 py-16 px-6">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)' }}
      >
        <Layers size={24} style={{ color: 'var(--accent-amber)' }} />
      </div>
      <div className="text-center space-y-1.5">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          No flashcards yet
        </p>
        <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Generate flashcards from the loaded NCERT corpus or from a specific document you have uploaded.
        </p>
      </div>
      <button
        onClick={onGenerate}
        disabled={generating}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#0b0e1a',
          opacity: generating ? 0.6 : 1,
        }}
      >
        {generating
          ? <Loader size={14} className="animate-spin" />
          : <Layers size={14} />
        }
        {generating ? 'Generating…' : 'Generate flashcards'}
      </button>
    </div>
  )
}

// ─── Main panel ──────────────────────────────────────────────────────────────
export default function FlashcardPanel({ activeDocId }) {
  const [cards, setCards]         = useState([])
  const [index, setIndex]         = useState(0)
  const [generating, setGenerating] = useState(false)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [source, setSource]       = useState('corpus')   // 'corpus' | 'doc'
  const [numCards, setNumCards]   = useState(10)
  const [topic, setTopic]         = useState('')
  const [error, setError]         = useState(null)

  // When a document becomes active, try to load existing cards for it
  useEffect(() => {
    if (!activeDocId) return
    setSource('doc')
    loadExistingCards(activeDocId)
  }, [activeDocId])

  async function loadExistingCards(docId) {
    setLoadingExisting(true)
    setError(null)
    try {
      const res = await flashcardsAPI.getByDoc(docId)
      const fetched = res.data?.flashcards || []
      if (fetched.length > 0) {
        setCards(fetched)
        setIndex(0)
      }
    } catch {
      // 404 is fine — just means no cards yet, don't surface as error
    } finally {
      setLoadingExisting(false)
    }
  }

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const payload = {
        num_cards: numCards,
        ...(source === 'doc' && activeDocId
          ? { doc_id: activeDocId }
          : { topic: topic.trim() || 'NCERT Physics' }
        ),
      }
      const res = await flashcardsAPI.generate(payload)
      const fetched = res.data?.flashcards || []
      setCards(fetched)
      setIndex(0)
      toast.success(`${fetched.length} flashcards generated`)
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to generate flashcards'
      setError(msg)
      toast.error(msg)
    } finally {
      setGenerating(false)
    }
  }

  function prev() { setIndex(i => Math.max(0, i - 1)) }
  function next() { setIndex(i => Math.min(cards.length - 1, i + 1)) }

  function handleKey(e) {
    if (e.key === 'ArrowLeft')  prev()
    if (e.key === 'ArrowRight') next()
  }

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Source selector */}
      <div
        className="flex items-center gap-0.5 rounded-lg p-0.5"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setSource('corpus')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
          style={{
            background: source === 'corpus' ? 'var(--bg-card)' : 'transparent',
            color: source === 'corpus' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: source === 'corpus' ? '1px solid var(--border-md)' : '1px solid transparent',
          }}
        >
          <Library size={11} />
          <span className="hidden sm:inline">Corpus</span>
        </button>
        <button
          onClick={() => setSource('doc')}
          disabled={!activeDocId}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: source === 'doc' ? 'var(--bg-card)' : 'transparent',
            color: source === 'doc' ? 'var(--text-primary)' : 'var(--text-muted)',
            border: source === 'doc' ? '1px solid var(--border-md)' : '1px solid transparent',
          }}
          title={!activeDocId ? 'Select a document in the sidebar first' : ''}
        >
          <BookOpen size={11} />
          <span className="hidden sm:inline">My Doc</span>
        </button>
      </div>

      {/* Card count */}
      <div
        className="flex items-center gap-1 rounded-lg px-2 py-1"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setNumCards(n => Math.max(5, n - 5))}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Minus size={10} />
        </button>
        <span className="text-xs tabular-nums font-medium w-6 text-center" style={{ color: 'var(--text-primary)' }}>
          {numCards}
        </span>
        <button
          onClick={() => setNumCards(n => Math.min(30, n + 5))}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Plus size={10} />
        </button>
      </div>

      {/* Topic input (corpus mode only) */}
      {source === 'corpus' && (
        <input
          type="text"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="Topic (e.g. Newton's laws)"
          className="text-xs px-3 py-1.5 rounded-lg outline-none flex-1 min-w-0"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.35)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      )}

      {/* Generate / regenerate */}
      <button
        onClick={generate}
        disabled={generating}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
        style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#0b0e1a',
          opacity: generating ? 0.6 : 1,
        }}
      >
        {generating
          ? <Loader size={12} className="animate-spin" />
          : cards.length > 0
            ? <RefreshCw size={12} />
            : <Layers size={12} />
        }
        {generating ? 'Generating…' : cards.length > 0 ? 'Regenerate' : 'Generate'}
      </button>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col h-full min-h-0 outline-none"
      tabIndex={0}
      onKeyDown={handleKey}
    >
      {/* Toolbar row */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b shrink-0 gap-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2 shrink-0">
          <Layers size={14} style={{ color: 'var(--accent-amber)' }} />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Flashcards
          </span>
          {cards.length > 0 && (
            <span
              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--accent-amber)' }}
            >
              {cards.length}
            </span>
          )}
        </div>
        {toolbar}
      </div>

      {/* Body */}
      {loadingExisting ? (
        <div className="flex-1 flex items-center justify-center gap-2" style={{ color: 'var(--text-muted)' }}>
          <Loader size={16} className="animate-spin" />
          <span className="text-sm">Loading saved cards…</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <AlertCircle size={20} className="text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={generate}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Try again
          </button>
        </div>
      ) : cards.length === 0 ? (
        <EmptyState onGenerate={generate} generating={generating} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8 min-h-0 overflow-y-auto">
          <ProgressBar current={index} total={cards.length} />
          <FlipCard card={cards[index]} index={index} total={cards.length} />

          {/* Navigation */}
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              disabled={index === 0}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-md)', color: 'var(--text-secondary)' }}
            >
              <ChevronLeft size={16} />
            </button>

            {/* Dot indicators (max 10 shown) */}
            <div className="flex items-center gap-1">
              {cards.slice(0, Math.min(cards.length, 10)).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === index ? '20px' : '6px',
                    height: '6px',
                    background: i === index
                      ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                      : 'var(--border-md)',
                  }}
                />
              ))}
              {cards.length > 10 && (
                <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>
                  +{cards.length - 10}
                </span>
              )}
            </div>

            <button
              onClick={next}
              disabled={index === cards.length - 1}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-md)', color: 'var(--text-secondary)' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            Arrow keys to navigate · Click card to flip
          </p>
        </div>
      )}
    </div>
  )
}