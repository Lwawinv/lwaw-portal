import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// POST body shapes:
//   { action: 'list',       admin_username, admin_password }
//   { action: 'regenerate', admin_username, admin_password, target_username }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, admin_username, admin_password, target_username } = body
    if (!admin_username || !admin_password) {
      return NextResponse.json({ error: 'Admin credentials required.' }, { status: 401 })
    }

    if (action === 'list') {
      const { data, error } = await supabase.rpc('admin_list_credentials', {
        p_admin_username: String(admin_username).trim().toLowerCase(),
        p_admin_password: String(admin_password),
      })
      if (error) {
        console.error('admin_list_credentials error:', error)
        return NextResponse.json({ error: 'Service error' }, { status: 500 })
      }
      if (!data?.success) {
        return NextResponse.json({ error: data?.error || 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.json({ success: true, credentials: data.credentials || [] })
    }

    if (action === 'regenerate') {
      if (!target_username) {
        return NextResponse.json({ error: 'target_username is required.' }, { status: 400 })
      }
      const { data, error } = await supabase.rpc('admin_regenerate_password', {
        p_admin_username: String(admin_username).trim().toLowerCase(),
        p_admin_password: String(admin_password),
        p_target_username: String(target_username),
      })
      if (error) {
        console.error('admin_regenerate_password error:', error)
        return NextResponse.json({ error: 'Service error' }, { status: 500 })
      }
      if (!data?.success) {
        return NextResponse.json({ error: data?.error || 'Failed' }, { status: 400 })
      }
      return NextResponse.json({ success: true, username: data.username, password_plain: data.password_plain })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('admin-credentials exception:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
