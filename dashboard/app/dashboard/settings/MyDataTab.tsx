'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useT } from '@/lib/i18n/client'

type Environment = 'sandbox' | 'production'
type VatRegime = 'exempt' | 'standard' | 'mixed'

interface Config {
  mydata_username: string
  mydata_environment: Environment
  vat_number: string
  kad_code: string
  business_address: string
  vat_regime: VatRegime
  has_taxable_secondary_activity: boolean
  mydata_credentials_verified: boolean
  mydata_credentials_verified_at: string | null
  has_subscription_key: boolean
  [key: string]: any
}

export default function MyDataTab({
  initial,
  onSave,
}: {
  initial: Config
  onSave: (cfg: Partial<Config>) => void
}) {
  const { t, bcp } = useT()

  const [username, setUsername] = useState(initial.mydata_username)
  const [subscriptionKey, setSubscriptionKey] = useState('')
  const [environment, setEnvironment] = useState<Environment>(initial.mydata_environment)
  const [vatNumber, setVatNumber] = useState(initial.vat_number)
  const [kadCode, setKadCode] = useState(initial.kad_code)
  const [address, setAddress] = useState(initial.business_address)
  const [vatRegime, setVatRegime] = useState<VatRegime>(initial.vat_regime)
  const [secondaryTaxable, setSecondaryTaxable] = useState(initial.has_taxable_secondary_activity)
  const [consent, setConsent] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verified, setVerified] = useState(initial.mydata_credentials_verified)
  const [verifiedAt, setVerifiedAt] = useState(initial.mydata_credentials_verified_at)

  const keyAlreadyStored = initial.has_subscription_key

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!consent) {
      setError(t('mydata.errConsent'))
      return
    }
    if (!subscriptionKey.trim() && !keyAlreadyStored) {
      setError(t('mydata.errKey'))
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError(t('settings.rate.errSession'))
        return
      }

      const res = await fetch('/api/mydata/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          mydata_username: username,
          mydata_subscription_key: subscriptionKey,
          mydata_environment: environment,
          vat_number: vatNumber,
          kad_code: kadCode,
          business_address: address,
          vat_regime: vatRegime,
          has_taxable_secondary_activity: secondaryTaxable,
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(body?.error ?? `Failed (${res.status})`)
        return
      }

      setVerified(true)
      setVerifiedAt(body.verified_at ?? new Date().toISOString())
      setSubscriptionKey('')
      onSave({
        ...initial,
        mydata_username: username,
        mydata_environment: environment,
        vat_number: vatNumber,
        kad_code: kadCode,
        business_address: address,
        vat_regime: vatRegime,
        has_taxable_secondary_activity: secondaryTaxable,
        mydata_credentials_verified: true,
        mydata_credentials_verified_at: body.verified_at ?? new Date().toISOString(),
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {verified && (
        <div className="bf-badge bf-badge-success">
          {t('mydata.verified')}{verifiedAt ? ` · ${new Date(verifiedAt).toLocaleString(bcp)}` : ''}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-sm font-medium">{t('mydata.field.username')}</span>
          <input
            className="bf-input mt-1"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">
            {t('mydata.field.subscriptionKey')}{' '}
            {keyAlreadyStored && (
              <span className="text-[var(--bf-muted)]">{t('mydata.field.subscriptionKey.keepExisting')}</span>
            )}
          </span>
          <input
            type="password"
            className="bf-input mt-1"
            value={subscriptionKey}
            onChange={(e) => setSubscriptionKey(e.target.value)}
            autoComplete="off"
            placeholder={keyAlreadyStored ? '••••••••' : ''}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('mydata.field.environment')}</span>
          <select
            className="bf-input mt-1"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as Environment)}
          >
            <option value="sandbox">{t('mydata.env.sandbox')}</option>
            <option value="production">{t('mydata.env.production')}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('mydata.field.vat')}</span>
          <input
            className="bf-input mt-1"
            value={vatNumber}
            onChange={(e) => setVatNumber(e.target.value.replace(/\D/g, '').slice(0, 9))}
            inputMode="numeric"
            pattern="\d{9}"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('mydata.field.kad')}</span>
          <select
            className="bf-input mt-1"
            value={kadCode}
            onChange={(e) => setKadCode(e.target.value)}
            required
          >
            <option value="">{t('mydata.kad.placeholder')}</option>
            <option value="869014">{t('mydata.kad.869014')}</option>
            <option value="869039">{t('mydata.kad.869039')}</option>
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium">{t('mydata.field.regime')}</span>
          <select
            className="bf-input mt-1"
            value={vatRegime}
            onChange={(e) => setVatRegime(e.target.value as VatRegime)}
          >
            <option value="exempt">{t('mydata.regime.exempt')}</option>
            <option value="standard">{t('mydata.regime.standard')}</option>
            <option value="mixed">{t('mydata.regime.mixed')}</option>
          </select>
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium">{t('mydata.field.address')}</span>
        <textarea
          className="bf-input mt-1"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          required
        />
      </label>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={secondaryTaxable}
          onChange={(e) => setSecondaryTaxable(e.target.checked)}
          className="mt-1"
        />
        <span>{t('mydata.secondaryTaxable')}</span>
      </label>

      <label className="flex items-start gap-2 text-sm border-t border-[var(--bf-border)] pt-4">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1"
          required
        />
        <span>{t('mydata.consent')}</span>
      </label>

      {error && (
        <div className="text-sm text-[var(--bf-danger)] border border-[var(--bf-danger)] rounded p-2">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button type="submit" className="bf-btn-primary" disabled={submitting}>
          {submitting
            ? t('mydata.btn.verifying')
            : verified
              ? t('mydata.btn.update')
              : t('mydata.btn.verify')}
        </button>
      </div>
    </form>
  )
}
