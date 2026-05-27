// Single source-of-truth for plan tiers: quotas + feature flags.
//
// Used by:
//   - Middleware/dashboard layout (gate routes by billing_status + tier)
//   - <FeatureGate> server component (gate in-page sections)
//   - n8n workflows reference the same quota numbers (kept in sync manually)
//   - Stripe checkout (price metadata)
//
// If you change a quota here, also update n8n Workflow #1 (SMS) and Workflow
// #2 (Scribe) quota nodes — they hard-code the same numbers.

export type Tier = 'essentials' | 'professional' | 'premium'
export type BillingStatus = 'unpaid' | 'active' | 'past_due' | 'cancelled' | 'trial'

export const TIERS: readonly Tier[] = ['essentials', 'professional', 'premium'] as const

// Monthly quotas. Source of truth — also encoded in n8n workflows.
export const QUOTAS = {
  essentials:   { sms: 100,  scribeMin: 30,   regenerateSoap: 25 },
  professional: { sms: 500,  scribeMin: 600,  regenerateSoap: 60 },
  premium:      { sms: 1500, scribeMin: 1800, regenerateSoap: Infinity },
} as const satisfies Record<Tier, { sms: number; scribeMin: number; regenerateSoap: number }>

// Feature flags: which tier unlocks which capability.
// Order is essentials → professional → premium; "true" means included.
export const FEATURES = {
  // Core (always on for any paid tier)
  gcalSync:           { essentials: true,  professional: true,  premium: true  },
  smsReminders:       { essentials: true,  professional: true,  premium: true  },
  scribeBasic:        { essentials: true,  professional: true,  premium: true  },
  singleNotePdf:      { essentials: true,  professional: true,  premium: true  },
  myDataReceipts:     { essentials: true,  professional: true,  premium: true  },

  // Professional tier
  longitudinalMerge:  { essentials: false, professional: true,  premium: true  },
  structuredSoap:     { essentials: false, professional: true,  premium: true  },
  patientTimeline:    { essentials: false, professional: true,  premium: true  },
  fullTextSearch:     { essentials: false, professional: true,  premium: true  },
  timelinePdf:        { essentials: false, professional: true,  premium: true  },
  multipleIntakes:    { essentials: false, professional: true,  premium: true  },

  // Premium tier
  multiSeat:          { essentials: false, professional: false, premium: true  },
  secretarySeat:      { essentials: false, professional: false, premium: true  },
  multiCalendar:      { essentials: false, professional: false, premium: true  },
  complianceBackup:   { essentials: false, professional: false, premium: true  },
  practiceAnalytics:  { essentials: false, professional: false, premium: true  },
} as const satisfies Record<string, Record<Tier, boolean>>

export type Feature = keyof typeof FEATURES

export function hasFeature(tier: Tier | null | undefined, feature: Feature): boolean {
  if (!tier) return false
  return FEATURES[feature][tier]
}

export function getQuota(tier: Tier, key: keyof typeof QUOTAS['essentials']): number {
  return QUOTAS[tier][key]
}

// Has the practitioner paid? Used by the dashboard layout to redirect to
// /billing. 'past_due' counts as paid (grace period); Stripe will flip them
// to 'cancelled' if payment keeps failing.
export function hasActivePlan(status: BillingStatus | null | undefined): boolean {
  return status === 'active' || status === 'past_due'
}

// Which routes are reachable without an active plan. Everything else under
// /dashboard/* redirects to /dashboard/billing.
export const UNGATED_DASHBOARD_PATHS = ['/dashboard/billing'] as const

// Which routes require a specific tier or higher. Used by the dashboard
// layout to redirect Essentials users away from Premium-only routes.
//   - key is a path prefix
//   - value is the minimum tier required
export const ROUTE_TIER_GATES: { prefix: string; minTier: Tier; feature: Feature }[] = [
  // /dashboard/analytics is Premium-only (not yet built, listed for when it lands)
  { prefix: '/dashboard/analytics', minTier: 'premium', feature: 'practiceAnalytics' },
]

const TIER_RANK: Record<Tier, number> = { essentials: 0, professional: 1, premium: 2 }

export function tierAtLeast(actual: Tier, required: Tier): boolean {
  return TIER_RANK[actual] >= TIER_RANK[required]
}
