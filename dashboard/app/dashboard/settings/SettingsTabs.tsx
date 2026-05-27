'use client'
import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import type { Locale } from '@/lib/i18n/dictionary'
import GeneralTab from './GeneralTab'
import ProfileTab, { type ProfileState } from './ProfileTab'
import SecurityTab from './SecurityTab'
import NotificationsTab, { type NotificationsState } from './NotificationsTab'
import MyDataTab from './MyDataTab'

interface Config {
  rate_per_session_eur: number
  mydata_username: string
  mydata_environment: 'sandbox' | 'production'
  vat_number: string
  kad_code: string
  business_address: string
  vat_regime: 'exempt' | 'standard' | 'mixed'
  has_taxable_secondary_activity: boolean
  mydata_credentials_verified: boolean
  mydata_credentials_verified_at: string | null
  has_subscription_key: boolean
  [key: string]: any
}

type TabKey = 'general' | 'profile' | 'security' | 'notifications' | 'mydata'

export default function SettingsTabs({
  initial,
  initialLocale,
  initialProfile,
  initialNotifications,
}: {
  initial: Config
  initialLocale: Locale
  initialProfile: ProfileState
  initialNotifications: NotificationsState
}) {
  const { t } = useT()
  const [tab, setTab] = useState<TabKey>('general')
  const [cfg, setCfg] = useState(initial)

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'general', label: t('settings.tab.general') },
    { key: 'profile', label: t('settings.tab.profile') },
    { key: 'security', label: t('settings.tab.security') },
    { key: 'notifications', label: t('settings.tab.notifications') },
    { key: 'mydata', label: t('settings.tab.mydata') },
  ]

  return (
    <div className="bf-card">
      {/* Tab buttons — pill style, same hover/active treatment as sidebar nav */}
      <div
        className="flex gap-1 p-2 overflow-x-auto border-b"
        style={{ borderColor: 'var(--border)' }}
        role="tablist"
      >
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`bf-nav-link whitespace-nowrap ${tab === key ? 'active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6">
        {tab === 'general' && (
          <GeneralTab
            initial={cfg}
            initialLocale={initialLocale}
            onSave={c => setCfg({ ...cfg, ...c })}
          />
        )}
        {tab === 'profile' && <ProfileTab initial={initialProfile} />}
        {tab === 'security' && <SecurityTab />}
        {tab === 'notifications' && <NotificationsTab initial={initialNotifications} />}
        {tab === 'mydata' && <MyDataTab initial={cfg} onSave={(c) => setCfg({ ...cfg, ...c })} />}
      </div>
    </div>
  )
}
