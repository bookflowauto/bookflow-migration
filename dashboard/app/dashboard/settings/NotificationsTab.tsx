'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export interface NotificationsState {
  sms_reminder_enabled: boolean
  reminder_offset_hours: number
  email_digest_enabled: boolean
}

export default function NotificationsTab({ initial }: { initial: NotificationsState }) {
  const { t } = useT()
  const [form, setForm] = useState<NotificationsState>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  function update<K extends keyof NotificationsState>(key: K, value: NotificationsState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (
      !Number.isInteger(form.reminder_offset_hours) ||
      form.reminder_offset_hours < 1 ||
      form.reminder_offset_hours > 168
    ) {
      setError(t('settings.notifications.errOffset'))
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

      const res = await fetch('/api/practitioner-settings/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(form),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3_000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('settings.notifications.title')}</h3>
        <p className="text-sm text-[var(--bf-muted)]">{t('settings.notifications.subtitle')}</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.sms_reminder_enabled}
            onChange={e => update('sms_reminder_enabled', e.target.checked)}
          />
          <span>
            <span className="text-sm font-medium block">
              {t('settings.notifications.smsReminder')}
            </span>
            <span className="text-xs text-[var(--bf-muted)] block mt-0.5">
              {t('settings.notifications.smsReminderHelp')}
            </span>
          </span>
        </label>

        <label className="block ml-7">
          <span className="text-sm font-medium">{t('settings.notifications.offset')}</span>
          <input
            type="number"
            min={1}
            max={168}
            step={1}
            className="bf-input mt-1 w-32"
            value={form.reminder_offset_hours}
            onChange={e =>
              update('reminder_offset_hours', parseInt(e.target.value, 10) || 0)
            }
            disabled={!form.sms_reminder_enabled}
          />
          <span className="text-xs text-[var(--bf-muted)] mt-1 block">
            {t('settings.notifications.offsetHelp')}
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={form.email_digest_enabled}
            onChange={e => update('email_digest_enabled', e.target.checked)}
          />
          <span>
            <span className="text-sm font-medium block">
              {t('settings.notifications.emailDigest')}
            </span>
            <span className="text-xs text-[var(--bf-muted)] block mt-0.5">
              {t('settings.notifications.emailDigestHelp')}
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className="text-sm text-[var(--bf-danger)] border border-[var(--bf-danger)] rounded p-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-[var(--bf-success)] border border-[var(--bf-success)] rounded p-2">
          {t('settings.notifications.saved')}
        </div>
      )}

      <button type="submit" className="bf-btn-primary" disabled={submitting}>
        {submitting ? t('settings.notifications.saving') : t('settings.notifications.save')}
      </button>
    </form>
  )
}
