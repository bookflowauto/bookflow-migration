'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import {
  type Appointment,
  SESSION_MINUTES,
  formatTime,
  statusStyle,
} from './utils'

export default function AppointmentPanel({
  appointment,
  onClose,
}: {
  appointment: Appointment | null
  onClose: () => void
}) {
  const { t } = useT()

  // Close on Escape
  useEffect(() => {
    if (!appointment) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [appointment, onClose])

  const open = appointment !== null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={t('panel.title')}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col transition-transform"
        style={{
          background: 'var(--surface)',
          borderLeft: '1px solid var(--border)',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          boxShadow: open ? 'var(--shadow-lg)' : 'none',
        }}
      >
        {appointment && <PanelBody appointment={appointment} onClose={onClose} />}
      </aside>
    </>
  )
}

function PanelBody({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const { t, bcp } = useT()
  const start = new Date(appointment.appointment_time)
  const end = new Date(start.getTime() + SESSION_MINUTES * 60_000)
  const style = statusStyle(appointment.status)
  const statusKey: TranslationKey = `status.${appointment.status}`

  return (
    <>
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 h-16 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <h2 className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {t('panel.title')}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('panel.close')}
          className="w-8 h-8 inline-flex items-center justify-center rounded-md transition-colors hover:bg-[var(--surface-2)]"
          style={{ color: 'var(--text-muted)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Patient */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>
            {t('panel.patient')}
          </p>
          <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            {appointment.patient_name ?? t('calendar.unknownPatient')}
          </p>
          {appointment.patient_ref && (
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text-subtle)' }}>
              {appointment.patient_ref}
            </p>
          )}
        </div>

        {/* Time + status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: style.dot }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: style.text }}>
              {t(statusKey)}
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {start.toLocaleDateString(bcp, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {formatTime(start, bcp)} – {formatTime(end, bcp)} ({t('panel.minutes', { n: SESSION_MINUTES })})
          </p>
        </div>

        {appointment.summary && (
          <div>
            <p className="text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-subtle)' }}>
              {t('panel.summary')}
            </p>
            <p className="text-sm" style={{ color: 'var(--text)' }}>{appointment.summary}</p>
          </div>
        )}

        {/* Workflow signals */}
        <div>
          <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--text-subtle)' }}>
            {t('panel.workflow')}
          </p>
          <ul className="space-y-1.5 text-sm">
            <Signal
              ok={appointment.intake_status === 'completed'}
              labelOk={t('panel.intake.done')}
              labelMissing={t('panel.intake.pending')}
            />
            <Signal
              ok={Boolean(appointment.raw_transcript)}
              labelOk={t('panel.soap.done')}
              labelMissing={t('panel.soap.pending')}
            />
            <Signal
              ok={appointment.mydata_status === 'submitted'}
              labelOk={t('panel.receipt.done')}
              labelMissing={t('panel.receipt.pending')}
            />
          </ul>
        </div>

        {appointment.patient_phone && (
          <div>
            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-subtle)' }}>
              {t('panel.phone')}
            </p>
            <p className="text-sm font-mono" style={{ color: 'var(--text)' }}>{appointment.patient_phone}</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t p-4 flex flex-col gap-2 shrink-0" style={{ borderColor: 'var(--border)' }}>
        <Link
          href={`/dashboard/appointments/${appointment.appointment_id}`}
          className="bf-btn-primary text-center"
        >
          {t('panel.openAppointment')}
        </Link>
        {appointment.patient_id && (
          <Link
            href={`/dashboard/patients/${appointment.patient_id}`}
            className="bf-btn-secondary text-center"
          >
            {t('panel.patientProfile')}
          </Link>
        )}
      </div>
    </>
  )
}

function Signal({
  ok,
  labelOk,
  labelMissing,
}: {
  ok: boolean
  labelOk: string
  labelMissing: string
}) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-subtle)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )}
      <span style={{ color: ok ? 'var(--text)' : 'var(--text-muted)' }}>
        {ok ? labelOk : labelMissing}
      </span>
    </li>
  )
}
