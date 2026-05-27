'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'
import IssueReceiptModal from './IssueReceiptModal'

interface Props {
  appointmentId: string
  appointmentTime: string
  ratePerSession: number
  mydata_status?: string | null
  mydata_mark?: string | null
  mydata_submitted_at?: string | null
}

export default function ReceiptSection({
  appointmentId,
  appointmentTime,
  ratePerSession,
  mydata_status,
  mydata_mark,
  mydata_submitted_at,
}: Props) {
  const router = useRouter()
  const { t, bcp } = useT()
  const [modalOpen, setModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canIssue = !mydata_status || mydata_status === 'failed'
  const isIssued = mydata_status === 'submitted'
  const isFailed = mydata_status === 'failed'
  const isPending = mydata_status === 'pending'

  async function handleIssueReceipt(amount: number) {
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error(t('receipt.errSession'))
      }

      const res = await fetch(`/api/appointments/${appointmentId}/issue-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ amount }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.error ?? `Request failed (${res.status})`)
      }
      // Refresh server component so the new mydata_status is reflected immediately
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? t('receipt.errFailed'))
      throw err
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleReset() {
    if (!confirm(t('receipt.resetConfirm'))) return
    setError(null)
    setIsResetting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error(t('receipt.errSession'))

      const res = await fetch(`/api/appointments/${appointmentId}/reset-receipt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
      router.refresh()
    } catch (err: any) {
      setError(err?.message ?? t('receipt.errResetFailed'))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="bf-card p-6">
      <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
        {t('receipt.title')}
      </p>

      {isIssued && (
        <div className="space-y-3">
          <div className="bf-badge bf-badge-success">{t('receipt.issued')}</div>
          {mydata_mark && (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{t('receipt.mark')}</p>
              <p className="font-mono text-sm mt-1" style={{ color: 'var(--text)' }}>{mydata_mark}</p>
            </div>
          )}
          {mydata_submitted_at && (
            <div className="text-sm">
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{t('receipt.submitted')}</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>
                {new Date(mydata_submitted_at).toLocaleString(bcp)}
              </p>
            </div>
          )}
        </div>
      )}

      {isPending && (
        <div className="space-y-3">
          <div className="bf-badge bf-badge-warning">{t('receipt.pending')}</div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('receipt.pending.help')}
          </p>
          <button
            onClick={handleReset}
            disabled={isResetting}
            className="bf-btn-secondary text-xs px-3 py-1.5"
          >
            {isResetting ? t('receipt.resetting') : t('receipt.reset')}
          </button>
        </div>
      )}

      {isFailed && (
        <div className="space-y-3">
          <div className="bf-badge bf-badge-danger">{t('receipt.failed')}</div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {t('receipt.failed.help')}
          </p>
        </div>
      )}

      {canIssue && (
        <>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            {isFailed ? t('receipt.cta.retry') : t('receipt.cta.issue')}
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="bf-btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('receipt.btn.issuing') : isFailed ? t('receipt.btn.retry') : t('receipt.btn.issue')}
          </button>
        </>
      )}

      {error && (
        <div
          className="text-xs rounded p-2 mt-3 border"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}
        >
          {error}
        </div>
      )}

      <IssueReceiptModal
        appointmentId={appointmentId}
        appointmentTime={appointmentTime}
        defaultRate={ratePerSession}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleIssueReceipt}
        isLoading={isSubmitting}
      />
    </div>
  )
}
