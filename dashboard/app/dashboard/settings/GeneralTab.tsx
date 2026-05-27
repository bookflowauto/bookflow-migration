'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/dictionary'

interface Config {
  rate_per_session_eur: number
  [key: string]: any
}

export default function GeneralTab({
  initial,
  initialLocale,
  onSave,
}: {
  initial: Config
  initialLocale: Locale
  onSave: (cfg: Partial<Config>) => void
}) {
  const { t } = useT()
  const router = useRouter()
  const [rate, setRate] = useState(initial.rate_per_session_eur ?? 50)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Language state
  const [locale, setLocale] = useState<Locale>(initialLocale)
  const [localeSaving, setLocaleSaving] = useState<Locale | null>(null)
  const [localeError, setLocaleError] = useState<string | null>(null)
  const [localeSaved, setLocaleSaved] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (rate <= 0) {
      setError(t('settings.rate.errPositive'))
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

      const res = await fetch('/api/practitioner-settings/rate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rate_per_session_eur: parseFloat(rate.toString()) }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }

      setSuccess(true)
      onSave({ ...initial, rate_per_session_eur: rate })
      setTimeout(() => setSuccess(false), 3_000)
    } finally {
      setSubmitting(false)
    }
  }

  async function changeLocale(next: Locale) {
    if (next === locale || localeSaving) return
    setLocaleError(null)
    setLocaleSaved(false)
    setLocaleSaving(next)
    const prev = locale
    setLocale(next) // optimistic
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLocaleError(t('settings.rate.errSession'))
        setLocale(prev)
        return
      }
      const res = await fetch('/api/practitioner-settings/locale', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ locale: next }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setLocaleError(body?.error ?? `Failed (${res.status})`)
        setLocale(prev)
        return
      }
      setLocaleSaved(true)
      router.refresh() // re-render with new locale across the tree
      setTimeout(() => setLocaleSaved(false), 3_000)
    } finally {
      setLocaleSaving(null)
    }
  }

  return (
    <div className="space-y-8 max-w-md">
      {/* Language */}
      <section>
        <h3 className="text-lg font-semibold mb-1">{t('settings.language.title')}</h3>
        <p className="text-sm text-[var(--bf-muted)] mb-4">{t('settings.language.subtitle')}</p>

        <div
          role="radiogroup"
          aria-label={t('settings.language.title')}
          className="inline-flex p-0.5 rounded-lg"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          {(['en', 'el'] as const).map(opt => {
            const active = opt === locale
            const label = opt === 'en' ? t('settings.language.english') : t('settings.language.greek')
            return (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => changeLocale(opt)}
                disabled={localeSaving !== null}
                className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                style={{
                  background: active ? 'var(--surface)' : 'transparent',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  opacity: localeSaving === opt ? 0.6 : 1,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {localeError && (
          <div className="text-sm mt-3" style={{ color: 'var(--danger)' }}>{localeError}</div>
        )}
        {localeSaved && (
          <div className="text-sm mt-3" style={{ color: 'var(--success)' }}>
            {t('settings.language.saved')}
          </div>
        )}
      </section>

      {/* Session rate */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold mb-1">{t('settings.rate.title')}</h3>
          <p className="text-sm text-[var(--bf-muted)] mb-4">{t('settings.rate.subtitle')}</p>

          <label className="block">
            <span className="text-sm font-medium">{t('settings.rate.label')}</span>
            <div className="flex gap-2 mt-1">
              <span className="flex items-center px-3 bg-[var(--bf-surface-secondary)] rounded-l text-[var(--bf-muted)]">
                €
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="bf-input flex-1 rounded-l-none"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </label>
        </div>

        {error && (
          <div className="text-sm text-[var(--bf-danger)] border border-[var(--bf-danger)] rounded p-2">
            {error}
          </div>
        )}

        {success && (
          <div className="text-sm text-[var(--bf-success)] border border-[var(--bf-success)] rounded p-2">
            {t('settings.rate.saved')}
          </div>
        )}

        <button type="submit" className="bf-btn-primary" disabled={submitting}>
          {submitting ? t('settings.rate.saving') : t('settings.rate.save')}
        </button>
      </form>
    </div>
  )
}
