import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage, getFieldErrors } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Spinner from '../../components/Spinner.jsx'
import { CheckIcon, CopyIcon, KeyIcon, PlusIcon, TrashIcon } from '../../components/Icons.jsx'
import { useToast } from '../../components/Toast.jsx'
import { formatDate } from '../../lib/format.js'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

const EMPTY_FORM = { name: '', user_id: '', abilities: 'news:read', expires_in_days: '' }

export default function Tokens() {
  const toast = useToast()

  const [tokens, setTokens] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [creating, setCreating] = useState(false)

  const [plainToken, setPlainToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/tokens')
      .then(({ data }) => {
        if (active) setTokens(Array.isArray(data?.data) ? data.data : [])
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load access tokens.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  useEffect(() => {
    let active = true
    api
      .get('/admin/users', { params: { page: 1 } })
      .then(({ data }) => {
        if (active) setUsers(Array.isArray(data?.data) ? data.data : [])
      })
      .catch(() => {
        if (active) setUsers([])
      })
    return () => {
      active = false
    }
  }, [])

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  }

  async function handleCreate(event) {
    event.preventDefault()
    setCreating(true)
    setFormError('')
    setFieldErrors({})
    setCopied(false)

    const abilities = form.abilities
      .split(',')
      .map((ability) => ability.trim())
      .filter(Boolean)

    const payload = {
      name: form.name.trim(),
      abilities: abilities.length ? abilities : ['news:read'],
      ...(form.user_id ? { user_id: Number(form.user_id) } : {}),
      ...(form.expires_in_days ? { expires_in_days: Number(form.expires_in_days) } : {}),
    }

    try {
      const { data } = await api.post('/admin/tokens', payload)
      setPlainToken(data?.plain_text_token || '')
      setForm({ ...EMPTY_FORM, user_id: form.user_id })
      toast.success('Access token created. Copy it now — it is shown only once.')
      setReloadKey((key) => key + 1)
    } catch (err) {
      setFormError(getErrorMessage(err, 'Unable to create the token.'))
      setFieldErrors(getFieldErrors(err))
    } finally {
      setCreating(false)
    }
  }

  async function copyToken() {
    if (!plainToken) return
    try {
      await navigator.clipboard.writeText(plainToken)
      setCopied(true)
      toast.success('Token copied to the clipboard.')
      window.setTimeout(() => setCopied(false), 2500)
    } catch {
      toast.error('Copy failed. Select the token text and copy it manually.')
    }
  }

  async function revokeToken() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const { data } = await api.delete(`/admin/tokens/${revokeTarget.id}`)
      toast.success(data?.message || 'Token revoked.')
      setRevokeTarget(null)
      setReloadKey((key) => key + 1)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to revoke the token.'))
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
          <span className="mx-2 text-ocean-300">/</span>
          <span className="text-ocean-600">Access tokens</span>
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
          Access tokens
        </h1>
        <p className="mt-1 text-sm text-ocean-600">
          Issue scoped personal access tokens for integrations. The plaintext value is displayed
          exactly once.
        </p>
      </header>

      {plainToken && (
        <section
          className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 shadow-sm"
          aria-label="New token"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">
              <CheckIcon className="h-3.5 w-3.5" />
              Token created
            </Badge>
            <p className="text-sm font-semibold text-emerald-900">
              Copy this token now. It will not be shown again.
            </p>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-emerald-200 bg-white px-3 py-2.5 font-mono text-xs text-ocean-900">
              {plainToken}
            </code>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={copyToken}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => setPlainToken('')}
                className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                Dismiss
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm" aria-labelledby="create-token-heading">
        <h2 id="create-token-heading" className="text-base font-bold text-ocean-900">
          Create a token
        </h2>

        {formError && (
          <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreate} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="token-name" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Name <span className="text-rose-600">*</span>
            </label>
            <input
              id="token-name"
              type="text"
              required
              value={form.name}
              onChange={update('name')}
              placeholder="Mobile app"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.name)}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name[0]}</p>}
          </div>

          <div>
            <label htmlFor="token-owner" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Owner
            </label>
            <select id="token-owner" value={form.user_id} onChange={update('user_id')} className={inputClass}>
              <option value="">Myself</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            {fieldErrors.user_id && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.user_id[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="token-abilities" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Abilities <span className="text-rose-600">*</span>
            </label>
            <input
              id="token-abilities"
              type="text"
              required
              value={form.abilities}
              onChange={update('abilities')}
              placeholder="news:read, news:write"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.abilities)}
              aria-describedby="abilities-help"
            />
            <p id="abilities-help" className="mt-1 text-xs text-ocean-600">
              Comma separated.
            </p>
            {fieldErrors.abilities && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.abilities[0]}</p>
            )}
          </div>

          <div>
            <label htmlFor="token-expiry" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Expires in days <span className="font-normal text-ocean-600">(optional)</span>
            </label>
            <input
              id="token-expiry"
              type="number"
              min="1"
              value={form.expires_in_days}
              onChange={update('expires_in_days')}
              placeholder="90"
              className={inputClass}
              aria-invalid={Boolean(fieldErrors.expires_in_days)}
            />
            {fieldErrors.expires_in_days && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.expires_in_days[0]}</p>
            )}
          </div>

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-ocean-600 disabled:opacity-60"
            >
              <PlusIcon className="h-4 w-4" />
              {creating ? 'Creating…' : 'Create token'}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-ocean-100 bg-white">
          <Spinner label="Loading tokens…" />
        </div>
      ) : tokens.length === 0 ? (
        <EmptyState
          icon={KeyIcon}
          title="No access tokens"
          description="Create a scoped token when an integration needs API access."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <caption className="sr-only">Personal access tokens</caption>
              <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Token</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Owner</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Abilities</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last used</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Expires</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100">
                {tokens.map((token) => (
                  <tr key={token.id} className="hover:bg-surface/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ocean-900">{token.name}</p>
                      <p className="text-xs text-ocean-600">Created {formatDate(token.created_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-ocean-900">{token.owner?.name || '—'}</p>
                      <p className="text-xs text-ocean-600">{token.owner?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(token.abilities || []).length ? (
                          token.abilities.map((ability) => (
                            <Badge key={ability} tone="neutral">{ability}</Badge>
                          ))
                        ) : (
                          <span className="text-ocean-600">None</span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ocean-600">
                      {token.last_used_at ? formatDate(token.last_used_at, { withTime: true }) : 'Never'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-ocean-600">
                      {token.expires_at ? formatDate(token.expires_at, { withTime: true }) : 'No expiry'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setRevokeTarget(token)}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        <TrashIcon className="h-3.5 w-3.5" />
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(revokeTarget)}
        title="Revoke this token?"
        description={
          revokeTarget
            ? `“${revokeTarget.name}” will stop working immediately. Integrations using it must be reconfigured.`
            : ''
        }
        confirmLabel="Revoke token"
        busy={revoking}
        onConfirm={revokeToken}
        onClose={() => setRevokeTarget(null)}
      />
    </div>
  )
}
