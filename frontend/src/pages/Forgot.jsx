import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage, getFieldErrors } from '../api/client.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

export default function Forgot() {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    setMessage('')
    try {
      const { data } = await api.post('/forgot-password', { email })
      setMessage(data?.message || 'If that email exists, a reset link has been sent.')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send a reset link.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email you a secure link to reset your password."
      footer={
        <Link to="/login" className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email[0]}</p>}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60"
        >
          {busy ? <Spinner label="Sending…" className="[&_span]:text-white" /> : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}
