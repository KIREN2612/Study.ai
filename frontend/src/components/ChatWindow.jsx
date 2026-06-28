// src/components/ChatWindow.jsx
import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Globe, Zap, BookOpen, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'
import { askAPI } from '../api/client'
import MessageBubble from './MessageBubble'
import SourcesPanel from './SourcesPanel'

const WELCOME = {
  id: 'welcome',
  role: 'assistant',
  content: `Hi! I'm **Study.AI**, your personal study assistant.

Upload any PDF — textbooks, notes, past papers — and ask me questions from it. Toggle web search on for live answers from the internet.

**Try:**
- Upload your notes → *"Summarise the key points"*
- *"Explain Newton's laws"* with web search on
- *"What are important JEE Physics topics?"*`,
}


export default function ChatWindow() {
  const [messages,       setMessages]       = useState([WELCOME])
  const [input,          setInput]          = useState('')
  const [loading,        setLoading]        = useState(false)
  const [webSearch,      setWebSearch]      = useState(false)
  const [sources,        setSources]        = useState([])
  const [showSources,    setShowSources]    = useState(false)
  const [showScrollBtn,  setShowScrollBtn]  = useState(false)

  const bottomRef = useRef(null)
  const listRef   = useRef(null)
  const inputRef  = useRef(null)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
  }, [])

  useEffect(() => { scrollToBottom(false) }, [messages.length])

  function handleScroll() {
    if (!listRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 120)
  }

  async function send() {
    const q = input.trim()
    if (!q || loading) return
    setInput('')

    const userMsg   = { id: Date.now(),     role: 'user',      content: q }
    const typingMsg = { id: 'typing',       role: 'assistant', content: '', isTyping: true }

    setMessages(prev => [...prev, userMsg, typingMsg])
    setLoading(true)
    setSources([])
    setShowSources(false)
    scrollToBottom()

    try {
      const res = await askAPI.ask(q, webSearch)
      const { answer, sources: srcs } = res.data

      const assistantMsg = { id: Date.now() + 1, role: 'assistant', content: answer, webSearch }

      setMessages(prev => prev.filter(m => m.id !== 'typing').concat(assistantMsg))

      if (srcs?.length) {
        setSources(srcs)
        setShowSources(true)
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== 'typing'))
      toast.error(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function clearChat() {
    setMessages([WELCOME])
    setSources([])
    setShowSources(false)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 h-14 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            Study Session
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Web search toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Globe size={14} style={{ color: webSearch ? '#a5b4fc' : 'var(--text-muted)' }} />
            <span
              className="text-xs font-medium hidden sm:inline"
              style={{ color: webSearch ? '#a5b4fc' : 'var(--text-muted)' }}
            >
              Web search
            </span>
            <button
              role="switch"
              aria-checked={webSearch}
              onClick={() => setWebSearch(s => !s)}
              className="relative w-9 h-5 rounded-full transition-colors duration-200 outline-none"
              style={{ background: webSearch ? 'rgba(99,102,241,0.5)' : 'var(--border-md)' }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm transition-transform duration-200"
                style={{
                  background: webSearch ? '#a5b4fc' : 'var(--text-muted)',
                  transform:  webSearch ? 'translateX(16px)' : 'translateX(0)',
                }}
              />
            </button>
          </label>

          {/* Sources toggle */}
          {sources.length > 0 && (
            <button
              onClick={() => setShowSources(s => !s)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: showSources ? 'rgba(245,158,11,0.12)' : 'var(--bg-card)',
                color:      showSources ? 'var(--accent-amber)'    : 'var(--text-secondary)',
                border: '1px solid ' + (showSources ? 'rgba(245,158,11,0.2)' : 'var(--border)'),
              }}
            >
              <BookOpen size={11} />
              Sources ({sources.length})
            </button>
          )}

          {messages.length > 1 && (
            <button
              onClick={clearChat}
              className="text-xs px-2.5 py-1 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Message list ─────────────────────────────────────────────────── */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-5 space-y-5"
      >
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {showSources && sources.length > 0 && (
          <div className="pl-10">
            <SourcesPanel sources={sources} visible={showSources} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Scroll-to-bottom button ──────────────────────────────────────── */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-md)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowDown size={14} />
        </button>
      )}

      {/* ── Input area ───────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 sm:px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>

        {/* Web search active notice */}
        {webSearch && (
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span className="text-[11px]" style={{ color: '#a5b4fc' }}>
              Web search is on — answers will include live results
            </span>
          </div>
        )}

        {/* Textarea + send */}
        <div
          className="flex items-end gap-2 rounded-2xl p-3 transition-all"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-md)' }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'}
          onBlurCapture={e  => e.currentTarget.style.borderColor = 'var(--border-md)'}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={handleKey}
            placeholder={loading ? 'Getting your answer…' : 'Ask anything about Physics, Chemistry, Biology…'}
            disabled={loading}
            rows={1}
            className="flex-1 resize-none text-sm leading-relaxed bg-transparent outline-none disabled:opacity-50"
            style={{ color: 'var(--text-primary)', maxHeight: '140px', minHeight: '22px' }}
          />

          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200"
            style={{
              background: input.trim() && !loading
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'var(--bg-surface)',
              color: input.trim() && !loading ? '#0b0e1a' : 'var(--text-muted)',
            }}
          >
            {loading
              ? <Zap size={14} className="animate-pulse" style={{ color: '#f59e0b' }} />
              : <Send size={14} />
            }
          </button>
        </div>

        <p className="text-center text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
          Enter to send · Shift+Enter for new line · Upload a PDF to get started
        </p>
      </div>
    </div>
  )
}