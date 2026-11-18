import { Link } from 'react-router-dom'
import { LockIcon } from '../components/Icons.jsx'

export default function Forbidden() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
        <LockIcon className="h-7 w-7" />
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-rose-600">403</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ocean-900">Access denied</h1>
      <p className="mt-2 text-sm text-ocean-600">
        Your account does not have permission to view this area. If you requested an editor
        account, it may still be awaiting administrator approval.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex rounded-lg bg-ocean-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600"
        >
          Back to news feed
        </Link>
        <Link
          to="/login"
          className="inline-flex rounded-lg border border-ocean-100 bg-white px-5 py-2.5 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50"
        >
          Switch account
        </Link>
      </div>
    </div>
  )
}
