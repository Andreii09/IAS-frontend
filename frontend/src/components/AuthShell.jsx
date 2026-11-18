import { ShieldIcon } from './Icons.jsx'

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-8">
      <div className="w-full max-w-md">
        <div className="overflow-hidden rounded-2xl border border-ocean-100 bg-white shadow-lg shadow-ocean-900/5">
          <div className="bg-linear-to-br from-ocean-700 to-ocean-600 px-6 py-6 text-white">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-ocean-50">Bantay Cordova</span>
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-ocean-100">{subtitle}</p>}
          </div>
          <div className="p-6 sm:p-8">{children}</div>
        </div>
        {footer && <div className="mt-4 text-center text-sm text-ocean-600">{footer}</div>}
      </div>
    </div>
  )
}
