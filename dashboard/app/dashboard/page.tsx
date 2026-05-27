import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import Link from 'next/link'

export default async function PatientsPage() {
  const supabase = await createClient()
  const { t } = await getT()

  const { data: patients } = await supabase
    .from('patients')
    .select('id, patient_ref, name, intake_status, total_sessions, created_at')
    .order('name')

  const total = patients?.length ?? 0
  const intakeComplete = patients?.filter(p => p.intake_status === 'completed').length ?? 0
  const intakePending = total - intakeComplete
  const totalSessions = patients?.reduce((s, p) => s + (p.total_sessions ?? 0), 0) ?? 0

  const countLabel = total === 1
    ? t('patients.list.count.one', { n: total })
    : t('patients.list.count.other', { n: total })

  return (
    <>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {t('patients.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('patients.subtitle')}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        <MetricCard label={t('patients.kpi.total')} value={total} accent="accent" />
        <MetricCard label={t('patients.kpi.intakeDone')} value={intakeComplete} accent="success" />
        <MetricCard label={t('patients.kpi.intakePending')} value={intakePending} accent="warning" />
        <MetricCard label={t('patients.kpi.totalSessions')} value={totalSessions} accent="muted" />
      </div>

      {/* Patients list */}
      <div className="bf-card overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{t('patients.list.all')}</h2>
          <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>{countLabel}</span>
        </div>

        {patients && patients.length > 0 ? (
          <ul>
            {patients.map((p, i) => (
              <li key={p.id}>
                <Link
                  href={`/dashboard/patients/${p.id}`}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
                  style={{ borderTop: i === 0 ? 'none' : '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>{p.name}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-subtle)' }}>{p.patient_ref}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <SessionIcon /> {p.total_sessions ?? 0}
                    </span>
                    <IntakeBadge
                      value={p.intake_status}
                      doneLabel={t('patients.intake.done')}
                      pendingLabel={t('patients.intake.pending')}
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
          <div className="px-5 py-20 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('patients.empty')}</p>
          </div>
        )}
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string
  value: number | string
  accent: 'accent' | 'success' | 'warning' | 'muted'
}) {
  const dotColors = {
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    muted: 'var(--text-subtle)',
  }
  return (
    <div className="bf-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColors[accent] }} />
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
      </div>
      <p className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}

function IntakeBadge({
  value,
  doneLabel,
  pendingLabel,
}: {
  value: string
  doneLabel: string
  pendingLabel: string
}) {
  if (value === 'completed') {
    return <span className="bf-badge bf-badge-success">{doneLabel}</span>
  }
  return <span className="bf-badge bf-badge-warning">{pendingLabel}</span>
}

function SessionIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
