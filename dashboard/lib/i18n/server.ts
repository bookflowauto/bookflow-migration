import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import {
  DEFAULT_LOCALE,
  type Locale,
  type TranslationKey,
  bcp47,
  isLocale,
  translate,
} from './dictionary'

const COOKIE_NAME = 'bf_locale'

// Read the practitioner's locale. Cookie is the fast path (set on save / on
// first dashboard render). Falls back to DB, then to DEFAULT_LOCALE.
export async function getLocale(): Promise<Locale> {
  const jar = await cookies()
  const fromCookie = jar.get(COOKIE_NAME)?.value
  if (isLocale(fromCookie)) return fromCookie

  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('practitioners')
      .select('locale')
      .single()
    if (isLocale(data?.locale)) return data.locale
  } catch {
    // No session yet (login page, etc.) — fall through to default.
  }
  return DEFAULT_LOCALE
}

export async function getT(): Promise<{
  locale: Locale
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  bcp: string
}> {
  const locale = await getLocale()
  return {
    locale,
    t: (key, vars) => translate(locale, key, vars),
    bcp: bcp47(locale),
  }
}

export const LOCALE_COOKIE = COOKIE_NAME
