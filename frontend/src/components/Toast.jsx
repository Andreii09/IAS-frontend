import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from './Icons.jsx'

const ToastContext = createContext(null)

const STYLES = {
  success: { wrap: 'border-emerald-200 bg-emerald-50', icon: 'text-emerald-600', Icon: CheckIcon },
  error: { wrap: 'border-rose-200 bg-rose-50', icon: 'text-rose-600', Icon: AlertIcon },
  info: { wrap: 'border-ocean-100 bg-ocean-50', icon: 'text-ocean-600', Icon: InfoIcon },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (message, tone = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts((current) => [...current, { id, message, tone }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
      info: (message) => show(message, 'info'),
      dismiss,
    }),
    [show, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-4 sm:translate-x-0"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => {
          const style = STYLES[toast.tone] || STYLES.info
          const Icon = style.Icon
          return (
            <div
              key={toast.id}
              className={`dialog-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg ${style.wrap}`}
              role={toast.tone === 'error' ? 'alert' : 'status'}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.icon}`} />
              <p className="flex-1 text-sm font-medium text-ocean-900">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-ocean-600 hover:bg-white/60"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside <ToastProvider>')
  return context
}
