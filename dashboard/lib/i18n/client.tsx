'use client'

import { createContext, useContext, useMemo } from 'react'
import {
  DEFAULT_LOCALE,
  type Locale,
  type TranslationKey,
  bcp47,
  translate,
} from './dictionary'

type Ctx = {
  locale: Locale
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
  bcp: string
}

const LocaleContext = createContext<Ctx>({
  locale: DEFAULT_LOCALE,
  t: key => translate(DEFAULT_LOCALE, key),
  bcp: bcp47(DEFAULT_LOCALE),
})

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: React.ReactNode
}) {
  const value = useMemo<Ctx>(
    () => ({
      locale,
      t: (key, vars) => translate(locale, key, vars),
      bcp: bcp47(locale),
    }),
    [locale],
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useT(): Ctx {
  return useContext(LocaleContext)
}
