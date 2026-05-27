import { createClient } from '@/lib/supabase/server'
import { getT } from '@/lib/i18n/server'
import SettingsTabs from './SettingsTabs'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { t, locale } = await getT()

  const { data: cfg } = await supabase
    .from('v_practitioner_mydata_config')
    .select('*')
    .single()

  const { data: profile } = await supabase
    .from('practitioners')
    .select(
      'name, email, phone, calendar_id, sms_reminder_enabled, reminder_offset_hours, email_digest_enabled',
    )
    .single()

  const { data: { user } } = await supabase.auth.getUser()

  if (!cfg || !profile) {
    return <div className="text-center py-8 text-[var(--bf-danger)]">{t('settings.loadFailed')}</div>
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{t('settings.title')}</h1>
        <p className="text-sm text-[var(--bf-muted)]">{t('settings.subtitle')}</p>
      </header>

      <SettingsTabs
        initial={cfg}
        initialLocale={locale}
        initialProfile={{
          name: profile.name ?? '',
          email: profile.email ?? user?.email ?? '',
          phone: profile.phone ?? '',
          calendar_id: profile.calendar_id ?? '',
        }}
        initialNotifications={{
          sms_reminder_enabled: profile.sms_reminder_enabled ?? true,
          reminder_offset_hours: profile.reminder_offset_hours ?? 24,
          email_digest_enabled: profile.email_digest_enabled ?? false,
        }}
      />
    </div>
  )
}
