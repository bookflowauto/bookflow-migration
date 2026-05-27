import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import ThemeToggle from '@/components/ThemeToggle'
import LogoutButton from '@/components/LogoutButton'
import { hasActivePlan, type BillingStatus } from '@/lib/plans'

// Plan-gating (billing_status + tier) lives in proxy.ts, not here.
// Layout-level redirects collide with Next's RSC prefetches and cause
// browser request floods. The proxy handles billing/tier checks cleanly
// before any rendering happens. We still read billing_status here so the
// Sidebar can render nav items in a "locked" visual state.

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: practitioner } = await supabase
    .from('practitioners')
    .select('name, billing_status')
    .single()

  const status = (practitioner?.billing_status ?? 'unpaid') as BillingStatus
  const locked = !hasActivePlan(status)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Sidebar practitionerName={practitioner?.name} locked={locked} />

      <div className="lg:pl-64 min-h-screen flex flex-col">
        <header
          className="h-16 flex items-center justify-between px-4 lg:px-8 border-b sticky top-0 z-30 backdrop-blur"
          style={{
            background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="lg:hidden w-10" />
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
