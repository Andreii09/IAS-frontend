import { NavLink } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import {
  ChartIcon,
  CloseIcon,
  DocumentIcon,
  HomeIcon,
  KeyIcon,
  LockIcon,
  PencilIcon,
  RefreshIcon,
  ShieldIcon,
  SlidersIcon,
  UserIcon,
} from './Icons.jsx'

const BASE =
  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors'
const ACTIVE = 'bg-ocean-50 text-ocean-700 shadow-sm'
const IDLE = 'text-ocean-100 hover:bg-white/10 hover:text-white'

function itemClass({ isActive }) {
  return `${BASE} ${isActive ? ACTIVE : IDLE}`
}

function NavItems({ onNavigate }) {
  const { isEditor, isAdmin, user } = useAuth()

  return (
    <nav className="space-y-6" aria-label="Sidebar navigation">
      <div>
        <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-ocean-200">
          Browse
        </p>
        <div className="space-y-1">
          <NavLink to="/" end className={itemClass} onClick={onNavigate}>
            <HomeIcon className="h-4 w-4" />
            News feed
          </NavLink>
          {isEditor && (
            <NavLink to="/manage" className={itemClass} onClick={onNavigate}>
              <PencilIcon className="h-4 w-4" />
              My stories
            </NavLink>
          )}
          {user && (
            <NavLink to="/change-password" className={itemClass} onClick={onNavigate}>
              <LockIcon className="h-4 w-4" />
              Change password
            </NavLink>
          )}
        </div>
      </div>

      {isAdmin && (
        <div>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-ocean-200">
            Administration
          </p>
          <div className="space-y-1">
            <NavLink to="/admin" end className={itemClass} onClick={onNavigate}>
              <ChartIcon className="h-4 w-4" />
              Overview
            </NavLink>
            <NavLink to="/admin/users" className={itemClass} onClick={onNavigate}>
              <UserIcon className="h-4 w-4" />
              Users
            </NavLink>
            <NavLink to="/admin/tokens" className={itemClass} onClick={onNavigate}>
              <KeyIcon className="h-4 w-4" />
              Access tokens
            </NavLink>
            <NavLink to="/admin/audit" className={itemClass} onClick={onNavigate}>
              <DocumentIcon className="h-4 w-4" />
              Audit log
            </NavLink>
            <NavLink to="/admin/ai" className={itemClass} onClick={onNavigate}>
              <SlidersIcon className="h-4 w-4" />
              AI usage &amp; budget
            </NavLink>
            <NavLink to="/admin/security" className={itemClass} onClick={onNavigate}>
              <ShieldIcon className="h-4 w-4" />
              Security
            </NavLink>
            <NavLink to="/admin/content" className={itemClass} onClick={onNavigate}>
              <RefreshIcon className="h-4 w-4" />
              Content &amp; revisions
            </NavLink>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white/10 p-3 text-xs leading-relaxed text-ocean-50">
        <p className="font-semibold text-white">Stay informed</p>
        <p className="mt-1">
          Public advisories are free to read. The AI assistant is available to registered
          residents.
        </p>
      </div>
    </nav>
  )
}

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Desktop rail */}
      <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 self-start overflow-y-auto bg-ocean-700 px-3 py-6 thin-scrollbar lg:block">
        <NavItems />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ocean-900/50"
            onClick={onClose}
            aria-hidden="true"
          />
          <aside
            className="dialog-in absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-ocean-700 p-5 shadow-2xl thin-scrollbar"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-base font-bold text-white">Menu</span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close navigation menu"
                className="rounded-lg p-1.5 text-ocean-100 hover:bg-white/10 hover:text-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">
              <NavItems onNavigate={onClose} />
            </div>
          </aside>
        </div>
      )}
    </>
  )
}
