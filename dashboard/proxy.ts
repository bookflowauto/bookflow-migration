import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  hasActivePlan,
  tierAtLeast,
  ROUTE_TIER_GATES,
  UNGATED_DASHBOARD_PATHS,
  type Tier,
  type BillingStatus,
} from '@/lib/plans'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Auth gates
  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Plan gates (only for authenticated dashboard requests)
  if (user && pathname.startsWith('/dashboard')) {
    const isUngated = (UNGATED_DASHBOARD_PATHS as readonly string[]).some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )

    if (!isUngated) {
      const { data: practitioner } = await supabase
        .from('practitioners')
        .select('plan_tier, billing_status')
        .single()

      const tier = (practitioner?.plan_tier ?? 'essentials') as Tier
      const status = (practitioner?.billing_status ?? 'unpaid') as BillingStatus

      // Gate 1: no active plan → force to /billing.
      if (!hasActivePlan(status)) {
        return NextResponse.redirect(new URL('/dashboard/billing', request.url))
      }

      // Gate 2: tier-locked route + insufficient tier → /billing?upgrade=…
      for (const gate of ROUTE_TIER_GATES) {
        if (pathname.startsWith(gate.prefix) && !tierAtLeast(tier, gate.minTier)) {
          return NextResponse.redirect(
            new URL(`/dashboard/billing?upgrade=${gate.feature}`, request.url),
          )
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
