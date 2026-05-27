import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import PlanSelector from './PlanSelector'
import ManageButton from './ManageButton'

type Tier = 'essentials' | 'professional' | 'premium'

const QUOTAS: Record<Tier, { sms: number; scribeMin: number }> = {
  essentials:   { sms: 100,  scribeMin: 30 },
  professional: { sms: 500,  scribeMin: 600 },
  premium:      { sms: 1500, scribeMin: 1800 },
}

const STATUS_BADGE: Record<string, string> = {
  unpaid: 'bf-badge-muted',
  active: 'bf-badge-success',
  past_due: 'bf-badge-warning',
  cancelled: 'bf-badge-danger',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; plan?: string; upgrade?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { t, bcp } = await getT()

  const { data: practitioner } = await supabase
    .from('practitioners')
    .select('id, name, plan_tier, billing_status, current_period_end, stripe_customer_id, billing_email')
    .single()

  const tier = (practitioner?.plan_tier ?? 'essentials') as Tier
  const status = practitioner?.billing_status ?? 'unpaid'
  const hasActive = status === 'active' || status === 'past_due'
  const isUnpaid = status === 'unpaid'
  const quota = QUOTAS[tier]

  // Current month usage
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const { data: usageRow } = await supabase
    .from('v_practitioner_usage_monthly')
    .select('sms_sent_count, scribe_minutes_used, period_start')
    .eq('practitioner_id', practitioner?.id)
    .eq('period_start', monthStart.toISOString().slice(0, 10))
    .maybeSingle()

  const smsUsed = usageRow?.sms_sent_count ?? 0
  const scribeUsed = Math.round(usageRow?.scribe_minutes_used ?? 0)

  const tierName = t(`plan.${tier}` as TranslationKey)
  const statusLabel = t(`billing.status.${status as 'unpaid' | 'active' | 'past_due' | 'cancelled'}`)
  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(bcp, { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {t('billing.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('billing.subtitle')}</p>
      </div>

      {/* Success / cancel banners */}
      {sp.checkout === 'success' && (
        <div
          className="mb-6 p-4 rounded-lg border flex items-start gap-3"
          style={{ background: 'var(--success-bg)', borderColor: 'var(--success)', color: 'var(--success)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <div>
            <p className="font-medium text-sm">{t('billing.banner.successTitle')}</p>
            <p className="text-xs opacity-80 mt-0.5">
              {t('billing.banner.successBody', { plan: sp.plan ? t(`plan.${sp.plan as Tier}` as TranslationKey) : '' })}
            </p>
          </div>
        </div>
      )}
      {sp.checkout === 'cancelled' && (
        <div
          className="mb-6 p-4 rounded-lg border text-sm"
          style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)', color: 'var(--warning)' }}
        >
          {t('billing.banner.cancelled')}
        </div>
      )}

      {/* Unpaid prompt — new accounts land here */}
      {isUnpaid && (
        <div
          className="mb-6 p-5 rounded-lg border"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border-strong)' }}
        >
          <p className="text-base font-medium" style={{ color: 'var(--text)' }}>
            {t('billing.unpaid.title')}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('billing.unpaid.body')}
          </p>
        </div>
      )}

      {/* Upgrade prompt — landed here from a tier-gated route */}
      {sp.upgrade && !isUnpaid && (
        <div
          className="mb-6 p-5 rounded-lg border"
          style={{ background: 'var(--warning-bg)', borderColor: 'var(--warning)' }}
        >
          <p className="text-base font-medium" style={{ color: 'var(--warning)' }}>
            {t('billing.upgrade.title')}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('billing.upgrade.body')}
          </p>
        </div>
      )}

      {/* Current plan card (only shown when they have an active plan) */}
      {!isUnpaid && (
        <div className="bf-card p-6 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                {t('billing.currentPlan')}
              </p>
              <div className="flex items-center gap-3 mt-1">
                <h2 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
                  {tierName}
                </h2>
                <span className={`bf-badge ${STATUS_BADGE[status] ?? 'bf-badge-muted'}`}>
                  {statusLabel}
                </span>
              </div>
              {hasActive && practitioner?.current_period_end && (
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                  {t('billing.renews', { date: fmtDate(practitioner.current_period_end) })}
                </p>
              )}
            </div>
            {practitioner?.stripe_customer_id && <ManageButton />}
          </div>
        </div>
      )}

      {/* Usage cards — only meaningful when they have a plan */}
      {!isUnpaid && (
      <div className="grid md:grid-cols-2 gap-4 mb-10">
        <UsageCard
          label={t('billing.usage.sms')}
          used={smsUsed}
          limit={quota.sms}
          unit={t('billing.usage.unit.messages')}
          thisMonth={t('billing.usage.thisMonth')}
          overText={t('billing.usage.overQuota')}
          atTextKey="atQuota"
          tForPct={(pct: number) => t('billing.usage.atQuota', { pct })}
        />
        <UsageCard
          label={t('billing.usage.scribe')}
          used={scribeUsed}
          limit={quota.scribeMin}
          unit={t('billing.usage.unit.minutes')}
          thisMonth={t('billing.usage.thisMonth')}
          overText={t('billing.usage.overQuota')}
          atTextKey="atQuota"
          tForPct={(pct: number) => t('billing.usage.atQuota', { pct })}
        />
      </div>
      )}

      {/* Plans */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight" style={{ color: 'var(--text)' }}>
          {hasActive ? t('billing.plans.switch') : t('billing.plans.choose')}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {hasActive ? t('billing.plans.switch.subtitle') : t('billing.plans.choose.subtitle')}
        </p>
      </div>

      <PlanSelector currentTier={hasActive ? tier : null} hasActive={hasActive} />
    </>
  )
}

function UsageCard({
  label,
  used,
  limit,
  unit,
  thisMonth,
  overText,
  tForPct,
}: {
  label: string
  used: number
  limit: number
  unit: string
  thisMonth: string
  overText: string
  atTextKey: string
  tForPct: (pct: number) => string
}) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isWarning = pct >= 80 && pct < 100
  const isOver = pct >= 100
  const barColor = isOver ? 'var(--danger)' : isWarning ? 'var(--warning)' : 'var(--accent)'

  return (
    <div className="bf-card p-5">
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          {label}
        </p>
        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{thisMonth}</p>
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>{used.toLocaleString()}</span>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>/ {limit.toLocaleString()} {unit}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, background: barColor }}
        />
      </div>
      {isOver && (
        <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{overText}</p>
      )}
      {isWarning && (
        <p className="text-xs mt-2" style={{ color: 'var(--warning)' }}>{tForPct(pct)}</p>
      )}
    </div>
  )
}
