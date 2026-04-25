import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
    }
    const { data, error } = await supabase.rpc('verify_borrower_login', {
      p_username: String(username).trim().toLowerCase(),
      p_password: String(password),
    })
    if (error) {
      console.error('verify_borrower_login error:', error)
      return NextResponse.json({ error: 'Authentication service unavailable.' }, { status: 500 })
    }
    if (!data?.success) {
      return NextResponse.json({ error: data?.error || 'Invalid username or password.' }, { status: 401 })
    }
    return NextResponse.json({ success: true, borrowers: data.borrowers || [] })
  } catch (e) {
    console.error('portal-auth exception:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
