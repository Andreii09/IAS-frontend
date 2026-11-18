import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { api, getErrorMessage, getFieldErrors } from '../api/client.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/Toast.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

export default function ChangePassword() {
  const { updateUser, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const forced = Boolean(location.state?.forced || user?.must_change_password)

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
      const { data } = await api.post('/change-password', form)
      setMessage(data?.message || 'Password updated successfully.')
      updateUser({ must_change_password: false })
      setForm({ current_password: '', password: '', password_confirmation: '' })
      toast.success('Password updated.')
      if (forced) {
        window.setTimeout(() => navigate('/'), 900)
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update your password.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Change password"
      subtitle="Choose a strong password you do not use anywhere else."
      footer={
        <Link to="/" className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
          Back to news feed
        </Link>
      }
    >
      {forced && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" role="status">
          An administrator requires you to set a new password before continuing.
        </div>
      )}
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
          <label htmlFor="current_password" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Current password
          </label>
          <input
            id="current_password"
            type="password"
            autoComplete="current-password"
            required
            value={form.current_password}
            onChange={update('current_password')}
            className={inputClass}
            aria-invalid={Boolean(errors.current_password)}
          />
          {errors.current_password && (
            <p className="mt-1 text-xs text-rose-600">{errors.current_password[0]}</p>
          )}
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
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60"
        >
          {busy ? <Spinner label="Saving…" className="[&_span]:text-white" /> : 'Update password'}
        </button>
      </form>
    </AuthShell>
  )
}
