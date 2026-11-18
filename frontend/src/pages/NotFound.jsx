import { Link } from 'react-router-dom'
import { AlertIcon } from '../components/Icons.jsx'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-ocean-50 text-ocean-500">
        <AlertIcon className="h-7 w-7" />
      </div>
      <p className="text-sm font-bold uppercase tracking-widest text-ocean-500">404</p>
      <h1 className="mt-2 text-3xl font-extrabold text-ocean-900">Page not found</h1>
      <p className="mt-2 text-sm text-ocean-600">
        The page you are looking for may have moved, been removed, or never existed.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-lg bg-ocean-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ocean-600"
      >
        Back to news feed
      </Link>
    </div>
  )
}
