import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth/AuthContext.jsx'
import { ChatIcon, CloseIcon, LockIcon, SendIcon } from './Icons.jsx'

const SESSION_KEY = 'bantay-cordova-chat-session'

const WELCOME =
  'Welcome to the Bantay Cordova assistant. Conversations are logged for safety and quality review. Ask me about local news, advisories, or how the platform works.'

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    // Private browsing with storage disabled: keep an in-memory session.
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

let messageCounter = 0
function nextId() {
  messageCounter += 1
  return `m-${messageCounter}`
}

export default function ChatBox() {
  const { user: authUser, loading: authLoading } = useAuth()
  const [open, setOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [user, setUser] = useState(authUser)
  const [messages, setMessages] = useState([{ id: 'welcome', role: 'assistant', text: WELCOME }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const sessionId = useRef(getSessionId())
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
    if (open) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
      window.setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open, messages, busy])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  async function sendMessage(event) {
    event.preventDefault()
    const text = input.trim()
    if (!text || busy || !user) return

    setMessages((current) => [...current, { id: nextId(), role: 'user', text }])
    setInput('')
    setBusy(true)

    try {
      const { data } = await api.post('/chat', {
        message: text,
        session_id: sessionId.current,
      })
      setMessages((current) => [
        ...current,
        {
          id: nextId(),
          role: 'assistant',
          text: data?.reply || 'I could not generate a reply. Please try again.',
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
          },
        ])
      } else {
        setMessages((current) => [
          ...current,
          {
            id: nextId(),
            role: 'assistant',
            text:
              reply ||
              'The assistant is temporarily unavailable. Please try again in a moment.',
          },
        ])
      }
    } finally {
      setBusy(false)
    }
  }

  const canChat = Boolean(user) && !checking && !authLoading

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
              <p className="text-[11px] text-ocean-100">Residents-only · Conversations are logged</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="rounded-lg p-1.5 text-ocean-100 hover:bg-white/10 hover:text-white"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
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
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                    message.role === 'user'
                      ? 'rounded-br-sm bg-ocean-500 text-white'
                      : 'rounded-bl-sm border border-ocean-100 bg-white text-ocean-900'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {busy && (
              <div className="chat-bubble-in flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-ocean-100 bg-white px-4 py-3 text-sm text-ocean-600 shadow-sm">
                  <span className="flex gap-1">
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                    <span className="thinking-dot h-1.5 w-1.5 rounded-full bg-ocean-500" />
                  </span>
                  Thinking…
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
                  placeholder="Ask about local news…"
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
              <p className="mt-2 text-center text-[10px] text-ocean-600">
                Messages are saved and may be reviewed by moderators.
              </p>
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
    </>
  )
}
