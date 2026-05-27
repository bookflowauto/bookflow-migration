'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'

type Tier = 'essentials' | 'professional' | 'premium'
type Period = 'monthly' | 'annual'

const PLANS: Array<{
  tier: Tier
  nameKey: TranslationKey
  taglineKey: TranslationKey
  monthly: number
  annualEffective: number
  featureKeys: TranslationKey[]
  highlight?: boolean
}> = [
  {
    tier: 'essentials',
    nameKey: 'plan.essentials',
    taglineKey: 'plan.essentials.tag',
    monthly: 59,
    annualEffective: 49,
    featureKeys: [
      'plan.feat.sms.100',
      'plan.feat.scribe.30min',
      'plan.feat.gcal',
      'plan.feat.intake.1',
      'plan.feat.pdf.single',
      'plan.feat.support.email',
    ],
  },
  {
    tier: 'professional',
    nameKey: 'plan.professional',
    taglineKey: 'plan.professional.tag',
    monthly: 119,
    annualEffective: 99,
    featureKeys: [
      'plan.feat.sms.500',
      'plan.feat.scribe.10h',
      'plan.feat.soap.merge',
      'plan.feat.soap.structured',
      'plan.feat.intake.unlimited',
      'plan.feat.timeline',
      'plan.feat.support.chat',
    ],
    highlight: true,
  },
  {
    tier: 'premium',
    nameKey: 'plan.premium',
    taglineKey: 'plan.premium.tag',
    monthly: 229,
    annualEffective: 191,
    featureKeys: [
      'plan.feat.sms.1500',
      'plan.feat.scribe.30h',
      'plan.feat.multiCalendar',
      'plan.feat.seats',
      'plan.feat.secretary',
      'plan.feat.backup',
      'plan.feat.analytics',
      'plan.feat.support.priority',
    ],
  },
]

export default function PlanSelector({
  currentTier,
  hasActive,
}: {
  currentTier?: Tier | null
  hasActive: boolean
}) {
  const { t } = useT()
  const [period, setPeriod] = useState<Period>('annual')
  const [loading, setLoading] = useState<Tier | null>(null)
  const [error, setError] = useState('')

  async function handleSelect(tier: Tier) {
    setLoading(tier)
    setError('')

    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setError(t('plans.errAuth'))
      setLoading(null)
      return
    }

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ plan_tier: tier, billing_period: period }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        throw new Error(data.error || t('plans.errCheckout'))
      }
      window.location.href = data.url
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('plans.errCheckout'))
      setLoading(null)
    }
  }

  return (
    <div>
      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <button
          onClick={() => setPeriod('monthly')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'monthly' ? '' : 'opacity-60'}`}
          style={{
            background: period === 'monthly' ? 'var(--accent)' : 'var(--surface-2)',
            color: period === 'monthly' ? 'var(--accent-fg)' : 'var(--text-muted)',
          }}
        >
          {t('plans.period.monthly')}
        </button>
        <button
          onClick={() => setPeriod('annual')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${period === 'annual' ? '' : 'opacity-60'}`}
          style={{
            background: period === 'annual' ? 'var(--accent)' : 'var(--surface-2)',
            color: period === 'annual' ? 'var(--accent-fg)' : 'var(--text-muted)',
          }}
        >
          {t('plans.period.annual')}
          <span className="bf-badge" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}>
            {t('plans.period.save')}
          </span>
        </button>
      </div>

      {error && (
        <div
          className="text-sm px-3 py-2 rounded-lg mb-4 text-center"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map(plan => {
          const isCurrent = currentTier === plan.tier && hasActive
          const price = period === 'annual' ? plan.annualEffective : plan.monthly
          return (
            <div
              key={plan.tier}
              className="bf-card p-6 flex flex-col relative"
              style={{
                borderColor: plan.highlight ? 'var(--accent)' : 'var(--border)',
                borderWidth: plan.highlight ? '2px' : '1px',
              }}
            >
              {/* Only one badge at top-center. "Current plan" wins over "Most popular". */}
              {isCurrent ? (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bf-badge whitespace-nowrap"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--accent)',
                    border: '1.5px solid var(--accent)',
                    fontWeight: 600,
                  }}
                >
                  ✓ {t('plans.currentPlan')}
                </span>
              ) : plan.highlight ? (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 bf-badge whitespace-nowrap"
                  style={{ background: 'var(--accent)', color: 'var(--accent-fg)' }}
                >
                  {t('plans.mostPopular')}
                </span>
              ) : null}

              <div className="mb-4">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{t(plan.nameKey)}</h3>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t(plan.taglineKey)}</p>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                  €{price}
                </span>
                <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>{t('plans.priceSuffix')}</span>
                {period === 'annual' && (
                  <p className="text-xs mt-1" style={{ color: 'var(--text-subtle)' }}>
                    {t('plans.billedAnnually', { annual: plan.annualEffective * 12 })}
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.featureKeys.map(fk => (
                  <li key={fk} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>{t(fk)}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(plan.tier)}
                disabled={isCurrent || loading !== null}
                className={plan.highlight ? 'bf-btn-primary w-full py-2.5' : 'bf-btn-secondary w-full py-2.5'}
              >
                {isCurrent
                  ? t('plans.btn.current')
                  : loading === plan.tier
                    ? t('plans.btn.loading')
                    : hasActive
                      ? t('plans.btn.switch')
                      : t('plans.btn.choose')}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
