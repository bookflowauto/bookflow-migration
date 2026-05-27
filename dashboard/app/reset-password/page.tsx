'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useT } from '@/lib/i18n/client'

export default function ResetPasswordPage() {
  const { t } = useT()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Supabase puts the recovery token in the URL hash and auto-creates a session.
  // We just need to verify a session exists before letting the user set a new password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setHasSession(!!session)
      }
    })
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
    })
    return () => { sub.subscription.unsubscribe() }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError(t('reset.errMinLength'))
      return
    }
    if (password !== confirm) {
      setError(t('reset.errMismatch'))
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="BookFlow" width={64} height={64} className="mb-4" priority />
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {t('reset.title')}
          </h1>
          <p className="text-sm mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
            {t('reset.subtitle')}
          </p>
        </div>

        <div className="bf-card p-6">
          {hasSession === false ? (
            <div className="text-center space-y-4">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-sm" style={{ color: 'var(--text)' }}>
                {t('reset.invalidLink')}
              </p>
              <Link href="/forgot-password" className="bf-btn-primary inline-block">
                {t('reset.requestNew')}
              </Link>
            </div>
          ) : done ? (
            <div className="text-center space-y-3">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'var(--success-bg)', color: 'var(--success)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {t('reset.success')}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {t('reset.redirecting')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  {t('reset.newPassword')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder={t('reset.newPlaceholder')}
                  className="bf-input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                  {t('reset.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder={t('reset.confirmPlaceholder')}
                  className="bf-input"
                />
              </div>

              {error && (
                <div
                  className="text-sm px-3 py-2 rounded-lg"
                  style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || hasSession === null}
                className="bf-btn-primary w-full py-2.5"
              >
                {loading ? t('reset.btn.updating') : t('reset.btn.update')}
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
