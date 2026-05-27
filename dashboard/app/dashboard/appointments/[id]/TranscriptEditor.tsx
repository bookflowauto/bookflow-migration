'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'
import { updateTranscript } from './actions'

export default function TranscriptEditor({
  appointmentId,
  initialTranscript,
}: {
  appointmentId: string
  initialTranscript: string
}) {
  const { t } = useT()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(initialTranscript)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  async function handleSave() {
    setSaving(true)
    await updateTranscript(appointmentId, value)
    setSaving(false)
    setEditing(false)
  }

  async function handleExportPDF() {
    setExporting(true)
    try {
      const supabase = createClient()

      let session = null
      for (let i = 0; i < 3; i++) {
        const { data: { session: s } } = await supabase.auth.getSession()
        if (s) {
          session = s
          break
        }
        if (i < 2) await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (!session) {
        setToastMessage(t('transcript.exportNoAuth'))
        setExporting(false)
        return
      }

      const res = await fetch(`/api/appointments/${appointmentId}/export-pdf`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (!res.ok) {
        const error = await res.text().catch(() => 'Unknown error')
        setToastMessage(t('transcript.exportFailed', { error: error || '' }))
        setExporting(false)
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `SOAP_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      setToastMessage(t('transcript.exportSuccess'))
    } catch {
      setToastMessage(t('transcript.exportFailedGeneric'))
    } finally {
      setExporting(false)
    }
  }

  if (editing) {
    return (
      <div>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          rows={10}
          className="bf-input resize-y leading-relaxed"
          style={{ fontFamily: 'inherit' }}
        />
        <div className="flex gap-2 mt-3">
          <button onClick={handleSave} disabled={saving} className="bf-btn-primary">
            {saving ? t('transcript.saving') : t('transcript.save')}
          </button>
          <button
            onClick={() => { setValue(initialTranscript); setEditing(false) }}
            className="bf-btn-secondary"
          >
            {t('transcript.cancel')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4" style={{ color: 'var(--text)' }}>
        {value}
      </p>
      <div className="flex gap-2 flex-wrap items-center">
        <button onClick={() => setEditing(true)} className="bf-btn-secondary inline-flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {t('transcript.edit')}
        </button>
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="bf-btn-secondary inline-flex items-center gap-1.5"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="19" x2="12" y2="12" />
            <polyline points="9 16 12 13 15 16" />
          </svg>
          {exporting ? t('transcript.exporting') : t('transcript.export')}
        </button>
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
