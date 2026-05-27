'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export default function SecurityTab() {
  const { t } = useT()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (newPassword.length < 8) {
      setError(t('settings.security.errMinLength'))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t('settings.security.errMismatch'))
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

      const res = await fetch('/api/practitioner-settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        // Map known errors to translated strings; fall back to server message.
        if (body?.error === 'Current password is incorrect') {
          setError(t('settings.security.errCurrent'))
        } else {
          setError(body?.error ?? `Failed (${res.status})`)
        }
        return
      }

      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setSuccess(false), 4_000)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-1">{t('settings.security.title')}</h3>
        <p className="text-sm text-[var(--bf-muted)]">{t('settings.security.subtitle')}</p>
      </div>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.security.currentPassword')}</span>
        <input
          type="password"
          className="bf-input mt-1 w-full"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.security.newPassword')}</span>
        <input
          type="password"
          className="bf-input mt-1 w-full"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <span className="text-xs text-[var(--bf-muted)] mt-1 block">
          {t('settings.security.passwordHelp')}
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">{t('settings.security.confirmPassword')}</span>
        <input
          type="password"
          className="bf-input mt-1 w-full"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {error && (
        <div className="text-sm text-[var(--bf-danger)] border border-[var(--bf-danger)] rounded p-2">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-[var(--bf-success)] border border-[var(--bf-success)] rounded p-2">
          {t('settings.security.saved')}
        </div>
      )}

      <button type="submit" className="bf-btn-primary" disabled={submitting}>
        {submitting ? t('settings.security.saving') : t('settings.security.save')}
      </button>
    </form>
  )
}
