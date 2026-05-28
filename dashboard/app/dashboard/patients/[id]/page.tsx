import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import RegenerateSoapButton from './RegenerateSoapButton'

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { t, bcp } = await getT()

  const { data: patient } = await supabase
    .from('patients')
    .select('id, patient_ref, name, email, phone, date_of_birth, intake_status, total_sessions, merged_clinical_summary')
    .eq('id', id)
    .single()

  if (!patient) notFound()

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, appointment_time, summary, status, scribe_status, raw_transcript')
    .eq('patient_id', id)
    .order('appointment_time', { ascending: false })

  const age = patient.date_of_birth
    ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null

  const dobFormatted = patient.date_of_birth
    ? new Date(patient.date_of_birth).toLocaleDateString(bcp, { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  // Strip Greek country code prefix from both display and tel: link
  const phoneDisplay =
    patient.phone && /^30\d{10}$/.test(patient.phone)
      ? patient.phone.slice(2)
      : patient.phone
  const phoneHref = phoneDisplay ?? null

  // Deterministic per-patient avatar color so each patient is visually distinguishable
  const AVATAR_PALETTE = [
    { bg: 'rgba(45, 212, 192, 0.15)', fg: '#2DD4C0' },   // teal
    { bg: 'rgba(96, 165, 250, 0.15)', fg: '#60A5FA' },   // blue
    { bg: 'rgba(167, 139, 250, 0.18)', fg: '#A78BFA' },  // violet
    { bg: 'rgba(244, 114, 182, 0.18)', fg: '#F472B6' },  // pink
    { bg: 'rgba(251, 146, 60, 0.18)', fg: '#FB923C' },   // orange
    { bg: 'rgba(52, 211, 153, 0.18)', fg: '#34D399' },   // emerald
    { bg: 'rgba(250, 204, 21, 0.20)', fg: '#FACC15' },   // amber
  ]
  let avatarHash = 0
  for (let i = 0; i < patient.id.length; i++) avatarHash = (avatarHash * 31 + patient.id.charCodeAt(i)) >>> 0
  const avatarColor = AVATAR_PALETTE[avatarHash % AVATAR_PALETTE.length]

  const latestTranscribedAppointmentId =
    appointments?.find(a => a.raw_transcript && a.raw_transcript.trim().length > 0)?.id ?? null

  const now = Date.now()
  const upcoming = appointments?.filter(a => new Date(a.appointment_time).getTime() > now).length ?? 0
  const completed = appointments?.filter(a => a.status === 'completed').length ?? 0

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {t('patients.title')}
      </Link>

      {/* Patient header card */}
      <div className="bf-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold shrink-0"
              style={{ background: avatarColor.bg, color: avatarColor.fg }}
            >
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{patient.name}</h1>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-subtle)' }}>{patient.patient_ref}</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-2 mt-2 text-sm">
                {patient.email && (
                  <a
                    href={`mailto:${patient.email}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    {patient.email}
                  </a>
                )}
                {phoneHref && (
                  <a
                    href={`tel:${phoneHref}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    {phoneDisplay}
                  </a>
                )}
                {dobFormatted && (
                  <span className="inline-flex items-center gap-1.5 px-1" style={{ color: 'var(--text-muted)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    {dobFormatted}{age !== null ? ` (${age})` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <IntakeBadge
              value={patient.intake_status}
              completedLabel={t('patient.intake.completed')}
              pendingLabel={t('patient.intake.pending')}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--text-subtle)' }}>{t('patient.intakeStatus')}</p>
          </div>
        </div>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <MiniStat label={t('patient.stats.sessions')} value={patient.total_sessions ?? 0} />
        <MiniStat label={t('patient.stats.upcoming')} value={upcoming} />
        <MiniStat label={t('patient.stats.completed')} value={completed} />
      </div>

      {/* Clinical summary */}
      {patient.merged_clinical_summary && (
        <div className="bf-card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('patient.soap.title')}
              </p>
            </div>
            <RegenerateSoapButton appointmentId={latestTranscribedAppointmentId} />
          </div>
          <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text)' }}>
            {patient.merged_clinical_summary}
          </p>
        </div>
      )}

      {/* Appointments */}
      <div className="bf-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('patient.appointments.title')}</h2>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>
            {appointments?.length ?? 0} {t('patient.appointments.totalSuffix')}
          </span>
        </div>

        {appointments && appointments.length > 0 ? (
          <ul>
            {appointments.map((a, i) => (
              <li key={a.id}>
                <Link
                  href={`/dashboard/appointments/${a.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{a.summary || t('patient.session')}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(a.appointment_time).toLocaleString(bcp, {
                        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge value={a.status} label={t(`status.${a.status as 'scheduled' | 'confirmed' | 'completed' | 'cancelled'}`)} />
                    <ScribeBadge
                      value={a.scribe_status}
                      transcribingLabel={t('scribe.transcribing')}
                      completeLabel={t('scribe.complete')}
                      failedLabel={t('scribe.failed')}
                    />
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-subtle)' }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>{t('patient.appointments.empty')}</p>
        )}
      </div>
    </>
  )
}

function MiniStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bf-card p-4">
      <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-2xl font-semibold mt-1 tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function IntakeBadge({
  value,
  completedLabel,
  pendingLabel,
}: {
  value: string
  completedLabel: string
  pendingLabel: string
}) {
  if (value === 'completed') return <span className="bf-badge bf-badge-success">{completedLabel}</span>
  return <span className="bf-badge bf-badge-warning">{pendingLabel}</span>
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
  transcribingLabel,
  completeLabel,
  failedLabel,
}: {
  value: string
  transcribingLabel: string
  completeLabel: string
  failedLabel: string
}) {
  if (!value || value === 'pending') return null
  const map: Record<string, { cls: string; label: string }> = {
    transcribing: { cls: 'bf-badge-warning', label: transcribingLabel },
    complete: { cls: 'bf-badge-success', label: completeLabel },
    failed: { cls: 'bf-badge-danger', label: failedLabel },
  }
  const s = map[value]
  if (!s) return null
  return <span className={`bf-badge ${s.cls}`}>{s.label}</span>
}
