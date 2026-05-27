'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

export default function ManageButton() {
  const { t } = useT()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function open() {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError(t('billing.manage.errAuth'))
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await res.json()
      if (!res.ok || !data.url) throw new Error(data.error || t('billing.manage.errFailed'))
      window.location.href = data.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('billing.manage.errFailed'))
      setLoading(false)
    }
  }

  return (
    <div>
      <button onClick={open} disabled={loading} className="bf-btn-secondary inline-flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2l4 4-10 10H8v-4L18 2z" />
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        </svg>
        {loading ? t('billing.manage.opening') : t('billing.manage')}
      </button>
      {error && (
        <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  )
}
