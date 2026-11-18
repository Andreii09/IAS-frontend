import { useEffect, useRef, useState } from 'react'
import { AlertIcon, CloseIcon } from './Icons.jsx'
import Spinner from './Spinner.jsx'

/**
 * Accessible confirmation modal.
 * `requirePhrase` shows an "I understand" checkbox that gates confirmation.
 */
export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  requirePhrase = false,
  phraseLabel = 'I understand',
  busy = false,
  onConfirm,
  onClose,
}) {
  const [checked, setChecked] = useState(false)
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) {
      setChecked(false)
      return undefined
    }
    confirmRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onClose])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 focus-visible:ring-rose-500'
      : 'bg-ocean-500 hover:bg-ocean-600'

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ocean-900/50 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="dialog-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1 text-ocean-600 hover:bg-ocean-50 disabled:opacity-40"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <div className="flex gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-ocean-50 text-ocean-600'
            }`}
          >
            <AlertIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-lg font-semibold text-ocean-900">
              {title}
            </h2>
            {description && (
              <p id="confirm-description" className="mt-1 text-sm leading-relaxed text-ocean-600">
                {description}
              </p>
            )}
          </div>
        </div>

        {requirePhrase && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg bg-surface p-3 text-sm text-ocean-700">
            <input
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
            />
            <span>{phraseLabel}</span>
          </label>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-ocean-100 bg-white px-4 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50 disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={busy || (requirePhrase && !checked)}
            className={`inline-flex min-w-24 items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${confirmClass}`}
          >
            {busy ? <Spinner label="Working…" className="[&_span]:text-white" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
