'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'

export default function ForgotPasswordPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const redirectTo = `${window.location.origin}/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="BookFlow" width={64} height={64} className="mb-4" priority />
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {t('forgot.title')}
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
            {sent ? t('forgot.subtitle.sent') : t('forgot.subtitle.idle')}
          </p>
        </div>

        <div className="bf-card p-6">
          {sent ? (
            <div className="text-center space-y-4">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {t('forgot.checkInbox', { email })}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('forgot.notReceived')}
                <button
                  onClick={() => setSent(false)}
                  className="underline ml-1"
                  style={{ color: 'var(--accent)' }}
                >
                  {t('forgot.tryAgain')}
                </button>
                .
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder={t('auth.emailPlaceholder')}
                  className="bf-input"
                />
              </div>

              {error && (
                <div
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                >
                  {friendlyError(error, t)}
                </div>
              )}

              <button type="submit" disabled={loading} className="bf-btn-primary w-full py-2.5">
                {loading ? t('forgot.btn.sending') : t('forgot.btn.send')}
              </button>
            </form>
          )}
        </div>

        <p className="text-center mt-6 text-sm">
          <Link href="/login" style={{ color: 'var(--text-muted)' }} className="hover:underline">
            {t('auth.backToSignIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}

function friendlyError(msg: string, t: (key: TranslationKey) => string): string {
  const m = msg.toLowerCase()
  if (m.includes('rate limit') || m.includes('too many'))
    return t('auth.err.rateLimit')
  if (m.includes('email') && m.includes('invalid'))
    return t('auth.err.invalidEmail')
  return msg
}
