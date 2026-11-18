import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage, getFieldErrors } from '../api/client.js'
import AuthShell from '../components/AuthShell.jsx'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/Toast.jsx'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

const INITIAL = {
  name: '',
  email: '',
  organization: '',
  password: '',
  password_confirmation: '',
  requested_role: 'reader',
}

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const user = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        requested_role: form.requested_role,
        ...(form.organization ? { organization: form.organization } : {}),
      })

      if (form.requested_role === 'editor' && user?.role !== 'editor') {
        toast.info('Account created. Your editor request is pending admin approval.')
      } else {
        toast.success('Account created. Welcome to Bantay Cordova.')
      }
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to create your account.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  function fieldError(name) {
    return errors[name]?.[0]
  }

  return (
    <AuthShell
      title="Create an account"
      subtitle="Register to chat with the assistant. Editors create and manage their own stories."
      footer={
        <>
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={update('name')}
            className={inputClass}
            aria-invalid={Boolean(fieldError('name'))}
          />
          {fieldError('name') && <p className="mt-1 text-xs text-rose-600">{fieldError('name')}</p>}
        </div>

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
            aria-invalid={Boolean(fieldError('email'))}
          />
          {fieldError('email') && <p className="mt-1 text-xs text-rose-600">{fieldError('email')}</p>}
        </div>

        <div>
          <label htmlFor="organization" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Organization <span className="font-normal text-ocean-600">(optional)</span>
          </label>
          <input
            id="organization"
            type="text"
            autoComplete="organization"
            value={form.organization}
            onChange={update('organization')}
            placeholder="Barangay, school, or civic group"
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Password
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
            aria-invalid={Boolean(fieldError('password'))}
          />
          {fieldError('password') && <p className="mt-1 text-xs text-rose-600">{fieldError('password')}</p>}
        </div>

        <div>
          <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-ocean-900">
            Confirm password
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

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ocean-900">I am registering as</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              { value: 'reader', label: 'Reader', help: 'Read news and use the assistant' },
              { value: 'editor', label: 'Editor', help: 'Write and manage my own stories' },
            ].map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                  form.requested_role === option.value
                    ? 'border-ocean-500 bg-ocean-50'
                    : 'border-ocean-100 bg-white hover:bg-surface'
                }`}
              >
                <input
                  type="radio"
                  name="requested_role"
                  value={option.value}
                  checked={form.requested_role === option.value}
                  onChange={update('requested_role')}
                  className="mt-0.5 h-4 w-4 border-ocean-300 text-ocean-500 focus:ring-ocean-500"
                />
                <span>
                  <span className="block font-semibold text-ocean-900">{option.label}</span>
                  <span className="block text-xs text-ocean-600">{option.help}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-800">
            Editor accounts require admin approval. You can read news immediately while your
            editor request is reviewed.
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600 disabled:opacity-60"
        >
          {busy ? <Spinner label="Creating account…" className="[&_span]:text-white" /> : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
