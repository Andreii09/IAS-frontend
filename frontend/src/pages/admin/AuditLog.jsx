import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, downloadCsv, getErrorMessage } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Pagination from '../../components/Pagination.jsx'
import Spinner from '../../components/Spinner.jsx'
import {
  CheckIcon,
  DocumentIcon,
  DownloadIcon,
  RefreshIcon,
} from '../../components/Icons.jsx'
import { useToast } from '../../components/Toast.jsx'
import { formatDate } from '../../lib/format.js'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

const EMPTY_FILTERS = {
  user_id: '',
  action: '',
  entity_type: '',
  date_from: '',
  date_to: '',
}

export default function AuditLog() {
  const toast = useToast()

  const [draft, setDraft] = useState(EMPTY_FILTERS)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)

  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verification, setVerification] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/audit', { params: { ...filters, page } })
      .then(({ data }) => {
        if (!active) return
        setRows(Array.isArray(data?.data) ? data.data : [])
        setMeta(data || null)
      })
      .catch((err) => {
        if (!active) return
        setError(getErrorMessage(err, 'Unable to load the audit log.'))
        setRows([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [filters, page])

  function update(field) {
    return (event) => setDraft((current) => ({ ...current, [field]: event.target.value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    setFilters(draft)
  }

  function resetFilters() {
    setDraft(EMPTY_FILTERS)
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  async function exportCsv() {
    setExporting(true)
    try {
      const suffix = new Date().toISOString().slice(0, 10)
      await downloadCsv('/admin/audit/export', filters, `audit-log-${suffix}.csv`)
      toast.success('Audit export downloaded.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to export the audit log.'))
    } finally {
      setExporting(false)
    }
  }

  async function verifyChain() {
    setVerifying(true)
    setVerification(null)
    try {
      const { data } = await api.post('/admin/audit/verify')
      setVerification(data || { valid: false, errors: [] })
      if (data?.valid) toast.success('Audit chain verified — no tampering detected.')
      else toast.error('Audit chain verification failed. Review the reported errors.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to verify the audit chain.'))
    } finally {
      setVerifying(false)
    }
  }

  const hasFilters = Object.values(filters).some(Boolean)

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
            <span className="mx-2 text-ocean-300">/</span>
            <span className="text-ocean-600">Audit log</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            Audit log
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Every sensitive action is hash-chained. Filter, export, and verify integrity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-ocean-100 bg-white px-3 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50 disabled:opacity-50"
          >
            <DownloadIcon className="h-4 w-4" />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
          <button
            type="button"
            onClick={verifyChain}
            disabled={verifying}
            className="inline-flex items-center gap-2 rounded-lg bg-ocean-500 px-3 py-2 text-sm font-semibold text-white hover:bg-ocean-600 disabled:opacity-50"
          >
            <RefreshIcon className="h-4 w-4" />
            {verifying ? 'Verifying…' : 'Verify chain'}
          </button>
        </div>
      </header>

      {verification && (
        <div
          className={`rounded-xl border p-4 text-sm ${
            verification.valid
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
          role="status"
        >
          <p className="flex items-center gap-2 font-semibold">
            {verification.valid ? <CheckIcon className="h-4 w-4" /> : <DocumentIcon className="h-4 w-4" />}
            {verification.valid ? 'Audit chain is valid.' : 'Audit chain verification failed.'}
          </p>
          {Array.isArray(verification.errors) && verification.errors.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-0.5">
              {verification.errors.map((item, index) => (
                <li key={index}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <section className="rounded-xl border border-ocean-100 bg-white p-4 shadow-sm" aria-label="Audit filters">
        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="audit-user" className="mb-1 block text-xs font-semibold text-ocean-700">
              User ID
            </label>
            <input
              id="audit-user"
              type="number"
              min="1"
              value={draft.user_id}
              onChange={update('user_id')}
              placeholder="Any user"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="audit-action" className="mb-1 block text-xs font-semibold text-ocean-700">
              Action
            </label>
            <input
              id="audit-action"
              type="text"
              value={draft.action}
              onChange={update('action')}
              placeholder="e.g. login.failed"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="audit-entity" className="mb-1 block text-xs font-semibold text-ocean-700">
              Entity type
            </label>
            <input
              id="audit-entity"
              type="text"
              value={draft.entity_type}
              onChange={update('entity_type')}
              placeholder="e.g. news"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="audit-from" className="mb-1 block text-xs font-semibold text-ocean-700">
              From
            </label>
            <input id="audit-from" type="date" value={draft.date_from} onChange={update('date_from')} className={inputClass} />
          </div>
          <div>
            <label htmlFor="audit-to" className="mb-1 block text-xs font-semibold text-ocean-700">
              To
            </label>
            <input id="audit-to" type="date" value={draft.date_to} onChange={update('date_to')} className={inputClass} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600"
            >
              Apply filters
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-ocean-100 bg-white px-4 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
            >
              Reset
            </button>
            {hasFilters && (
              <span className="text-xs text-ocean-600">
                {meta?.total != null ? `${meta.total} matching entries` : ''}
              </span>
            )}
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
          <Spinner label="Loading audit entries…" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={DocumentIcon}
          title="No audit entries"
          description={hasFilters ? 'No entries match these filters.' : 'Audited actions will appear here.'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left text-sm">
              <caption className="sr-only">Audit log entries</caption>
              <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">When</th>
                  <th scope="col" className="px-4 py-3 font-semibold">User</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Action</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Entity</th>
                  <th scope="col" className="px-4 py-3 font-semibold">IP</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface/70">
                    <td className="whitespace-nowrap px-4 py-3 text-ocean-600">
                      {formatDate(row.created_at, { withTime: true })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-ocean-900">{row.user?.name || 'System'}</span>
                      {row.user?.id && <span className="block text-xs text-ocean-600">#{row.user.id}</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={String(row.action).includes('failed') ? 'danger' : 'info'}>
                        {row.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ocean-600">
                      {row.entity_type ? `${row.entity_type}${row.entity_id ? ` #${row.entity_id}` : ''}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-ocean-600">
                      {row.ip || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <code
                        title={row.hash}
                        className="block max-w-40 truncate rounded bg-surface px-2 py-1 font-mono text-[11px] text-ocean-600"
                      >
                        {row.hash || '—'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && rows.length > 0 && <Pagination meta={meta} onPage={setPage} />}
    </div>
  )
}
