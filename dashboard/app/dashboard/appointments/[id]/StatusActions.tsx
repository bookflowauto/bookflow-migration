'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

interface Props {
  appointmentId: string
  status: string
  appointmentTime: string
}

export default function StatusActions({ appointmentId, status, appointmentTime }: Props) {
  const router = useRouter()
  const { t } = useT()
  const [busy, setBusy] = useState<null | 'completed' | 'cancelled'>(null)
  const [error, setError] = useState<string | null>(null)

  const isPast = new Date(appointmentTime).getTime() < Date.now()
  const canMarkAttended = isPast && (status === 'scheduled' || status === 'confirmed')
  const canCancel = status === 'scheduled' || status === 'confirmed'

  if (!canMarkAttended && !canCancel) return null

  async function updateStatus(newStatus: 'completed' | 'cancelled') {
    setError(null)
    setBusy(newStatus)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error(t('statusActions.errSession'))

      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? t('statusActions.errGeneric'))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 flex-wrap">
        {canMarkAttended && (
          <button
            onClick={() => updateStatus('completed')}
            disabled={busy !== null}
            className="bf-btn-secondary text-xs px-3 py-1.5"
          >
            {busy === 'completed' ? t('statusActions.marking') : t('statusActions.markAttended')}
          </button>
        )}
        {canCancel && (
          <button
            onClick={() => {
              if (confirm(t('statusActions.confirmCancel'))) {
                updateStatus('cancelled')
              }
            }}
            disabled={busy !== null}
            className="bf-btn-secondary text-xs px-3 py-1.5"
            style={{ color: 'var(--danger)' }}
          >
            {busy === 'cancelled' ? t('statusActions.cancelling') : t('statusActions.markCancelled')}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
      )}
    </div>
  )
}
