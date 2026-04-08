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
    const { username, password } = await req.json()
    if (!username || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    const { data: admin, error } = await supabase.from('admin_users').select('*').eq('username', username.toLowerCase().trim()).eq('active', true).single()
    if (error || !admin) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    if (hashPw(password) !== admin.password_hash) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
    await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', admin.id)
    return NextResponse.json({ success: true, admin: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role } })
  } catch { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}