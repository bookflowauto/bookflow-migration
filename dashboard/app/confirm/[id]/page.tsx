import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { confirmAppointment } from './actions'
import Image from 'next/image'

export default async function ConfirmPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: apt } = await supabase
    .from('v_appointment_full')
    .select('appointment_id, appointment_time, status, patient_name, practitioner_name, intake_status')
    .eq('appointment_id', id)
    .single()

  if (!apt) notFound()

  const alreadyConfirmed = apt.status === 'confirmed'
  const cancelled = apt.status === 'cancelled'
  const formattedTime = new Date(apt.appointment_time).toLocaleString('el-GR', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  })

  async function handleConfirm() {
    'use server'
    await confirmAppointment(id)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="BookFlow" width={56} height={56} className="mb-3" priority />
          <p className="text-xs tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
            Επιβεβαίωση Ραντεβού
          </p>
        </div>

        <div className="bf-card p-6 mb-6">
          <Field label="Ασθενής" value={apt.patient_name} />
          <Field label="Θεραπευτής" value={apt.practitioner_name} />
          <Field label="Ημερομηνία & Ώρα" value={formattedTime} last />
        </div>

        {cancelled ? (
          <div
            className="text-center text-sm py-3 px-4 rounded-lg"
            style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
          >
            Το ραντεβού αυτό έχει ακυρωθεί.
          </div>
        ) : alreadyConfirmed ? (
          <div className="text-center">
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg mb-4"
              style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Έχει ήδη επιβεβαιωθεί
            </div>
            {apt.intake_status === 'pending' && process.env.NEXT_PUBLIC_INTAKE_FORM_URL ? (
              <a
                href={process.env.NEXT_PUBLIC_INTAKE_FORM_URL}
                className="bf-btn-primary w-full block text-center py-3"
              >
                Συμπλήρωση Φόρμας Εισαγωγής
              </a>
            ) : (
              <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                Σας ευχαριστούμε. Τα λέμε σύντομα.
              </p>
            )}
          </div>
        ) : (
          <form action={handleConfirm}>
            <button type="submit" className="bf-btn-primary w-full py-3 text-base">
              Επιβεβαίωση Ραντεβού
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

function Field({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={last ? '' : 'mb-4'}>
      <p className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="text-base font-medium" style={{ color: 'var(--text)' }}>{value}</p>
    </div>
  )
}
