'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export interface ProfileState {
  name: string
  email: string
  phone: string
  calendar_id: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ProfileTab({ initial }: { initial: ProfileState }) {
  const { t } = useT()
  const router = useRouter()
  const [form, setForm] = useState<ProfileState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function update<K extends keyof ProfileState>(key: K, value: ProfileState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.name.trim()) {
      setError(t('settings.profile.errName'))
      return
    }
    if (!form.calendar_id.trim()) {
      setError(t('settings.profile.errCalendarId'))
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setError(t('settings.profile.errEmail'))
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError(t('settings.rate.errSession'))
        return
      }

      const res = await fetch('/api/practitioner-settings/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          calendar_id: form.calendar_id.trim(),
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }

      setSuccess(
        body.emailChangePending
          ? t('settings.profile.savedEmail')
          : t('settings.profile.saved'),
      )
      router.refresh()
      setTimeout(() => setSuccess(null), 5_000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('settings.profile.title')}</h3>
        <p className="text-sm text-[var(--bf-muted)]">{t('settings.profile.subtitle')}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.profile.name')}</span>
        <input
          type="text"
          className="bf-input mt-1 w-full"
          value={form.name}
          onChange={e => update('name', e.target.value)}
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.profile.email')}</span>
        <input
          type="email"
          className="bf-input mt-1 w-full"
          value={form.email}
          onChange={e => update('email', e.target.value)}
          required
        />
        <span className="text-xs text-[var(--bf-muted)] mt-1 block">
          {t('settings.profile.emailHelp')}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.profile.phone')}</span>
        <input
          type="tel"
          className="bf-input mt-1 w-full"
          value={form.phone}
          onChange={e => update('phone', e.target.value)}
          placeholder="+30 ..."
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.profile.calendarId')}</span>
        <input
          type="text"
          className="bf-input mt-1 w-full"
          value={form.calendar_id}
          onChange={e => update('calendar_id', e.target.value)}
          required
        />
        <span className="text-xs text-[var(--bf-muted)] mt-1 block">
          {t('settings.profile.calendarIdHelp')}
        </span>
      </label>

      {error && (
        <div className="text-sm text-[var(--bf-danger)] border border-[var(--bf-danger)] rounded p-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-[var(--bf-success)] border border-[var(--bf-success)] rounded p-2">
          {success}
        </div>
      )}

      <button type="submit" className="bf-btn-primary" disabled={submitting}>
        {submitting ? t('settings.profile.saving') : t('settings.profile.save')}
      </button>
    </form>
  )
}
