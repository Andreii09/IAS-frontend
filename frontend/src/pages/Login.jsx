import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage, getFieldErrors } from '../api/client.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/Toast.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

export default function Login() {
  const { login, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const redirectTo = location.state?.from?.pathname || '/'
  const notice = location.state?.message

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      await login(form)
      toast.success('Welcome back.')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner label="Loading…" />
      </div>
    )
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your resident account and the news assistant."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
            Create a resident account
          </Link>
        </>
      }
    >
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" role="status">
          {notice}
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
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
            className={inputClass}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="mt-1 text-xs text-rose-600">
              {errors.email[0]}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-semibold text-ocean-900">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={update('password')}
            className={inputClass}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
          />
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-rose-600">
              {errors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60"
        >
          {busy ? <Spinner label="Signing in…" className="[&_span]:text-white" /> : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
