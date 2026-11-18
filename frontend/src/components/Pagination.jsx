import { ChevronLeftIcon, ChevronRightIcon } from './Icons.jsx'

/** Laravel paginator aware pagination control. */
export default function Pagination({ meta, onPage, className = '' }) {
  const current = Number(meta?.current_page || 1)
  const last = Math.max(Number(meta?.last_page || 1), 1)
  const total = Number(meta?.total || 0)
  const from = Number(meta?.from || 0)
  const to = Number(meta?.to || 0)

  if (last <= 1 && total <= 0) return null

  const pages = []
  const windowSize = 2
  const start = Math.max(1, current - windowSize)
  const end = Math.min(last, current + windowSize)

  for (let page = start; page <= end; page += 1) pages.push(page)

  return (
    <nav
      className={`flex flex-col items-center justify-between gap-4 sm:flex-row ${className}`}
      aria-label="Pagination"
    >
      <p className="text-sm text-ocean-600">
        {total > 0 ? (
          <>
            Showing <span className="font-medium text-ocean-900">{from}</span>–
            <span className="font-medium text-ocean-900">{to}</span> of{' '}
            <span className="font-medium text-ocean-900">{total}</span>
          </>
        ) : (
          'No results'
        )}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-ocean-100 bg-white px-3 text-sm font-medium text-ocean-700 transition hover:bg-ocean-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPage(page)}
            aria-current={page === current ? 'page' : undefined}
            aria-label={`Page ${page}`}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold transition ${
              page === current
                ? 'bg-ocean-500 text-white shadow-sm'
                : 'border border-ocean-100 bg-white text-ocean-700 hover:bg-ocean-50'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPage(current + 1)}
          disabled={current >= last}
          aria-label="Next page"
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-ocean-100 bg-white px-3 text-sm font-medium text-ocean-700 transition hover:bg-ocean-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}
