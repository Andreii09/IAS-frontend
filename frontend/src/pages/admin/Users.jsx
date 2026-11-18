import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getErrorMessage, getFieldErrors } from '../../api/client.js'
import Badge from '../../components/Badge.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Pagination from '../../components/Pagination.jsx'
import Spinner from '../../components/Spinner.jsx'
import { CloseIcon, PencilIcon, SearchIcon, UserIcon } from '../../components/Icons.jsx'
import { useToast } from '../../components/Toast.jsx'
import { formatDate, roleLabel } from '../../lib/format.js'
import useDebounced from '../../lib/useDebounced.js'

const ROLES = ['reader', 'editor', 'admin']

function isLocked(user) {
  if (!user?.locked_until) return false
  return new Date(user.locked_until).getTime() > Date.now()
}

function EditUserDialog({ user, onClose, onSaved }) {
  const toast = useToast()
  const [form, setForm] = useState({
    role: user.role || 'reader',
    is_active: Boolean(user.is_active),
    must_change_password: Boolean(user.must_change_password),
    unlock: false,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState({})

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})
    try {
      const { data } = await api.patch(`/admin/users/${user.id}`, {
        role: form.role,
        is_active: form.is_active,
        must_change_password: form.must_change_password,
        ...(form.unlock ? { unlock: true } : {}),
      })
      toast.success(`Updated ${user.name}.`)
      onSaved(data?.user || data || { ...user, ...form })
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update this user.'))
      setErrors(getFieldErrors(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ocean-900/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
        className="dialog-in relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1 text-ocean-600 hover:bg-ocean-50 disabled:opacity-40"
        >
          <CloseIcon className="h-5 w-5" />
        </button>

        <h2 id="edit-user-title" className="text-lg font-bold text-ocean-900">
          Edit user
        </h2>
        <p className="mt-1 truncate text-sm text-ocean-600">
          {user.name} · {user.email}
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="edit-role" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Role
            </label>
            <select
              id="edit-role"
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              className="w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm focus:border-ocean-300 focus:bg-white"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-rose-600">{errors.role[0]}</p>}
          </div>

          <div className="space-y-3 rounded-lg bg-surface p-3">
            <label className="flex items-center gap-3 text-sm text-ocean-900">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
              />
              Account is active
            </label>
            <label className="flex items-center gap-3 text-sm text-ocean-900">
              <input
                type="checkbox"
                checked={form.must_change_password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    must_change_password: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
              />
              Require password change at next sign-in
            </label>
            <label className="flex items-center gap-3 text-sm text-ocean-900">
              <input
                type="checkbox"
                checked={form.unlock}
                onChange={(event) =>
                  setForm((current) => ({ ...current, unlock: event.target.checked }))
                }
                className="h-4 w-4 rounded border-ocean-300 text-ocean-500 focus:ring-ocean-500"
              />
              Unlock this account now
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-lg border border-ocean-100 bg-white px-4 py-2 text-sm font-semibold text-ocean-700 hover:bg-ocean-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-w-24 items-center justify-center rounded-lg bg-ocean-500 px-4 py-2 text-sm font-semibold text-white hover:bg-ocean-600 disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Users() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const debouncedSearch = useDebounced(search, 300)

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')

    api
      .get('/admin/users', { params: { search: debouncedSearch, page } })
      .then(({ data }) => {
        if (!active) return
        setUsers(Array.isArray(data?.data) ? data.data : [])
        setMeta(data || null)
      })
      .catch((err) => {
        if (!active) return
        setError(getErrorMessage(err, 'Unable to load users.'))
        setUsers([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedSearch, page, reloadKey])

  function handleSaved(savedUser) {
    setUsers((current) =>
      current.map((row) => (row.id === savedUser.id ? { ...row, ...savedUser } : row)),
    )
    setEditing(null)
    setReloadKey((key) => key + 1)
  }

  return (
    <div className="space-y-6">
      <header>
        <nav aria-label="Breadcrumb" className="text-sm">
          <Link to="/admin" className="font-medium text-ocean-600 hover:underline">Admin</Link>
          <span className="mx-2 text-ocean-300">/</span>
          <span className="text-ocean-600">Users</span>
        </nav>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">Users</h1>
        <p className="mt-1 text-sm text-ocean-600">
          Change roles, deactivate accounts, force password resets, and clear account locks.
        </p>
      </header>

      <section className="rounded-xl border border-ocean-100 bg-white p-4 shadow-sm" aria-label="Search users">
        <div className="relative max-w-md">
          <label htmlFor="user-search" className="sr-only">Search users</label>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ocean-600" />
          <input
            id="user-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-ocean-100 bg-surface py-2.5 pl-9 pr-3 text-sm placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white"
          />
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-64 items-center justify-center rounded-xl border border-ocean-100 bg-white">
          <Spinner label="Loading users…" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={UserIcon}
          title="No users found"
          description={search ? 'No account matches that search.' : 'There are no registered users yet.'}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ocean-100 bg-white shadow-sm">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[840px] text-left text-sm">
              <caption className="sr-only">Registered users</caption>
              <thead className="border-b border-ocean-100 bg-surface text-xs uppercase tracking-wide text-ocean-600">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">User</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Role</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Organization</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Last login</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ocean-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-surface/70">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ocean-900">{user.name}</p>
                      <p className="text-xs text-ocean-600">{user.email}</p>
                      {user.must_change_password && (
                        <Badge tone="warning" className="mt-1">Must change password</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === 'admin' ? 'dark' : user.role === 'editor' ? 'info' : 'neutral'}>
                        {roleLabel(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge tone={user.is_active ? 'success' : 'danger'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {isLocked(user) && <Badge tone="warning">Locked</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ocean-600">{user.organization || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-ocean-600">
                      {user.last_login_at ? formatDate(user.last_login_at, { withTime: true }) : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditing(user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-ocean-100 px-2.5 py-1.5 text-xs font-semibold text-ocean-700 hover:bg-ocean-50"
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="divide-y divide-ocean-100 md:hidden">
            {users.map((user) => (
              <li key={user.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-ocean-900">{user.name}</p>
                    <p className="truncate text-xs text-ocean-600">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone={user.role === 'admin' ? 'dark' : user.role === 'editor' ? 'info' : 'neutral'}>
                        {roleLabel(user.role)}
                      </Badge>
                      <Badge tone={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {isLocked(user) && <Badge tone="warning">Locked</Badge>}
                      {user.must_change_password && <Badge tone="warning">Password reset</Badge>}
                    </div>
                    <p className="mt-2 text-xs text-ocean-600">
                      {user.organization || 'No organization'} · Last login:{' '}
                      {user.last_login_at ? formatDate(user.last_login_at, { withTime: true }) : 'Never'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(user)}
                    aria-label={`Edit ${user.name}`}
                    className="rounded-lg border border-ocean-100 p-2 text-ocean-700 hover:bg-ocean-50"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && users.length > 0 && <Pagination meta={meta} onPage={setPage} />}

      {editing && (
        <EditUserDialog user={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  )
}
