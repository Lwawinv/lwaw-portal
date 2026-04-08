import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { borrower_id, amount, payment_date, method, notes, posted_by } = body
    if (!borrower_id || !amount || !payment_date || !posted_by) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const { data: borrower } = await supabase.from('borrowers').select('*').eq('id', borrower_id).single()
    if (!borrower) return NextResponse.json({ error: 'Borrower not found' }, { status: 404 })
    await supabase.from('payment_log').insert({ borrower_id, amount: parseFloat(amount), payment_date, method: method || 'Bank Deposit', notes: notes || null, posted_by, notified_brad: false })
    await supabase.from('payment_history').insert({ borrower_id, payment_date, total_paid: parseFloat(amount), source: 'portal', posted_by, notes: notes || null })
    console.log('PAYMENT POSTED:', borrower.address, amount, payment_date, posted_by)
    return NextResponse.json({ success: true, message: 'Payment posted successfully.' })
  } catch (err) { return NextResponse.json({ error: 'Server error' }, { status: 500 }) }
}