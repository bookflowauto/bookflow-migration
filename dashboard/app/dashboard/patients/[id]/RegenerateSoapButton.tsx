'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

type PractitionerStats = {
  plan_tier: 'essentials' | 'professional' | 'premium'
  regenerate_soap_count: number
  regenerate_soap_reset_date: string
}

const REGENERATE_LIMITS: Record<string, number> = {
  essentials: 25,
  professional: 60,
  premium: Infinity,
}

export default function RegenerateSoapButton({
  appointmentId,
}: {
  appointmentId: string | null
}) {
  const router = useRouter()
  const { t } = useT()
  const [regenerating, setRegenerating] = useState(false)
  const [stats, setStats] = useState<PractitionerStats | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchPractitionerStats()
  }, [])

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  async function getSession() {
    const supabase = createClient()
    for (let i = 0; i < 3; i++) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) return session
      if (i < 2) await new Promise(r => setTimeout(r, 100))
    }
    return null
  }

  async function fetchPractitionerStats() {
    try {
      const session = await getSession()
      if (!session) return
      const res = await fetch('/api/practitioner-stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (!res.ok) return
      setStats(await res.json())
    } catch (err) {
      console.error('Stats error:', err)
    }
  }

  async function handleRegenerate() {
    if (!appointmentId) {
      setToastMessage(t('regenerate.noTranscripts'))
      return
    }
    setRegenerating(true)
    try {
      const session = await getSession()
      if (!session) {
        setToastMessage(t('regenerate.noAuth'))
        setRegenerating(false)
        return
      }

      const res = await fetch('/api/regenerate-soap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ appointment_id: appointmentId }),
      })

      if (res.status === 429) {
        setToastMessage(t('regenerate.quotaHit'))
      } else if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }))
        setToastMessage(t('regenerate.failed', { error: error.error || '' }))
      } else {
        await fetchPractitionerStats()
        setToastMessage(t('regenerate.success'))
        router.refresh()
      }
    } catch {
      setToastMessage(t('regenerate.failedGeneric'))
    } finally {
      setRegenerating(false)
    }
  }

  const quotaBadge = () => {
    if (!stats) return null
    if (stats.plan_tier === 'premium') {
      return <span className="bf-badge bf-badge-info">{t('regenerate.unlimited')}</span>
    }
    const limit = REGENERATE_LIMITS[stats.plan_tier] || 25
    const percentUsed = (stats.regenerate_soap_count / limit) * 100
    let badgeClass = 'bf-badge-muted'
    if (percentUsed >= 100) badgeClass = 'bf-badge-danger'
    else if (percentUsed >= 80) badgeClass = 'bf-badge-warning'
    return (
      <span className={`bf-badge ${badgeClass}`}>
        {t('regenerate.counter', { n: stats.regenerate_soap_count, limit })}
      </span>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={handleRegenerate}
          disabled={regenerating || !appointmentId}
          className="bf-btn-secondary inline-flex items-center gap-1.5"
          title={!appointmentId ? t('regenerate.tooltipNoTranscripts') : undefined}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          {regenerating ? t('regenerate.btn.busy') : t('regenerate.btn')}
        </button>
        {quotaBadge()}
      </div>
      {toastMessage && (
        <div
          className="mt-3 p-3 rounded text-sm"
          style={{
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-text)',
            border: '1px solid var(--warning-border)',
          }}
        >
          {toastMessage}
        </div>
      )}
    </div>
  )
}
