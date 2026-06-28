import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { BookOpen, User, Globe, Copy, Check } from 'lucide-react'
import { useState } from 'react'

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors opacity-0 group-hover:opacity-100"
      style={{ color: copied ? '#86efac' : 'var(--text-muted)', background: 'var(--bg-surface)' }}
      title="Copy answer"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="typing-dot" />
      <span className="typing-dot" />
      <span className="typing-dot" />
    </div>
  )
}

export default function MessageBubble({ message }) {
  const { role, content, isTyping, webSearch } = message
  const isUser = role === 'user'

  return (
    <div className={`flex gap-3 msg-animate ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 ${
        isUser
          ? 'bg-amber-500/20'
          : 'bg-indigo-500/15'
      }`}>
        {isUser
          ? <User size={14} style={{ color: 'var(--accent-amber)' }} />
          : <BookOpen size={14} style={{ color: '#a5b4fc' }} />
        }
      </div>

      {/* Bubble */}
      <div className={`group max-w-[82%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Web search badge */}
        {!isUser && webSearch && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
               style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.18)' }}>
            <Globe size={9} />
            Web search included
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-2xl text-sm ${
            isUser
              ? 'rounded-tr-sm'
              : 'rounded-tl-sm'
          }`}
          style={isUser ? {
            background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))',
            border: '1px solid rgba(245,158,11,0.2)',
            color: '#fef3c7',
          } : {
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {isTyping ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose-study">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* Actions row */}
        {!isUser && !isTyping && (
          <div className="flex items-center gap-1 ml-1">
            <CopyButton text={content} />
          </div>
        )}
      </div>
    </div>
  )
}
