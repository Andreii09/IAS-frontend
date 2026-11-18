import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getErrorMessage, getFieldErrors } from '../api/client.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

export default function ResetPassword() {
  const { token } = useParams()
  const [form, setForm] = useState({ email: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    setMessage('')
    try {
      const { data } = await api.post('/reset-password', {
        token,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
      })
      setMessage(data?.message || 'Your password has been reset. You can now sign in.')
      setForm({ email: form.email, password: '', password_confirmation: '' })
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reset your password.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter the email address tied to the reset link and pick a strong password."
      footer={
        <Link to="/login" className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
          Back to sign in
        </Link>
      }
    >
      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {message}{' '}
          <Link to="/login" className="font-semibold underline underline-offset-2">
            Sign in
          </Link>
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}
      {!token && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="alert">
          This reset link is missing its token. Request a new link from the forgot-password page.
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
            value={form.email}
            onChange={update('email')}
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email[0]}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
            className={inputClass}
            aria-invalid={Boolean(errors.password)}
          />
          {errors.password && <p className="mt-1 text-xs text-rose-600">{errors.password[0]}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Confirm new password
          </label>
          <input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={update('password_confirmation')}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !token}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60"
        >
          {busy ? <Spinner label="Saving…" className="[&_span]:text-white" /> : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}
