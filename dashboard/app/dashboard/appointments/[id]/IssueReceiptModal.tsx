'use client'
import { useState } from 'react'
import { useT } from '@/lib/i18n/client'

interface Props {
  appointmentId: string
  appointmentTime: string
  defaultRate: number
  isOpen: boolean
  onClose: () => void
  onSubmit: (amount: number) => Promise<void>
  isLoading?: boolean
}

const LATE_THRESHOLD_MS = 12 * 60 * 60 * 1000 // 12h — AADE allows 24h, warn early

export default function IssueReceiptModal({
  appointmentId,
  appointmentTime,
  defaultRate,
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: Props) {
  const { t } = useT()
  const [amount, setAmount] = useState(defaultRate)
  const [error, setError] = useState<string | null>(null)

  const ageMs = Date.now() - new Date(appointmentTime).getTime()
  const isLate = ageMs > LATE_THRESHOLD_MS
  const ageHours = Math.floor(ageMs / (60 * 60 * 1000))

  async function handleSubmit() {
    setError(null)
    if (amount <= 0) {
      setError(t('receipt.modal.errPositive'))
      return
    }
    try {
      await onSubmit(amount)
      onClose()
    } catch (err: any) {
      setError(err?.message ?? t('receipt.errFailed'))
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-lg p-6 max-w-md w-full border"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          color: 'var(--text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">{t('receipt.modal.title')}</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('receipt.modal.amount')}</label>
            <div className="flex gap-2">
              <span
                className="flex items-center px-3 rounded-l border"
                style={{
                  background: 'var(--surface-2)',
                  color: 'var(--text-muted)',
                  borderColor: 'var(--border)',
                }}
              >
                €
              </span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="bf-input flex-1 rounded-l-none"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {t('receipt.modal.amountHelp')}
            </p>
          </div>

          {error && (
            <div
              className="text-sm rounded p-2 border"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}
            >
              {error}
            </div>
          )}

          {isLate && (
            <div
              className="text-sm rounded p-3 border"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', background: 'var(--danger-bg)' }}
            >
              <p>
                <strong>{t('receipt.modal.lateTitle')}</strong>{' '}
                {t('receipt.modal.lateBody', { hours: ageHours })}
              </p>
            </div>
          )}

          <div
            className="rounded p-3 text-sm"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}
          >
            <p>{t('receipt.modal.info')}</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="bf-btn-secondary flex-1"
            disabled={isLoading}
          >
            {t('receipt.modal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="bf-btn-primary flex-1"
            disabled={isLoading}
          >
            {isLoading ? t('receipt.modal.submitting') : t('receipt.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  )
}
