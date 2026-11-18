import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Spinner from '../../components/Spinner.jsx'
import { DocumentIcon, RefreshIcon } from '../../components/Icons.jsx'
import { useToast } from '../../components/Toast.jsx'
import { formatDate, statusStyles } from '../../lib/format.js'

export default function Content() {
  const toast = useToast()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/content/revisions')
      .then(({ data: payload }) => {
        if (active) setData(payload || {})
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load revisions.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  async function restoreStory() {
    if (!restoreTarget) return
    setRestoring(true)
    try {
      const { data } = await api.post(`/news/${restoreTarget.id}/restore`)
      toast.success(data?.message || 'Story restored as a draft.')
      setRestoreTarget(null)
      setReloadKey((key) => key + 1)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to restore this story.'))
    } finally {
      setRestoring(false)
    }
  }

  const deleted = Array.isArray(data?.deleted) ? data.deleted : []
  const recent = Array.isArray(data?.recent) ? data.recent : []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
            <span className="mx-2 text-ocean-300">/</span>
            <span className="text-ocean-600">Content &amp; revisions</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            Content &amp; revisions
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Review recent story changes and recover content that was soft-deleted.
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
          <Spinner label="Loading revisions…" />
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="deleted-heading">
            <div className="flex items-center gap-2 border-b border-ocean-100 px-4 py-3">
              <DocumentIcon className="h-4 w-4 text-rose-500" />
              <h2 id="deleted-heading" className="text-sm font-bold text-ocean-900">
                Deleted stories ({deleted.length})
              </h2>
            </div>

            {deleted.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={DocumentIcon}
                  title="No deleted stories"
                  description="Soft-deleted stories can be restored back to a draft here."
                />
              </div>
            ) : (
              <ul className="divide-y divide-ocean-100">
                {deleted.map((item, index) => {
                  const status = statusStyles(item.status)
                  return (
                    <li key={item.id ?? index} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ocean-900">
                          {item.title || `Story #${item.id}`}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ocean-600">
                          <Badge tone={status.tone}>{status.label}</Badge>
                          <span>{item.author?.name || 'Unknown author'}</span>
                          <span>·</span>
                          <span>{formatDate(item.deleted_at || item.updated_at, { withTime: true })}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setRestoreTarget(item)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ocean-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-ocean-600"
                      >
                        <RefreshIcon className="h-3.5 w-3.5" />
                        Restore
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="recent-heading">
            <div className="flex items-center gap-2 border-b border-ocean-100 px-4 py-3">
              <RefreshIcon className="h-4 w-4 text-ocean-500" />
              <h2 id="recent-heading" className="text-sm font-bold text-ocean-900">
                Recent revisions ({recent.length})
              </h2>
            </div>

            {recent.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  icon={RefreshIcon}
                  title="No recent revisions"
                  description="Edits to stories will appear here as they are saved."
                />
              </div>
            ) : (
              <ul className="divide-y divide-ocean-100">
                {recent.map((item, index) => (
                  <li key={item.id ?? index} className="p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ocean-900">
                        {item.title || item.story?.title || `Revision #${item.id ?? index + 1}`}
                      </p>
                      {item.action && <Badge tone="neutral">{item.action}</Badge>}
                    </div>
                    <p className="mt-1 text-xs text-ocean-600">
                      {item.user?.name || item.editor?.name || 'System'}
                      {' · '}
                      {formatDate(item.created_at || item.updated_at, { withTime: true })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(restoreTarget)}
        title="Restore this story?"
        description={
          restoreTarget
            ? `“${restoreTarget.title || `Story #${restoreTarget.id}`}” will be restored as a draft for its owner.`
            : ''
        }
        confirmLabel="Restore story"
        tone="info"
        busy={restoring}
        onConfirm={restoreStory}
        onClose={() => setRestoreTarget(null)}
      />
    </div>
  )
}
