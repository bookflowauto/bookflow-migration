import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import { hasFeature, type Feature, type Tier } from '@/lib/plans'
import Link from 'next/link'

// Server-side feature gate. Renders children when the practitioner's tier
// includes the feature, otherwise renders an upgrade CTA (or nothing if
// `fallback="hide"`).
//
// Usage:
//   <FeatureGate feature="longitudinalMerge">
//     <MergedSoap />
//   </FeatureGate>
//
//   <FeatureGate feature="practiceAnalytics" fallback="hide" />
export default async function FeatureGate({
  feature,
  fallback = 'upgrade',
  children,
}: {
  feature: Feature
  fallback?: 'upgrade' | 'hide'
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: practitioner } = await supabase
    .from('practitioners')
    .select('plan_tier')
    .single()

  const tier = (practitioner?.plan_tier ?? 'essentials') as Tier

  if (hasFeature(tier, feature)) {
    return <>{children}</>
  }

  if (fallback === 'hide') return null

  const { t } = await getT()

  return (
    <div
      className="bf-card p-6 text-center"
      style={{ borderStyle: 'dashed', borderColor: 'var(--border-strong)' }}
    >
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>
        {t('featureGate.title')}
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
        {t('featureGate.body')}
      </p>
      <Link
        href={`/dashboard/billing?upgrade=${feature}`}
        className="bf-btn-primary inline-flex items-center text-sm"
      >
        {t('featureGate.cta')}
      </Link>
    </div>
  )
}
