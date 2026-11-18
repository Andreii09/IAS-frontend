import { Link } from 'react-router-dom'
import { ShieldIcon } from './Icons.jsx'

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-ocean-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-4 py-6 text-sm text-ocean-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <ShieldIcon className="h-5 w-5 text-ocean-500" />
          <span className="font-semibold text-ocean-700">Bantay Cordova</span>
          <span className="hidden sm:inline">· A community news initiative</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Link to="/" className="hover:text-ocean-700 hover:underline">
            News feed
          </Link>
          <Link to="/register" className="hover:text-ocean-700 hover:underline">
            Become a resident member
          </Link>
          <span>© {new Date().getFullYear()} Cordova</span>
        </div>
      </div>
    </footer>
  )
}
