import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { useToast } from './Toast.jsx'
import {
  ChatIcon,
  CloseIcon,
  InfoIcon,
  LockIcon,
  RefreshIcon,
  SendIcon,
  ShieldIcon,
} from './Icons.jsx'

const SESSION_KEY = 'bantay-cordova-chat-session'
const MAX_CHARS = 2000

const WELCOME =
  "Hi! I'm the Bantay Cordova System Assistant. I can retrieve published advisories, announcements and news, and explain accounts, admin features and how the platform works using only verified information you're allowed to see. I only answer system questions, I'm read-only and I never share private data."

const FALLBACK_REPLY =
  'The assistant is temporarily unavailable. You can keep browsing news, or try again in a moment.'

const SUGGESTIONS = {
  reader: [
    'What advisories are published?',
    'Are there any current announcements?',
    'How do I report an incident?',
  ],
  editor: [
    'What advisories are published?',
    'How do I create a story?',
    'What happens to a scheduled story?',
  ],
  admin: [
    'What advisories are published?',
    'Who can access the admin dashboard?',
    'What security features are implemented?',
  ],
}

function createSessionId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = createSessionId()
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // Private browsing with storage disabled: keep an in-memory session.
    return createSessionId()
  }
}

let messageCounter = 0
function nextId() {
  messageCounter += 1
  return `m-${messageCounter}`
}

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function roleOf(user) {
  const role = user?.role
  if (role === 'admin' || role === 'editor') return role
  return 'reader'
}

/** Inline formatting without dangerouslySetInnerHTML: model text stays inert. */
function InlineText({ value }) {
  const parts = String(value).split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  )
}

/** Render plain-text assistant answers as safe React nodes (lists + bold). */
function AnswerText({ text }) {
  return (
    <div className="space-y-1.5">
      {String(text)
        .split('\n')
        .map((line, index) => {
          const trimmed = line.trim()
          if (!trimmed) return null

          // Keep record details visually nested under their numbered entry.
          const detail = /^(Category|Published|Summary):\s*(.*)$/.exec(trimmed)
          if (detail) {
            return (
              <p key={index} className="ml-5 text-xs text-ocean-600">
                <strong className="font-semibold text-ocean-700">{detail[1]}:</strong>{' '}
                <InlineText value={detail[2]} />
              </p>
            )
          }

          const listItem = /^(\d+\.|[-*])\s+(.*)$/.exec(trimmed)
          if (listItem) {
            const numbered = /\d+\./.test(listItem[1])
            return (
              <p key={index} className="flex gap-1.5">
                <span aria-hidden="true" className="select-none font-semibold text-ocean-500">
                  {numbered ? listItem[1] : '•'}
                </span>
                <InlineText value={listItem[2]} />
              </p>
            )
          }

          return (
            <p key={index}>
              <InlineText value={trimmed} />
            </p>
          )
        })}
    </div>
  )
}

function MessageMeta({ message }) {
  if (!message.time && !message.badge) return null
  return (
    <div
      className={`mt-1 flex flex-wrap items-center gap-2 text-[10px] ${
        message.role === 'user' ? 'justify-end text-ocean-100' : 'text-ocean-600'
      }`}
    >
      {message.badge && (
        <span className="rounded-full bg-ocean-50 px-1.5 py-0.5 font-semibold text-ocean-700">
          {message.badge}
        </span>
      )}
      {message.time && <span>{message.time}</span>}
    </div>
  )
}

export default function ChatBox() {
  const { user: authUser, loading: authLoading } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(authUser)
  const [messages, setMessages] = useState([{ id: 'welcome', role: 'assistant', text: WELCOME }])
  const [suggestions, setSuggestions] = useState(SUGGESTIONS.reader)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)
  const sessionId = useRef(getSessionId())
  const lastQuestion = useRef('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Explicitly probe /me so guests get a clear sign-in prompt even on public pages.
  useEffect(() => {
    let active = true
    api
      .get('/me')
      .then(({ data }) => {
        if (active) setUser(data?.user ?? data ?? null)
      })
      .catch(() => {
        if (active) setUser(authUser ?? null)
      })
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
    // Run once on mount; auth context updates are reflected on the next open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (authUser) setUser(authUser)
  }, [authUser])

  useEffect(() => {
    if (user) setSuggestions(SUGGESTIONS[roleOf(user)] ?? SUGGESTIONS.reader)
  }, [user])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
      window.setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open, messages, busy])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !confirmClear) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, confirmClear])

  async function requestReply(text) {
    try {
      const { data } = await api.post('/chat', {
        message: text,
        session_id: sessionId.current,
      })
      const meta = data?.meta ?? {}
      if (Array.isArray(meta.suggestions) && meta.suggestions.length > 0) {
        setSuggestions(meta.suggestions)
      }

      const badge = meta.refused
        ? 'Out of scope'
        : meta.offline
          ? 'Offline answer'
          : meta.live_data
            ? 'Verified data'
            : meta.guarded
              ? 'Safety checked'
              : meta.truncated
                ? 'Shortened'
                : null

      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          text: data?.reply || FALLBACK_REPLY,
          time: nowTime(),
          badge,
        },
      ])
    } catch (error) {
      const status = error?.response?.status
      // Rate limits (429) and capacity errors (503) still return a helpful reply.
      const reply = error?.response?.data?.reply

      if (status === 401) {
        setUser(null)
        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            text: 'Your session has expired. Please sign in again to continue.',
            time: nowTime(),
            failed: true,
          },
        ])
      } else {
        const friendlyError =
          status === 503
            ? "Bantay Cordova couldn't retrieve that information right now. Please try again in a moment."
            : getErrorMessage(error, FALLBACK_REPLY)

        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            text: reply || friendlyError,
            time: nowTime(),
            badge: status === 429 ? 'Daily limit' : null,
            failed: status !== 429 && !reply,
          },
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  function sendText(text) {
    const clean = text.trim()
    if (!clean || busy || !user) return

    lastQuestion.current = clean
    setMessages((current) => [
      ...current,
      { id: nextId(), role: 'user', text: clean, time: nowTime() },
    ])
    setInput('')
    setBusy(true)
    void requestReply(clean)
  }

  function sendMessage(event) {
    event.preventDefault()
    sendText(input)
  }

  function retry() {
    if (!lastQuestion.current || busy) return
    setMessages((current) => {
      const next = [...current]
      if (next[next.length - 1]?.failed) next.pop()
      return next
    })
    sendText(lastQuestion.current)
  }

  async function clearConversation() {
    setClearing(true)
    try {
      await api.delete('/chat/session', { data: { session_id: sessionId.current } })

      // Fresh session id so no cached context can be reused after the clear.
      sessionId.current = createSessionId()
      try {
        sessionStorage.setItem(SESSION_KEY, sessionId.current)
      } catch {
        // Storage disabled: the new id stays in memory only.
      }

      setMessages([{ id: nextId(), role: 'assistant', text: WELCOME }])
      setSuggestions(SUGGESTIONS[roleOf(user)] ?? SUGGESTIONS.reader)
      setInput('')
      lastQuestion.current = ''
      setConfirmClear(false)
      toast.success('Conversation cleared.')
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not clear the conversation.'))
    } finally {
      setClearing(false)
    }
  }

  const canChat = Boolean(user) && !checking && !authLoading
  const showSuggestions = canChat && messages.length === 1 && suggestions.length > 0

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close news assistant' : 'Open news assistant'}
        aria-expanded={open}
        className="fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-ocean-500 text-white shadow-xl shadow-ocean-900/25 transition hover:bg-ocean-600 sm:bottom-6 sm:right-6"
      >
        {open ? <CloseIcon className="h-6 w-6" /> : <ChatIcon className="h-6 w-6" />}
        {!open && user && (
          <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        )}
      </button>

      {open && (
        <section
          role="dialog"
          aria-label="Bantay Cordova news assistant"
          className="dialog-in fixed bottom-24 right-4 z-50 flex h-[30rem] max-h-[calc(100vh-8rem)] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-2xl sm:bottom-28 sm:right-6 sm:w-96"
        >
          <div className="flex items-center gap-3 bg-ocean-700 px-4 py-3 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <ChatIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">Bantay Assistant</h2>
              <p className="text-[11px] text-ocean-100">Residents-only · Role-scoped answers</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={!canChat || busy || clearing}
              title="Clear conversation"
              aria-label="Clear conversation"
              className="rounded-lg p-1.5 text-ocean-100 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
            >
              <RefreshIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-ocean-100 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>

          {/* CIA triad, stated plainly for residents */}
          <div className="flex items-center justify-center gap-3 border-b border-ocean-100 bg-ocean-50 px-3 py-1.5 text-[10px] font-medium text-ocean-700">
            <InfoIcon className="h-3.5 w-3.5 shrink-0 text-ocean-500" />
            <span title="Confidentiality: only role-appropriate stories are used; personal data is masked before it leaves your device.">
              C · Private
            </span>
            <span title="Integrity: answers are grounded, checked and logged in a tamper-evident audit trail.">
              I · Checked
            </span>
            <span title="Availability: limits, retries and offline answers keep the assistant usable.">
              A · Resilient
            </span>
          </div>

          <div
            className="flex-1 space-y-3 overflow-y-auto bg-surface px-4 py-4 thin-scrollbar"
            role="log"
            aria-live="polite"
            aria-label="Conversation"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`chat-bubble-in flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                      message.role === 'user'
                        ? 'rounded-br-sm bg-ocean-500 text-white'
                        : 'rounded-bl-sm border border-ocean-100 bg-white text-ocean-900'
                    }`}
                  >
                    {message.role === 'assistant' ? <AnswerText text={message.text} /> : message.text}
                  </div>
                  <MessageMeta message={message} />
                  {message.failed && (
                    <button
                      type="button"
                      onClick={retry}
                      disabled={busy}
                      className="mt-1 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-ocean-600 hover:bg-ocean-50 disabled:opacity-50"
                    >
                      <RefreshIcon className="h-3 w-3" /> Try again
                    </button>
                  )}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="pl-1 pr-6">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ocean-600">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendText(prompt)}
                      className="rounded-full border border-ocean-100 bg-white px-3 py-1.5 text-left text-[11px] text-ocean-700 shadow-sm transition hover:border-ocean-300 hover:bg-ocean-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {busy && (
              <div className="chat-bubble-in flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-ocean-100 bg-white px-4 py-3 text-sm text-ocean-600 shadow-sm">
                  <span className="flex gap-1">
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                  </span>
                  Checking Bantay Cordova data…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {canChat ? (
            <form onSubmit={sendMessage} className="border-t border-ocean-100 bg-white p-3">
              <div className="flex items-center gap-2">
                <label htmlFor="chat-message" className="sr-only">
                  Message the assistant
                </label>
                <input
                  id="chat-message"
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about advisories, news or accounts…"
                  maxLength={MAX_CHARS}
                  disabled={busy}
                  className="min-w-0 flex-1 rounded-xl border border-ocean-100 bg-surface px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={busy || !input.trim()}
                  aria-label="Send message"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ocean-500 text-white transition hover:bg-ocean-600 disabled:opacity-40"
                >
                  <SendIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-ocean-600">
                <span className="inline-flex items-center gap-1">
                  <ShieldIcon className="h-3 w-3 shrink-0" />
                  Saved and reviewed · keep personal details out of chat
                </span>
                {input.length > MAX_CHARS * 0.8 && (
                  <span className="shrink-0 tabular-nums">
                    {input.length}/{MAX_CHARS}
                  </span>
                )}
              </div>
            </form>
          ) : (
            <div className="border-t border-ocean-100 bg-white p-5 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-ocean-50 text-ocean-500">
                <LockIcon className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-ocean-900">
                {checking || authLoading ? 'Checking your session…' : 'Sign in to use the assistant'}
              </p>
              {!checking && !authLoading && (
                <p className="mt-1 text-xs text-ocean-600">
                  The assistant is available to registered residents.{' '}
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="font-semibold text-ocean-600 underline underline-offset-2 hover:text-ocean-700"
                  >
                    Sign in
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      <ConfirmDialog
        open={confirmClear}
        title="Are you sure you want to clear this conversation?"
        description="This removes the messages in this chat only. Your account, stories and other system records are not affected."
        confirmLabel="Clear conversation"
        cancelLabel="Cancel"
        tone="danger"
        busy={clearing}
        onConfirm={clearConversation}
        onClose={() => {
          if (!clearing) setConfirmClear(false)
        }}
      />
    </>
  )
}
