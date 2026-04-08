import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
function hashPw(pw: string): string {
  let h = 5381
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) + h) + pw.charCodeAt(i); h = h >>> 0 }
  return h.toString(36)
}
export async function POST(req: NextRequest) {
  try {
    const { lastName, zip, password, action } = await req.json()
    if (!lastName || !zip) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    const { data: borrowers, error } = await supabase.from('borrowers').select('*').eq('active', true).ilike('last_name', lastName.trim()).eq('zip', zip.trim())
    if (error || !borrowers?.length) return NextResponse.json({ error: 'No loan found for that last name and ZIP code.' }, { status: 404 })
    if (action === 'register') {
      if (!password || password.length < 6) return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
      const { data: existing } = await supabase.from('portal_users').select('id').ilike('last_name', lastName.trim()).eq('zip', zip.trim()).single()
      if (existing) return NextResponse.json({ error: 'An account already exists. Please sign in.' }, { status: 409 })
      const { error: insertErr } = await supabase.from('portal_users').insert({ borrower_id: borrowers[0].id, last_name: lastName.trim().toLowerCase(), zip: zip.trim(), password_hash: hashPw(password), role: 'borrower' })
      if (insertErr) return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 })
      return NextResponse.json({ success: true, borrowers })
    }
    if (!password) return NextResponse.json({ error: 'Password required.' }, { status: 400 })
    const { data: user } = await supabase.from('portal_users').select('*').ilike('last_name', lastName.trim()).eq('zip', zip.trim()).single()
    if (!user) return NextResponse.json({ error: 'No account found. Please create your account first.' }, { status: 404 })
    if (hashPw(password) !== user.password_hash) return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    await supabase.from('portal_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)
    return NextResponse.json({ success: true, borrowers })
  } catch { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}