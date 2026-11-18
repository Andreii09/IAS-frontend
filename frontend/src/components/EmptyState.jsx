import { DocumentIcon } from './Icons.jsx'

export default function EmptyState({
  title = 'Nothing here yet',
  description = 'There is no content to display right now.',
  action,
  icon: Icon = DocumentIcon,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ocean-100 bg-white px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-ocean-50 text-ocean-500">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-ocean-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ocean-600">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
