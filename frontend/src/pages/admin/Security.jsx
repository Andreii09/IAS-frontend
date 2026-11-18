import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Spinner from '../../components/Spinner.jsx'
import { LockIcon, RefreshIcon, ShieldIcon } from '../../components/Icons.jsx'
import { formatDate } from '../../lib/format.js'

export default function Security() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/security')
      .then(({ data: payload }) => {
        if (active) setData(payload || {})
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load security data.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const failed = Array.isArray(data?.failed_logins) ? data.failed_logins : []
  const locked = Array.isArray(data?.locked_users) ? data.locked_users : []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
            <span className="mx-2 text-ocean-300">/</span>
            <span className="text-ocean-600">Security</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            Security
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Monitor failed sign-in attempts and accounts temporarily locked by the system.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-ocean-100 bg-white px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
        >
          <RefreshIcon className="h-4 w-4" />
          Refresh
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl border border-ocean-100 bg-white">
          <Spinner label="Loading security data…" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="failed-heading">
            <div className="flex items-center gap-2 border-b border-ocean-100 px-4 py-3">
              <ShieldIcon className="h-4 w-4 text-rose-500" />
              <h2 id="failed-heading" className="text-sm font-bold text-ocean-900">
                Failed logins ({failed.length})
              </h2>
            </div>
            {failed.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={ShieldIcon}
                  title="No failed logins"
                  description="No unsuccessful sign-in attempts have been recorded."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Email</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">IP address</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ocean-100">
                    {failed.map((row, index) => (
                      <tr key={row.id ?? index} className="hover:bg-surface/70">
                        <td className="px-4 py-2.5 font-medium text-ocean-900">
                          {row.email || row.user?.email || '—'}
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-ocean-600">{row.ip || '—'}</td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-ocean-600">
                          {formatDate(row.created_at || row.attempted_at, { withTime: true })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="locked-heading">
            <div className="flex items-center gap-2 border-b border-ocean-100 px-4 py-3">
              <LockIcon className="h-4 w-4 text-amber-500" />
              <h2 id="locked-heading" className="text-sm font-bold text-ocean-900">
                Locked users ({locked.length})
              </h2>
            </div>
            {locked.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={LockIcon}
                  title="No locked accounts"
                  description="No accounts are currently locked after repeated failed sign-ins."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-sm">
                  <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-semibold">User</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Locked until</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ocean-100">
                    {locked.map((row, index) => (
                      <tr key={row.id ?? index} className="hover:bg-surface/70">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-ocean-900">{row.name || row.user?.name || '—'}</p>
                          <p className="text-xs text-ocean-600">{row.email || row.user?.email || ''}</p>
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={row.is_active ? 'success' : 'danger'}>
                            {row.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-ocean-600">
                          {formatDate(row.locked_until, { withTime: true })}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Link
                            to="/admin/users"
                            className="text-xs font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
                          >
                            Manage user
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
