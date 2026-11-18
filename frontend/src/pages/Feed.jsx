import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../api/client.js'
import Badge from '../components/Badge.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Pagination from '../components/Pagination.jsx'
import Spinner from '../components/Spinner.jsx'
import { CalendarIcon, LockIcon, SearchIcon, ShieldIcon, TagIcon } from '../components/Icons.jsx'
import {
  CATEGORIES,
  categoryLabel,
  formatDate,
  isRestricted,
  truncate,
  visibilityLabel,
} from '../lib/format.js'
import useDebounced from '../lib/useDebounced.js'

function NewsCard({ article }) {
  const restricted = isRestricted(article.visibility)

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[16/9] overflow-hidden bg-ocean-50">
        {article.cover_image ? (
          <img
            src={article.cover_image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-ocean-100 to-ocean-50 text-ocean-300">
            <ShieldIcon className="h-12 w-12" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge tone="info" className="bg-white/95">
            {categoryLabel(article.category)}
          </Badge>
          {restricted && (
            <Badge tone="dark">
              <LockIcon className="h-3 w-3" />
              {visibilityLabel(article.visibility)}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-lg font-bold leading-snug text-ocean-900">
          <Link
            to={`/news/${article.id}`}
            className="rounded transition hover:text-ocean-600 focus-visible:text-ocean-600"
          >
            {article.title}
          </Link>
        </h2>
        {article.summary && (
          <p className="mt-2 text-sm leading-relaxed text-ocean-600">
            {truncate(article.summary, 150)}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ocean-600">
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            {formatDate(article.published_at || article.created_at)}
          </span>
          {article.author?.name && (
            <span className="inline-flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5" />
              {article.author.name}
            </span>
          )}
        </div>

        {article.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {article.tags.slice(0, 4).map((tag) => (
              <span key={tag} className="rounded-md bg-surface px-2 py-0.5 text-[11px] text-ocean-600">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <Link
          to={`/news/${article.id}`}
          className="mt-auto inline-flex items-center gap-1 self-start pt-5 text-sm font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
        >
          Read story <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  )
}

export default function Feed() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const debouncedSearch = useDebounced(search, 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/news', {
        params: {
          search: debouncedSearch,
          category,
          page,
        },
      })
      .then(({ data }) => {
        if (!active) return
        setArticles(Array.isArray(data?.data) ? data.data : [])
        setMeta(data || null)
      })
      .catch((err) => {
        if (active) {
          setError(getErrorMessage(err, 'Unable to load the news feed.'))
          setArticles([])
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, category, page])

  const hasFilters = Boolean(search || category)

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-linear-to-br from-ocean-700 via-ocean-600 to-ocean-500 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div className="max-w-3xl">
          <Badge tone="dark" className="mb-4 border-white/20 bg-white/15">
            <ShieldIcon className="h-3.5 w-3.5" />
            Your barangay, your news
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Bantay Cordova
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-ocean-50 sm:text-lg">
            Timely community news, public advisories, and stories from across Cordova —
            all in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm">
            <span className="rounded-full bg-white/15 px-3 py-1.5">Free to read</span>
            <span className="rounded-full bg-white/15 px-3 py-1.5">Updated regularly</span>
            <Link
              to="/register"
              className="rounded-full bg-white px-3 py-1.5 font-semibold text-ocean-700 hover:bg-ocean-50"
            >
              Join as a resident
            </Link>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section aria-label="Filter news">
        <div className="rounded-xl border border-ocean-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="news-search" className="sr-only">
                Search news
              </label>
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ocean-600" />
              <input
                id="news-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search stories…"
                className="w-full rounded-lg border border-ocean-100 bg-surface py-2.5 pl-10 pr-3 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white"
              />
            </div>
            <div className="sm:w-60">
              <label htmlFor="news-category" className="sr-only">
                Filter by category
              </label>
              <select
                id="news-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 focus:border-ocean-300 focus:bg-white"
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
        </div>
      </section>

      {/* Results */}
      <section aria-label="News stories">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-ocean-900">Latest stories</h2>
            <p className="mt-0.5 text-sm text-ocean-600">
              {meta?.total != null ? `${meta.total} story${meta.total === 1 ? '' : 'ies'} found` : 'Community updates'}
            </p>
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCategory('')
              }}
              className="text-sm font-semibold text-ocean-600 hover:text-ocean-700 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-ocean-100 bg-white">
            <Spinner label="Loading stories…" />
          </div>
        ) : articles.length === 0 ? (
          <EmptyState
            title="No stories found"
            description={
              hasFilters
                ? 'Try a different search term or category.'
                : 'There are no published stories yet. Check back soon.'
            }
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
            <Pagination meta={meta} onPage={setPage} className="mt-8" />
          </>
        )}
      </section>
    </div>
  )
}
