'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'

export default function LoginPage() {
  const { t } = useT()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(friendlyError(error.message, t))
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo.png" alt="BookFlow" width={64} height={64} className="mb-4" priority />
          <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
            {t('auth.welcomeBack')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('auth.signInPrompt')}
          </p>
        </div>

        <div className="bf-card p-6">
          <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {t('auth.password')}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={t('auth.passwordPlaceholder')}
                className="bf-input"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bf-btn-primary w-full py-2.5"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-subtle)' }}>
          {t('auth.tagline')}
        </p>
      </div>
    </div>
  )
}

function friendlyError(msg: string, t: (key: TranslationKey) => string): string {
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return t('auth.err.invalidCreds')
  if (m.includes('email not confirmed'))
    return t('auth.err.notConfirmed')
  if (m.includes('rate limit') || m.includes('too many'))
    return t('auth.err.rateLimit')
  if (m.includes('network'))
    return t('auth.err.network')
  return msg
}
