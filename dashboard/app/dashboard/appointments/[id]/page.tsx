import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getT } from '@/lib/i18n/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import TranscriptEditor from './TranscriptEditor'
import ReceiptSection from './ReceiptSection'
import StatusActions from './StatusActions'

const STALE_PENDING_MS = 90 * 1000 // 90s: AADE normally responds in 5–15s

export default async function AppointmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { t, bcp } = await getT()

  const { data: apt } = await supabase
    .from('v_appointment_full')
    .select('*')
    .eq('appointment_id', id)
    .single()

  if (!apt) notFound()

  // Auto-recover stuck 'pending': if Workflow #5 never responded within 5 min,
  // flip to 'failed' so the practitioner sees the retry button.
  if (
    apt.mydata_status === 'pending' &&
    apt.mydata_pending_at &&
    Date.now() - new Date(apt.mydata_pending_at).getTime() > STALE_PENDING_MS
  ) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    await admin
      .from('appointments')
      .update({ mydata_status: 'failed' })
      .eq('id', id)
      .eq('mydata_status', 'pending')
    apt.mydata_status = 'failed'
  }

  const canIssueReceipt = apt.status === 'confirmed' || apt.status === 'completed'

  const formattedTime = new Date(apt.appointment_time).toLocaleString(bcp, {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  const statusKey = `status.${apt.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'}` as const

  return (
    <>
      {/* Back link */}
      <Link
        href={`/dashboard/patients/${apt.patient_id}`}
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {apt.patient_name}
      </Link>

      {/* Header card */}
      <div className="bf-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
              {t('appointment.title')}
            </p>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
              {apt.summary || t('appointment.session')}
            </h1>
            <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>{formattedTime}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <StatusBadge value={apt.status} label={t(statusKey)} />
              <ScribeBadge
                value={apt.scribe_status}
                pendingLabel={t('scribe.pending')}
                transcribingLabel={t('scribe.transcribing')}
                completeLabel={t('scribe.complete')}
                failedLabel={t('scribe.failed')}
              />
            </div>
            <StatusActions
              appointmentId={apt.appointment_id}
              status={apt.status}
              appointmentTime={apt.appointment_time}
            />
          </div>
        </div>
      </div>

      {/* Two-column on desktop */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript */}
          <div className="bf-card p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {t('appointment.sessionNotes')}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                  {t('appointment.sessionNotes.subtitle')}
                </p>
              </div>
              {apt.scribe_status === 'pending' && (
                <a
                  href={`${process.env.NEXT_PUBLIC_SCRIBE_FORM_URL}?appointment_id=${apt.appointment_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bf-btn-primary inline-flex items-center gap-1.5"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
                  </svg>
                  {t('appointment.recordNotes')}
                </a>
              )}
            </div>

            {apt.raw_transcript ? (
              <TranscriptEditor appointmentId={apt.appointment_id} initialTranscript={apt.raw_transcript} />
            ) : (
              <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                {apt.scribe_status === 'transcribing'
                  ? t('appointment.transcribing')
                  : t('appointment.noTranscript')}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: patient info + receipt */}
        <div className="space-y-6">
          {canIssueReceipt && (
            <ReceiptSection
              appointmentId={apt.appointment_id}
              appointmentTime={apt.appointment_time}
              ratePerSession={apt.rate_per_session_eur}
              mydata_status={apt.mydata_status}
              mydata_mark={apt.mydata_mark}
              mydata_submitted_at={apt.mydata_submitted_at}
            />
          )}

          <div className="bf-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
              {t('appointment.patient')}
            </p>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {apt.patient_name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{apt.patient_name}</p>
                <p className="text-xs font-mono" style={{ color: 'var(--text-subtle)' }}>{apt.patient_ref}</p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <Row label={t('appointment.phoneLabel')} value={apt.patient_phone} />
              <Row label={t('appointment.intakeLabel')} value={apt.intake_status} />
            </dl>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>{label}</dt>
      <dd className="text-sm text-right" style={{ color: 'var(--text)' }}>{value || '—'}</dd>
    </div>
  )
}

function StatusBadge({ value, label }: { value: string; label: string }) {
  const map: Record<string, string> = {
    scheduled: 'bf-badge-info',
    confirmed: 'bf-badge-success',
    completed: 'bf-badge-success',
    cancelled: 'bf-badge-danger',
  }
  return <span className={`bf-badge ${map[value] ?? 'bf-badge-muted'}`}>{label}</span>
}

function ScribeBadge({
  value,
  pendingLabel,
  transcribingLabel,
  completeLabel,
  failedLabel,
}: {
  value: string
  pendingLabel: string
  transcribingLabel: string
  completeLabel: string
  failedLabel: string
}) {
  const map: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bf-badge-muted', label: pendingLabel },
    transcribing: { cls: 'bf-badge-warning', label: transcribingLabel },
    complete: { cls: 'bf-badge-success', label: completeLabel },
    failed: { cls: 'bf-badge-danger', label: failedLabel },
  }
  const s = map[value] ?? map.pending
  return <span className={`bf-badge ${s.cls}`}>{s.label}</span>
}
