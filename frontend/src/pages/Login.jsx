import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage, getFieldErrors } from '../api/client.js'
import { landingPathFor } from '../lib/format.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'
import { EyeIcon, EyeOffIcon, ShieldIcon } from '../components/Icons.jsx'
import { useToast } from '../components/Toast.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 transition focus:border-ocean-300 focus:bg-white focus:outline-none'

function validate(values) {
  const next = {}
  const identity = values.email.trim()

  if (!identity) {
    next.email = ['Please enter your username or email.']
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identity)) {
    next.email = ['Enter a valid email address.']
  }

  if (!values.password) next.password = ['Please enter your password.']

  return next
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const notice = location.state?.message

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setErrors((current) => ({ ...current, [field]: undefined }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const clientErrors = validate(form)
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors)
      setError('')
      return
    }

    setBusy(true)
    setError('')
    setErrors({})

    try {
      const nextUser = await login({ email: form.email.trim(), password: form.password })
      toast.success('Welcome back.')

      const requested = location.state?.from?.pathname
      navigate(requested && requested !== '/login' ? requested : landingPathFor(nextUser), {
        replace: true,
      })
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to sign in.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Access your resident account and the news assistant."
      footer={
        <>
          New here?{' '}
          <Link
            to="/register"
            className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
          >
            Create a resident account
          </Link>
        </>
      }
    >
      {notice && (
        <div
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          role="status"
        >
          {notice}
        </div>
      )}
      {error && (
        <div
          className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          role="alert"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Username or email
          </label>
          <input
            id="email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="username"
            placeholder="you@example.com"
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              required
              value={form.password}
              onChange={update('password')}
              className={`${inputClass} pr-12`}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-ocean-600 transition hover:text-ocean-800"
            >
              {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="mt-1 text-xs text-rose-600">
              {errors.password[0]}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? <Spinner label="Signing in…" className="[&_span]:text-white" /> : 'Sign in'}
        </button>

        <p className="flex items-center justify-center gap-1.5 pt-1 text-center text-[11px] text-ocean-600">
          <ShieldIcon className="h-3.5 w-3.5 shrink-0" />
          Secure session · credentials are never stored in your browser
        </p>
      </form>
    </AuthShell>
  )
}
