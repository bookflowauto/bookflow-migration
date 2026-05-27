import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: request.headers.get('Authorization') || '',
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Refresh session if it exists
  if (user) {
    const { data } = await supabase.auth.refreshSession()
    if (data.session) {
      supabaseResponse = NextResponse.next({
        request,
      })
      supabaseResponse.cookies.set(
        `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0]?.split('//')[1]}-auth-token`,
        JSON.stringify(data.session),
        {
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
          sameSite: 'lax',
          httpOnly: false,
        }
      )
    }
  }

  return supabaseResponse
}
