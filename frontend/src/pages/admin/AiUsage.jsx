import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Spinner from '../../components/Spinner.jsx'
import { AlertIcon, ChartIcon, SlidersIcon } from '../../components/Icons.jsx'
import { useToast } from '../../components/Toast.jsx'
import { formatDate, formatNumber } from '../../lib/format.js'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

function budgetToNumber(budget) {
  if (budget == null) return ''
  if (typeof budget === 'number' || typeof budget === 'string') return budget
  return (
    budget.ai_daily_budget ??
    budget.value ??
    budget.daily_budget ??
    budget.limit ??
    budget.amount ??
    budget.budget ??
    ''
  )
}

function userName(row) {
  return row?.user?.name || row?.name || row?.email || `User #${row?.user_id ?? row?.id ?? '—'}`
}

function rowDate(row) {
  return row?.date || row?.day || row?.created_at || null
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-ocean-600">{label}</p>
      <p className="mt-2 text-2xl font-extrabold tabular-nums text-ocean-900">
        {formatNumber(value)}
      </p>
    </div>
  )
}

export default function AiUsage() {
  const toast = useToast()

  const [draft, setDraft] = useState({ from: '', to: '' })
  const [range, setRange] = useState({ from: '', to: '' })
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [budgetInput, setBudgetInput] = useState('')
  const [savingBudget, setSavingBudget] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/ai-usage', {
        params: {
          ...(range.from ? { from: range.from } : {}),
          ...(range.to ? { to: range.to } : {}),
        },
      })
      .then(({ data: payload }) => {
        if (!active) return
        setData(payload || {})
        setBudgetInput(String(budgetToNumber(payload?.budget) ?? ''))
      })
      .catch((err) => {
        if (!active) return
        setError(getErrorMessage(err, 'Unable to load AI usage.'))
        setData(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [range, reloadKey])

  async function applyRange(event) {
    event.preventDefault()
    setRange(draft)
  }

  async function saveBudget(event) {
    event.preventDefault()
    setSavingBudget(true)
    try {
      const { data: payload } = await api.patch('/admin/settings', {
        ai_daily_budget: Number(budgetInput),
      })
      toast.success('Daily AI budget updated.')
      if (payload) {
        setData((current) => ({ ...(current || {}), budget: payload?.budget ?? payload }))
      }
      setReloadKey((key) => key + 1)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to update the budget.'))
    } finally {
      setSavingBudget(false)
    }
  }

  const totals = data?.totals || {}
  const byUser = Array.isArray(data?.by_user) ? data.by_user : []
  const byDay = Array.isArray(data?.by_day) ? data.by_day : []
  const flagged = Array.isArray(data?.flagged) ? data.flagged : []

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
            <span className="mx-2 text-ocean-300">/</span>
            <span className="text-ocean-600">AI usage</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            AI usage &amp; budget
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Track assistant token consumption and keep daily spend inside the configured budget.
          </p>
        </div>

        <form onSubmit={applyRange} className="flex flex-wrap items-end gap-2">
          <div>
            <label htmlFor="ai-from" className="mb-1 block text-xs font-semibold text-ocean-700">From</label>
            <input
              id="ai-from"
              type="date"
              value={draft.from}
              onChange={(event) => setDraft((current) => ({ ...current, from: event.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ai-to" className="mb-1 block text-xs font-semibold text-ocean-700">To</label>
            <input
              id="ai-to"
              type="date"
              value={draft.to}
              onChange={(event) => setDraft((current) => ({ ...current, to: event.target.value }))}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600"
          >
            Apply
          </button>
        </form>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-72 items-center justify-center rounded-xl border border-ocean-100 bg-white">
          <Spinner label="Loading AI usage…" />
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3" aria-label="Token totals">
            <Stat label="Input tokens" value={totals.input_tokens} />
            <Stat label="Output tokens" value={totals.output_tokens} />
            <Stat label="Requests" value={totals.requests} />
          </section>

          <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm" aria-labelledby="budget-heading">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ocean-50 text-ocean-600">
                <SlidersIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="budget-heading" className="text-base font-bold text-ocean-900">Daily token budget</h2>
                <p className="mt-0.5 text-sm text-ocean-600">
                  The assistant refuses new requests once this daily limit is reached.
                </p>
                {typeof data?.budget === 'object' && data?.budget !== null && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-ocean-600">
                    {'used' in data.budget && <Badge tone="neutral">Used {formatNumber(data.budget.used)}</Badge>}
                    {'remaining' in data.budget && (
                      <Badge tone="info">Remaining {formatNumber(data.budget.remaining)}</Badge>
                    )}
                  </div>
                )}

                <form onSubmit={saveBudget} className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="w-full max-w-xs">
                    <label htmlFor="ai-budget" className="mb-1 block text-xs font-semibold text-ocean-700">
                      Tokens per day
                    </label>
                    <input
                      id="ai-budget"
                      type="number"
                      min="0"
                      required
                      value={budgetInput}
                      onChange={(event) => setBudgetInput(event.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingBudget}
                    className="rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600 disabled:opacity-60"
                  >
                    {savingBudget ? 'Saving…' : 'Save budget'}
                  </button>
                </form>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="by-user-heading">
              <h2 id="by-user-heading" className="border-b border-ocean-100 px-4 py-3 text-sm font-bold text-ocean-900">
                Usage by user
              </h2>
              {byUser.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={ChartIcon} title="No user usage" description="No assistant requests in this range." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">User</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">In</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Out</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ocean-100">
                      {byUser.map((row, index) => (
                        <tr key={row.user_id ?? row.id ?? index}>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-ocean-900">{userName(row)}</p>
                            {row.user?.email && <p className="text-xs text-ocean-600">{row.user.email}</p>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ocean-600">{formatNumber(row.input_tokens)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ocean-600">{formatNumber(row.output_tokens)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-ocean-900">{formatNumber(row.requests)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm" aria-labelledby="by-day-heading">
              <h2 id="by-day-heading" className="border-b border-ocean-100 px-4 py-3 text-sm font-bold text-ocean-900">
                Usage by day
              </h2>
              {byDay.length === 0 ? (
                <div className="p-4">
                  <EmptyState icon={ChartIcon} title="No daily usage" description="No assistant requests in this range." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-sm">
                    <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                      <tr>
                        <th scope="col" className="px-4 py-2.5 font-semibold">Day</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">In</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Out</th>
                        <th scope="col" className="px-4 py-2.5 text-right font-semibold">Requests</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ocean-100">
                      {byDay.map((row, index) => (
                        <tr key={rowDate(row) ?? index}>
                          <td className="whitespace-nowrap px-4 py-2.5 font-medium text-ocean-900">
                            {formatDate(rowDate(row))}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ocean-600">{formatNumber(row.input_tokens)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-ocean-600">{formatNumber(row.output_tokens)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-ocean-900">{formatNumber(row.requests)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm" aria-labelledby="flagged-heading">
            <h2 id="flagged-heading" className="flex items-center gap-2 text-base font-bold text-ocean-900">
              <AlertIcon className="h-4 w-4 text-amber-500" />
              Flagged conversations
            </h2>
            <p className="mt-0.5 text-sm text-ocean-600">
              Conversations automatically flagged for review by the assistant guardrails.
            </p>
            {flagged.length === 0 ? (
              <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-ocean-600">
                No flagged conversations in this period.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-ocean-100">
                {flagged.map((item, index) => (
                  <li key={item.id ?? index} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ocean-900">
                        {item.reason || item.flag || 'Flagged conversation'}
                      </p>
                      <p className="text-xs text-ocean-600">
                        {item.user ? userName(item) : item.user_name || 'Unknown user'}
                        {item.message ? ` · ${String(item.message).slice(0, 120)}` : ''}
                      </p>
                    </div>
                    <Badge tone="warning">{formatDate(item.created_at, { withTime: true })}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
