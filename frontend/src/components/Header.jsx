import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { getErrorMessage } from '../api/client.js'
import { useToast } from './Toast.jsx'
import { LockIcon, MenuIcon, ShieldIcon } from './Icons.jsx'
import Badge from './Badge.jsx'
import { roleLabel } from '../lib/format.js'

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-white/15 text-white' : 'text-ocean-100 hover:bg-white/10 hover:text-white'
  }`

export default function Header({ onMenuClick }) {
  const { user, logout, isEditor } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)

  async function handleLogout() {
    setSigningOut(true)
    try {
      await logout()
      toast.success('You have been signed out.')
      navigate('/login', { replace: true })
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-ocean-700 text-white shadow-md">
      <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-ocean-100 hover:bg-white/10 hover:text-white lg:hidden"
        >
          <MenuIcon className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 rounded-lg" aria-label="Bantay Cordova home">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <ShieldIcon className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight sm:text-lg">Bantay Cordova</span>
            <span className="hidden text-[11px] font-medium text-ocean-100 sm:block">
              Community news &amp; public advisories
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          <NavLink to="/" end className={linkClass}>
            News
          </NavLink>
          {isEditor && (
            <NavLink to="/manage" className={linkClass}>
              Manage
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="max-w-32 truncate text-sm font-semibold leading-tight">{user.name}</p>
                <p className="text-[11px] text-ocean-100">{roleLabel(user.role)}</p>
              </div>
              <Link
                to="/change-password"
                aria-label="Change password"
                className="hidden rounded-lg p-2 text-ocean-100 hover:bg-white/10 hover:text-white sm:inline-flex"
              >
                <LockIcon className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ocean-50 hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                to="/register"
                className="hidden rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ocean-700 transition hover:bg-ocean-50 sm:inline-block"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {user?.must_change_password && (
        <div className="bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-800">
          <Badge tone="warning" className="mr-2">
            Action required
          </Badge>
          Please change your password to continue.{' '}
          <Link to="/change-password" className="font-bold underline underline-offset-2">
            Change it now
          </Link>
        </div>
      )}
    </header>
  )
}
