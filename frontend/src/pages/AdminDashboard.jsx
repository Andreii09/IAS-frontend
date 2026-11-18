import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client.js'
import Spinner from '../components/Spinner.jsx'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  ChartIcon,
  DocumentIcon,
  KeyIcon,
  RefreshIcon,
  ShieldIcon,
  SlidersIcon,
  UserIcon,
} from '../components/Icons.jsx'
import { formatNumber } from '../lib/format.js'

const LINKS = [
  { to: '/admin/users', label: 'Users', description: 'Roles, activation, locks', Icon: UserIcon },
  { to: '/admin/tokens', label: 'Access tokens', description: 'Issue and revoke API tokens', Icon: KeyIcon },
  { to: '/admin/audit', label: 'Audit log', description: 'Filter, export, verify chain', Icon: DocumentIcon },
  { to: '/admin/ai', label: 'AI usage', description: 'Token budget and daily usage', Icon: SlidersIcon },
  { to: '/admin/security', label: 'Security', description: 'Failed logins and locked users', Icon: ShieldIcon },
  { to: '/admin/content', label: 'Content', description: 'Revisions and deleted stories', Icon: RefreshIcon },
]

function StatCard({ label, value, hint, tone = 'default' }) {
  const toneClass =
    tone === 'danger'
      ? 'text-rose-600'
      : tone === 'success'
        ? 'text-emerald-600'
        : tone === 'warning'
          ? 'text-amber-600'
          : 'text-ocean-900'

  return (
    <div className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">{label}</p>
      <p className={`mt-2 text-3xl font-extrabold tabular-nums ${toneClass}`}>
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      {hint && <p className="mt-1 text-xs text-ocean-600">{hint}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/overview')
      .then(({ data }) => {
        if (active) setOverview(data || {})
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load the admin overview.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const stories = overview?.stories || {}
  const usersValue =
    typeof overview?.users === 'number' ? overview.users : overview?.users?.total ?? '—'

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ocean-500">Administration</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Platform health, publishing activity, and assistant usage at a glance.
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
          <Spinner label="Loading overview…" />
        </div>
      ) : (
        <>
          <section aria-label="Platform overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard label="Registered users" value={usersValue} hint="All roles" />
            <StatCard label="Total stories" value={stories.total ?? 0} hint="Every status" />
            <StatCard
              label="Published stories"
              value={stories.published ?? 0}
              hint="Live on the feed"
              tone="success"
            />
            <StatCard label="Drafts" value={stories.draft ?? 0} hint="Not yet visible" />
            <StatCard label="Scheduled" value={stories.scheduled ?? 0} hint="Publishing soon" tone="warning" />
            <StatCard
              label="Failed logins today"
              value={overview?.failed_logins_today ?? 0}
              hint="Last 24 hours"
              tone={(overview?.failed_logins_today ?? 0) > 0 ? 'danger' : 'default'}
            />
            <StatCard
              label="AI tokens today"
              value={overview?.ai_tokens_today ?? 0}
              hint="Assistant usage"
            />
            <div className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-2">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ocean-50 text-ocean-600">
                  <ChartIcon className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-ocean-900">Keep the community informed</h2>
                  <p className="mt-1 text-sm text-ocean-600">
                    Review the audit trail regularly and keep the assistant budget aligned with
                    your monthly capacity.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      to="/manage/new"
                      className="rounded-lg bg-ocean-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ocean-600"
                    >
                      Write a story
                    </Link>
                    <Link
                      to="/admin/audit"
                      className="rounded-lg border border-ocean-100 px-3 py-1.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-50"
                    >
                      Open audit log
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section aria-labelledby="admin-tools-heading">
            <h2 id="admin-tools-heading" className="mb-3 text-lg font-bold text-ocean-900">
              Admin tools
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {LINKS.map(({ to, label, description, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="group flex items-start gap-3 rounded-xl border border-ocean-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-ocean-300 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean-50 text-ocean-600 group-hover:bg-ocean-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-ocean-900">{label}</span>
                    <span className="mt-0.5 block text-xs text-ocean-600">{description}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
