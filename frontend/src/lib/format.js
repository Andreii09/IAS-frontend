/** Formatting helpers shared across public and admin screens. */

const dateFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export function formatDate(value, { withTime = false } = {}) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return (withTime ? dateTimeFormatter : dateFormatter).format(date)
}

export function truncate(value, length = 120) {
  if (value == null) return ''
  const text = String(value)
  return text.length > length ? `${text.slice(0, length - 1).trimEnd()}…` : text
}

// Must match the `in:` rule in backend/app/Http/Requests/StoreNewsRequest.php.
const CATEGORY_LABELS = {
  announcement: 'Announcement',
  announcements: 'Announcement',
  notice: 'Notice',
  notices: 'Notice',
  event: 'Event',
  events: 'Event',
  public_safety: 'Public Safety',
  'public-safety': 'Public Safety',
  general: 'General',
}

export const CATEGORIES = ['announcement', 'notice', 'event', 'public_safety', 'general']

export function categoryLabel(value) {
  if (!value) return 'Uncategorized'
  const key = String(value).toLowerCase().replace(/\s+/g, '-')
  return CATEGORY_LABELS[key] || String(value).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function statusStyles(status) {
  switch (String(status || '').toLowerCase()) {
    case 'published':
      return { tone: 'success', label: 'Published' }
    case 'scheduled':
      return { tone: 'warning', label: 'Scheduled' }
    case 'draft':
      return { tone: 'neutral', label: 'Draft' }
    case 'archived':
    case 'deleted':
      return { tone: 'danger', label: String(status) }
    case 'review':
      return { tone: 'info', label: 'In review' }
    default:
      return { tone: 'neutral', label: status ? String(status) : 'Unknown' }
  }
}

export function roleLabel(role) {
  return { admin: 'Admin', editor: 'Editor', reader: 'Reader' }[role] || role || '—'
}

/** Landing screen for each role after authentication. */
export function dashboardPathFor(role) {
  if (role === 'admin') return '/admin'
  if (role === 'editor') return '/manage'
  return '/'
}

/** Role landing, unless a forced password change must happen first. */
export function landingPathFor(user) {
  if (!user) return '/login'
  if (user.must_change_password) return '/change-password'
  return dashboardPathFor(user.role)
}

export function isRestricted(visibility) {
  return ['registered', 'authenticated', 'private', 'members', 'residents'].includes(
    String(visibility || '').toLowerCase(),
  )
}

export function visibilityLabel(visibility) {
  if (isRestricted(visibility)) return 'Residents only'
  if (String(visibility || '').toLowerCase() === 'public') return 'Public'
  return visibility ? String(visibility) : 'Public'
}

/** Convert an API timestamp to the value expected by <input type="datetime-local">. */
export function toDateTimeLocal(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/** Convert a datetime-local value to an ISO string the API can parse. */
export function fromDateTimeLocal(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toISOString()
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-PH').format(Number(value || 0))
}
