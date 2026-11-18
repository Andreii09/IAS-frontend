import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client.js'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Spinner from '../components/Spinner.jsx'
import { CalendarIcon, PencilIcon, RefreshIcon, TrashIcon, UserIcon } from '../components/Icons.jsx'
import { useToast } from '../components/Toast.jsx'
import { categoryLabel, formatDate, statusStyles, visibilityLabel } from '../lib/format.js'

export default function Article() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [revisions, setRevisions] = useState(null)
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [revisionsLoading, setRevisionsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get(`/news/${id}`)
      .then(({ data }) => {
        if (active) setArticle(data || null)
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Unable to load this story.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  async function toggleRevisions() {
    if (revisionsOpen) {
      setRevisionsOpen(false)
      return
    }
    setRevisionsOpen(true)
    if (revisions) return

    setRevisionsLoading(true)
    try {
      const { data } = await api.get(`/news/${id}/revisions`)
      setRevisions(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to load revisions.'))
    } finally {
      setRevisionsLoading(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const { data } = await api.delete(`/news/${id}`)
      toast.success(data?.message || 'Story deleted.')
      navigate('/manage')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to delete this story.'))
    } finally {
      setDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-xl border border-ocean-100 bg-white">
        <Spinner label="Loading story…" />
      </div>
    )
  }

  if (error || !article) {
    return (
      <EmptyState
        title="Story not found"
        description={error || 'This story may have been removed or is not available to you.'}
        action={
          <Link
            to="/"
            className="inline-flex rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600"
          >
            Back to news feed
          </Link>
        }
      />
    )
  }

  const status = statusStyles(article.status)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link to="/" className="font-medium text-ocean-600 hover:text-ocean-700 hover:underline">
          News feed
        </Link>
        <span className="mx-2 text-ocean-300" aria-hidden="true">
          /
        </span>
        <span className="text-ocean-600">{categoryLabel(article.category)}</span>
      </nav>

      <article className="overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-sm">
        {article.cover_image && (
          <img
            src={article.cover_image}
            alt=""
            className="max-h-[26rem] w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        )}

        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="info">{categoryLabel(article.category)}</Badge>
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone={visibilityLabel(article.visibility) === 'Public' ? 'neutral' : 'warning'}>
              {visibilityLabel(article.visibility)}
            </Badge>
          </div>

          <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-ocean-900 sm:text-4xl">
            {article.title}
          </h1>

          {article.summary && (
            <p className="mt-4 border-l-4 border-ocean-300 pl-4 text-base leading-relaxed text-ocean-600 sm:text-lg">
              {article.summary}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-ocean-100 pb-6 text-sm text-ocean-600">
            <span className="inline-flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-ocean-500" />
              By <strong className="font-semibold text-ocean-900">{article.author?.name || 'Staff'}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-ocean-500" />
              {formatDate(article.published_at || article.created_at, { withTime: true })}
            </span>
          </div>

          {/* Body is sanitized server-side before it reaches the client. */}
          <div
            className="article-body mt-8"
            dangerouslySetInnerHTML={{ __html: article.body || '' }}
          />

          {article.tags?.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-ocean-100 pt-6">
              <span className="text-xs font-semibold uppercase tracking-wide text-ocean-600">Tags</span>
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-ocean-50 px-2.5 py-1 text-xs font-medium text-ocean-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>

      {(article.can?.update || article.can?.delete) && (
        <section
          className="flex flex-wrap items-center gap-3 rounded-xl border border-ocean-100 bg-white p-4"
          aria-label="Story management"
        >
          <h2 className="mr-auto text-sm font-semibold text-ocean-900">Manage this story</h2>
          {article.can.update && (
            <>
              <Link
                to={`/manage/${article.id}/edit`}
                className="inline-flex items-center gap-2 rounded-lg border border-ocean-100 bg-white px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </Link>
              <button
                type="button"
                onClick={toggleRevisions}
                aria-expanded={revisionsOpen}
                className="inline-flex items-center gap-2 rounded-lg border border-ocean-100 bg-white px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
              >
                <RefreshIcon className="h-4 w-4" />
                {revisionsOpen ? 'Hide revisions' : 'View revisions'}
              </button>
            </>
          )}
          {article.can.delete && (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </section>
      )}

      {revisionsOpen && (
        <section className="rounded-xl border border-ocean-100 bg-white p-5" aria-label="Revision history">
          <h2 className="text-base font-bold text-ocean-900">Revision history</h2>
          {revisionsLoading ? (
            <div className="mt-4">
              <Spinner label="Loading revisions…" />
            </div>
          ) : revisions?.length ? (
            <ol className="mt-4 space-y-3">
              {revisions.map((revision, index) => (
                <li
                  key={revision.id ?? index}
                  className="flex flex-col gap-1 rounded-lg bg-surface p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-ocean-900">
                      {revision.title || revision?.new_values?.title || `Revision ${index + 1}`}
                    </p>
                    <p className="text-xs text-ocean-600">
                      {revision.user?.name || revision.editor?.name || 'System'}
                      {revision.action ? ` · ${revision.action}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-ocean-600">
                    {formatDate(revision.created_at || revision.updated_at, { withTime: true })}
                  </p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-sm text-ocean-600">No revisions recorded for this story.</p>
          )}
        </section>
      )}

      <div className="pb-4">
        <Link to="/" className="text-sm font-semibold text-ocean-600 hover:text-ocean-700 hover:underline">
          ← Back to all stories
        </Link>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this story?"
        description="This will remove the story from the news feed. This action cannot be undone from your account."
        confirmLabel="Delete story"
        requirePhrase
        phraseLabel="I understand that this story will be deleted"
        busy={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}
