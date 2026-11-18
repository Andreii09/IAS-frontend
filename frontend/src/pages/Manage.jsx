import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client.js'
import Badge from '../components/Badge.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import Spinner from '../components/Spinner.jsx'
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from '../components/Icons.jsx'
import { useToast } from '../components/Toast.jsx'
import {
  CATEGORIES,
  categoryLabel,
  formatDate,
  statusStyles,
  truncate,
  visibilityLabel,
} from '../lib/format.js'
import useDebounced from '../lib/useDebounced.js'

const STATUSES = ['draft', 'scheduled', 'published']

const selectClass =
  'rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-300 focus:bg-white'

export default function Manage() {
  const navigate = useNavigate()
  const toast = useToast()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounced(search, 300)

  const [articles, setArticles] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [selected, setSelected] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, status, category])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/news', {
        params: { search: debouncedSearch, status, category, page },
      })
      .then(({ data }) => {
        if (!active) return
        const rows = Array.isArray(data?.data) ? data.data : []
        setArticles(rows)
        setMeta(data || null)
        setSelected((current) => current.filter((id) => rows.some((row) => row.id === id)))
      })
      .catch((err) => {
        if (!active) return
        setError(getErrorMessage(err, 'Unable to load your stories.'))
        setArticles([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, status, category, page, reloadKey])

  const allOnPageSelected = useMemo(
    () => articles.length > 0 && articles.every((article) => selected.includes(article.id)),
    [articles, selected],
  )

  function toggleOne(id) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleAll() {
    if (allOnPageSelected) {
      const ids = new Set(articles.map((article) => article.id))
      setSelected((current) => current.filter((id) => !ids.has(id)))
    } else {
      setSelected((current) => {
        const next = new Set(current)
        articles.forEach((article) => next.add(article.id))
        return [...next]
      })
    }
  }

  async function deleteStories(ids) {
    if (!ids.length) return
    setDeleting(true)
    const results = await Promise.allSettled(ids.map((id) => api.delete(`/news/${id}`)))
    const failed = results.filter((result) => result.status === 'rejected')

    if (failed.length === 0) {
      toast.success(ids.length === 1 ? 'Story deleted.' : `${ids.length} stories deleted.`)
    } else if (failed.length === ids.length) {
      toast.error(getErrorMessage(failed[0].reason, 'Unable to delete the selected stories.'))
    } else {
      toast.info(`${ids.length - failed.length} deleted, ${failed.length} could not be removed.`)
    }

    setDeleting(false)
    setDeleteTarget(null)
    setBulkOpen(false)
    setSelected([])
    setReloadKey((key) => key + 1)
  }

  const hasFilters = Boolean(search || status || category)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            My stories
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Create, schedule, and manage the stories you own. Admins can manage every story.
          </p>
        </div>
        <Link
          to="/manage/new"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-ocean-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-600"
        >
          <PlusIcon className="h-4 w-4" />
          New story
        </Link>
      </header>

      <section className="rounded-xl border border-ocean-100 bg-white p-4 shadow-sm" aria-label="Story filters">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <label htmlFor="manage-search" className="sr-only">
              Search your stories
            </label>
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ocean-600" />
            <input
              id="manage-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title…"
              className="w-full rounded-lg border border-ocean-100 bg-surface py-2.5 pl-9 pr-3 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor="manage-status" className="sr-only">
              Filter by status
            </label>
            <select
              id="manage-status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={`${selectClass} w-full sm:w-auto`}
            >
              <option value="">All statuses</option>
              {STATUSES.map((item) => (
                <option key={item} value={item}>
                  {statusStyles(item).label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manage-category" className="sr-only">
              Filter by category
            </label>
            <select
              id="manage-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className={`${selectClass} w-full sm:w-auto`}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {categoryLabel(item)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setStatus('')
                setCategory('')
              }}
              className="font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
            >
              Clear filters
            </button>
          )}
          {selected.length > 0 && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-ocean-600">{selected.length} selected</span>
              <button
                type="button"
                onClick={() => setBulkOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                <TrashIcon className="h-3.5 w-3.5" />
                Delete selected
              </button>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-ocean-100 bg-white">
          <Spinner label="Loading your stories…" />
        </div>
      ) : articles.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching stories' : 'You have not written a story yet'}
          description={
            hasFilters
              ? 'Adjust your search or filters to find a story.'
              : 'Start with a draft, then publish when you are ready.'
          }
          action={
            <Link
              to="/manage/new"
              className="inline-flex items-center gap-2 rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600"
            >
              <PlusIcon className="h-4 w-4" />
              Write your first story
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Stories you can manage</caption>
              <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                <tr>
                  <th scope="col" className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      aria-label="Select all stories on this page"
                      className="h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">Story</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Category</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Updated</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100">
                {articles.map((article) => {
                  const badge = statusStyles(article.status)
                  return (
                    <tr key={article.id} className="hover:bg-surface/70">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(article.id)}
                          onChange={() => toggleOne(article.id)}
                          aria-label={`Select ${article.title}`}
                          className="h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
                        />
                      </td>
                      <td className="max-w-md px-4 py-3">
                        <Link
                          to={`/news/${article.id}`}
                          className="font-semibold text-ocean-900 hover:text-ocean-600 hover:underline"
                        >
                          {truncate(article.title, 80)}
                        </Link>
                        <p className="mt-0.5 text-xs text-ocean-600">
                          {visibilityLabel(article.visibility)} · {article.author?.name || 'You'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-ocean-600">{categoryLabel(article.category)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-ocean-600">
                        {formatDate(article.updated_at || article.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {article.can?.update !== false && (
                            <button
                              type="button"
                              onClick={() => navigate(`/manage/${article.id}/edit`)}
                              className="inline-flex items-center gap-1 rounded-lg border border-ocean-100 px-2.5 py-1.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-50"
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          )}
                          {article.can?.delete !== false && (
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(article)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-ocean-100 md:hidden">
            {articles.map((article) => {
              const badge = statusStyles(article.status)
              return (
                <li key={article.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(article.id)}
                      onChange={() => toggleOne(article.id)}
                      aria-label={`Select ${article.title}`}
                      className="mt-1 h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/news/${article.id}`}
                        className="block font-semibold text-ocean-900 hover:underline"
                      >
                        {article.title}
                      </Link>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                        <span className="text-xs text-ocean-600">{categoryLabel(article.category)}</span>
                        <span className="text-xs text-ocean-600">
                          · {formatDate(article.updated_at || article.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ocean-600">{visibilityLabel(article.visibility)}</p>
                      <div className="mt-3 flex gap-2">
                        {article.can?.update !== false && (
                          <button
                            type="button"
                            onClick={() => navigate(`/manage/${article.id}/edit`)}
                            className="inline-flex items-center gap-1 rounded-lg border border-ocean-100 px-2.5 py-1.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-50"
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        )}
                        {article.can?.delete !== false && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(article)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <Pagination meta={meta} onPage={setPage} />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this story?"
        description={deleteTarget ? `“${deleteTarget.title}” will be permanently removed.` : ''}
        confirmLabel="Delete story"
        requirePhrase
        phraseLabel="I understand that this story will be deleted"
        busy={deleting}
        onConfirm={() => deleteStories(deleteTarget ? [deleteTarget.id] : [])}
        onClose={() => setDeleteTarget(null)}
      />

      <ConfirmDialog
        open={bulkOpen}
        title={`Delete ${selected.length} stories?`}
        description="Every selected story will be removed. This cannot be undone from your account."
        confirmLabel={`Delete ${selected.length}`}
        requirePhrase
        phraseLabel="I understand that these stories will be deleted"
        busy={deleting}
        onConfirm={() => deleteStories(selected)}
        onClose={() => setBulkOpen(false)}
      />
    </div>
  )
}
