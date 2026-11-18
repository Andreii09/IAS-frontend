import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, getErrorMessage, getFieldErrors } from '../api/client.js'
import Badge from '../components/Badge.jsx'
import Spinner from '../components/Spinner.jsx'
import { useToast } from '../components/Toast.jsx'
import { AlertIcon, InfoIcon } from '../components/Icons.jsx'
import {
  CATEGORIES,
  categoryLabel,
  fromDateTimeLocal,
  toDateTimeLocal,
} from '../lib/format.js'

const inputClass =
  'w-full rounded-lg border border-ocean-100 bg-surface px-3 py-2.5 text-sm text-ocean-900 placeholder:text-ocean-600/60 focus:border-ocean-300 focus:bg-white'

const EMPTY_FORM = {
  title: '',
  category: 'announcement',
  summary: '',
  body: '',
  cover_image: '',
  tags: '',
  status: 'draft',
  visibility: 'public',
  published_at: '',
}

const STATUSES = [
  { value: 'draft', label: 'Draft — only visible to you and admins' },
  { value: 'scheduled', label: 'Scheduled — publish automatically' },
  { value: 'published', label: 'Published — visible on the feed' },
]

const VISIBILITIES = [
  { value: 'public', label: 'Public — anyone can read' },
  { value: 'residents', label: 'Residents only — signed-in users' },
]

export default function StoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState(EMPTY_FORM)
  const [originalPublishedAt, setOriginalPublishedAt] = useState(null)
  const [loading, setLoading] = useState(isEdit)
  const [loadError, setLoadError] = useState('')
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (!isEdit) {
      setLoading(false)
      return undefined
    }
    let active = true
    setLoading(true)
    setLoadError('')

    api
      .get(`/news/${id}`)
      .then(({ data }) => {
        if (!active) return
        const article = data || {}
        setForm({
          title: article.title || '',
          category: article.category || 'announcement',
          summary: article.summary || '',
          body: article.body || '',
          cover_image: article.cover_image || '',
          tags: Array.isArray(article.tags) ? article.tags.join(', ') : article.tags || '',
          status: article.status || 'draft',
          visibility: article.visibility || 'public',
          published_at: toDateTimeLocal(article.published_at),
        })
        setOriginalPublishedAt(article.published_at || null)
        setDirty(false)
      })
      .catch((err) => {
        if (active) setLoadError(getErrorMessage(err, 'Unable to load this story for editing.'))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id, isEdit])

  useEffect(() => {
    if (!dirty) return undefined
    const handler = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  function update(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }))
      setDirty(true)
      setErrors((current) => {
        if (!current[field]) return current
        const next = { ...current }
        delete next[field]
        return next
      })
    }
  }

  const errorMessages = useMemo(
    () => Object.values(errors).flat().filter(Boolean),
    [errors],
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setErrors({})

    const tagList = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .filter((tag, index, all) => all.indexOf(tag) === index)

    const publishedAt =
      form.status === 'scheduled'
        ? fromDateTimeLocal(form.published_at)
        : originalPublishedAt || null

    const payload = {
      title: form.title.trim(),
      category: form.category,
      summary: form.summary.trim() || null,
      body: form.body,
      cover_image: form.cover_image.trim() || null,
      tags: tagList,
      status: form.status,
      visibility: form.visibility,
      published_at: publishedAt,
    }

    try {
      if (isEdit) {
        await api.put(`/news/${id}`, payload)
        toast.success('Story updated.')
      } else {
        await api.post('/news', payload)
        toast.success('Story created.')
      }
      setDirty(false)
      navigate('/manage')
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save this story.'))
      setErrors(getFieldErrors(err))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-xl border border-ocean-100 bg-white">
        <Spinner label="Loading story…" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{loadError}</p>
        <Link
          to="/manage"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-semibold text-ocean-700 ring-1 ring-ocean-100 hover:bg-ocean-50"
        >
          Back to my stories
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm">
            <Link to="/manage" className="font-medium text-ocean-600 hover:text-ocean-700 hover:underline">
              My stories
            </Link>
            <span className="mx-2 text-ocean-300" aria-hidden="true">/</span>
            <span className="text-ocean-600">{isEdit ? 'Edit' : 'New story'}</span>
          </nav>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ocean-900 sm:text-3xl">
            {isEdit ? 'Edit story' : 'Write a new story'}
          </h1>
          <p className="mt-1 text-sm text-ocean-600">
            Stories are saved with the status you choose. Scheduled stories publish at the time you set.
          </p>
        </div>
        <Badge tone={form.status === 'published' ? 'success' : form.status === 'scheduled' ? 'warning' : 'neutral'}>
          {form.status}
        </Badge>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700" role="alert">
          <p className="flex items-center gap-2 font-semibold">
            <AlertIcon className="h-4 w-4" />
            Please fix the following before saving:
          </p>
          {errorMessages.length > 0 ? (
            <ul className="mt-2 list-inside list-disc space-y-0.5">
              {errorMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-1">{error}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-ocean-900">Story details</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                Title <span className="text-rose-600">*</span>
              </label>
              <input
                id="title"
                type="text"
                required
                maxLength={200}
                value={form.title}
                onChange={update('title')}
                placeholder="A clear, specific headline"
                className={inputClass}
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title[0]}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                  Category <span className="text-rose-600">*</span>
                </label>
                <select
                  id="category"
                  value={form.category}
                  onChange={update('category')}
                  className={inputClass}
                  aria-invalid={Boolean(errors.category)}
                >
                  {CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {categoryLabel(item)}
                    </option>
                  ))}
                </select>
                {errors.category && <p className="mt-1 text-xs text-rose-600">{errors.category[0]}</p>}
              </div>

              <div>
                <label htmlFor="cover_image" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                  Cover image URL <span className="font-normal text-ocean-600">(optional)</span>
                </label>
                <input
                  id="cover_image"
                  type="url"
                  value={form.cover_image}
                  onChange={update('cover_image')}
                  placeholder="https://example.com/photo.jpg"
                  className={inputClass}
                  aria-invalid={Boolean(errors.cover_image)}
                />
                {errors.cover_image && (
                  <p className="mt-1 text-xs text-rose-600">{errors.cover_image[0]}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="summary" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                Summary <span className="font-normal text-ocean-600">(shown on cards)</span>
              </label>
              <textarea
                id="summary"
                rows={3}
                maxLength={500}
                value={form.summary}
                onChange={update('summary')}
                placeholder="One or two sentences that tell readers what the story is about."
                className={inputClass}
                aria-invalid={Boolean(errors.summary)}
              />
              <div className="mt-1 flex items-center justify-between text-xs text-ocean-600">
                <span>{errors.summary ? <span className="text-rose-600">{errors.summary[0]}</span> : 'Keep it under 500 characters.'}</span>
                <span>{form.summary.length}/500</span>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-ocean-900">Story body</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-ocean-600">
              <InfoIcon className="h-3.5 w-3.5" />
              Server-side sanitized HTML
            </span>
          </div>

          <div className="mt-2 rounded-lg bg-ocean-50 p-3 text-xs leading-relaxed text-ocean-700">
            Basic HTML is supported: <code>&lt;p&gt;</code>, <code>&lt;br&gt;</code>,{' '}
            <code>&lt;strong&gt;</code>, <code>&lt;em&gt;</code>, <code>&lt;a href&gt;</code>,{' '}
            <code>&lt;ul&gt;</code>/<code>&lt;ol&gt;</code>/<code>&lt;li&gt;</code>,{' '}
            <code>&lt;h2&gt;</code>–<code>&lt;h4&gt;</code>, and <code>&lt;blockquote&gt;</code>.
            Scripts and event handlers are removed by the server.
          </div>

          <div className="mt-4">
            <label htmlFor="body" className="mb-1.5 block text-sm font-semibold text-ocean-900">
              Body <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="body"
              rows={16}
              required
              value={form.body}
              onChange={update('body')}
              placeholder={'<p>Write the story here…</p>\n\n<h2>Key details</h2>\n<p>…</p>'}
              className={`${inputClass} font-mono text-[13px] leading-relaxed`}
              aria-invalid={Boolean(errors.body)}
              aria-describedby="body-help"
            />
            <p id="body-help" className="mt-1 text-xs text-ocean-600">
              {errors.body ? (
                <span className="text-rose-600">{errors.body[0]}</span>
              ) : (
                'Use blank lines between paragraphs. HTML is rendered on the article page.'
              )}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-ocean-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-ocean-900">Publishing</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={update('status')}
                className={inputClass}
                aria-invalid={Boolean(errors.status)}
              >
                {STATUSES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.status && <p className="mt-1 text-xs text-rose-600">{errors.status[0]}</p>}
            </div>

            <div>
              <label htmlFor="visibility" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                Visibility
              </label>
              <select
                id="visibility"
                value={form.visibility}
                onChange={update('visibility')}
                className={inputClass}
                aria-invalid={Boolean(errors.visibility)}
              >
                {VISIBILITIES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              {errors.visibility && (
                <p className="mt-1 text-xs text-rose-600">{errors.visibility[0]}</p>
              )}
            </div>

            {form.status === 'scheduled' && (
              <div className="sm:col-span-2">
                <label htmlFor="published_at" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                  Publish at <span className="text-rose-600">*</span>
                </label>
                <input
                  id="published_at"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={update('published_at')}
                  className={`${inputClass} sm:max-w-xs`}
                  aria-invalid={Boolean(errors.published_at)}
                />
                <p className="mt-1 text-xs text-ocean-600">
                  {errors.published_at ? (
                    <span className="text-rose-600">{errors.published_at[0]}</span>
                  ) : (
                    'Your local time. The story becomes visible automatically at this moment.'
                  )}
                </p>
              </div>
            )}

            <div className="sm:col-span-2">
              <label htmlFor="tags" className="mb-1.5 block text-sm font-semibold text-ocean-900">
                Tags <span className="font-normal text-ocean-600">(comma separated)</span>
              </label>
              <input
                id="tags"
                type="text"
                value={form.tags}
                onChange={update('tags')}
                placeholder="advisory, road-closure, barangay"
                className={inputClass}
                aria-invalid={Boolean(errors.tags)}
              />
              {errors.tags ? (
                <p className="mt-1 text-xs text-rose-600">{errors.tags[0]}</p>
              ) : (
                <p className="mt-1 text-xs text-ocean-600">Up to a handful of short tags works best.</p>
              )}
            </div>
          </div>
        </section>

        <div className="flex flex-col-reverse gap-3 border-t border-ocean-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
          <Link
            to="/manage"
            onClick={(event) => {
              if (dirty && !window.confirm('Discard unsaved changes?')) event.preventDefault()
            }}
            className="inline-flex justify-center rounded-lg border border-ocean-100 bg-white px-4 py-2.5 text-sm font-semibold text-ocean-700 hover:bg-ocean-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-ocean-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ocean-600 disabled:opacity-60"
          >
            {busy ? <Spinner label="Saving…" className="[&_span]:text-white" /> : isEdit ? 'Save changes' : 'Create story'}
          </button>
        </div>
      </form>
    </div>
  )
}
