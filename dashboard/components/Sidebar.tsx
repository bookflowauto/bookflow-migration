'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'

type NavItem = { href: string; labelKey: TranslationKey; icon: React.ReactNode }

const ICONS = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  patients: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  settings: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  billing: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </svg>
  ),
  menu: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  lock: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
}

const NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.patients', icon: ICONS.patients },
  { href: '/dashboard/calendar', labelKey: 'nav.calendar', icon: ICONS.calendar },
  { href: '/dashboard/billing', labelKey: 'nav.billing', icon: ICONS.billing },
  { href: '/dashboard/settings', labelKey: 'nav.settings', icon: ICONS.settings },
]

export default function Sidebar({
  practitionerName,
  locked = false,
}: {
  practitionerName?: string
  locked?: boolean
}) {
  const { t } = useT()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/dashboard/patients') || pathname.startsWith('/dashboard/appointments')
    return pathname.startsWith(href)
  }

  // When locked, every nav item except /dashboard/billing is non-clickable.
  // The proxy would silently bounce them back anyway — this just shows it.
  function isLockedItem(href: string) {
    return locked && href !== '/dashboard/billing'
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 flex items-center justify-center rounded-lg"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
        aria-label="Open menu"
      >
        {ICONS.menu}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Brand */}
        <div className="h-16 px-5 flex items-center justify-between border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="BookFlow" width={28} height={28} />
            <span className="font-semibold text-[15px] tracking-tight" style={{ color: 'var(--text)' }}>BookFlow</span>
          </Link>
          <button onClick={() => setOpen(false)} className="lg:hidden" style={{ color: 'var(--text-muted)' }} aria-label="Close menu">
            {ICONS.close}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
            {t('nav.workspace')}
          </div>

          {locked && (
            <div
              className="mx-1 mb-3 p-3 rounded-md text-xs"
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <div className="flex items-center gap-1.5 font-medium mb-1" style={{ color: 'var(--text)' }}>
                {ICONS.lock}
                <span>{t('sidebar.locked.title')}</span>
              </div>
              <p className="leading-snug">{t('sidebar.locked.body')}</p>
            </div>
          )}

          {NAV.map(item => {
            const itemLocked = isLockedItem(item.href)
            if (itemLocked) {
              return (
                <div
                  key={item.href}
                  className="bf-nav-link"
                  aria-disabled="true"
                  title={t('sidebar.locked.tooltip')}
                  style={{
                    cursor: 'not-allowed',
                    opacity: 0.45,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                  }}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="flex-1">{t(item.labelKey)}</span>
                  <span className="shrink-0" style={{ color: 'var(--text-subtle)' }}>{ICONS.lock}</span>
                </div>
              )
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`bf-nav-link ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer user */}
        <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {(practitionerName?.[0] ?? 'B').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                {practitionerName ?? t('nav.practitioner')}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-subtle)' }}>
                BookFlow Clinical
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
