import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { borrower_id, amount, payment_date, method, notes, posted_by } = body
    if (!borrower_id || !amount || !payment_date || !posted_by)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    const { data: borrower } = await supabase.from('borrowers').select('*').eq('id', borrower_id).single()
    if (!borrower) return NextResponse.json({ error: 'Borrower not found' }, { status: 404 })
    await supabase.from('payment_log').insert({ borrower_id, amount: parseFloat(amount), payment_date, method: method || 'Bank Deposit', notes: notes || null, posted_by, notified_brad: false })
    await supabase.from('payment_history').insert({ borrower_id, payment_date, total_paid: parseFloat(amount), source: 'portal', posted_by, notes: notes || null })
    try {
      const date = new Date(payment_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'LWAW Portal <onboarding@resend.dev>',
          to: ['lwawinv@gmail.com'],
          subject: `Payment Posted — ${borrower.address} — $${parseFloat(amount).toFixed(2)}`,
          html: `<div style="font-family:Arial,sans-serif;max-width:600px"><div style="background:#1e4a7a;padding:20px;border-radius:8px 8px 0 0"><h2 style="color:#fff;margin:0">Payment Posted — LWAW Portal</h2></div><div style="background:#f7f9fc;padding:24px;border:1px solid #dce4ed;border-top:none;border-radius:0 0 8px 8px"><table style="width:100%"><tr><td style="color:#4a5568;font-size:13px;padding:8px 0;width:130px">Property</td><td style="font-weight:700">${borrower.address}</td></tr><tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Borrower</td><td>${borrower.borrower_name}</td></tr><tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Entity</td><td>${borrower.entity}</td></tr><tr style="background:#e8f2fb"><td style="color:#1e4a7a;font-weight:700;padding:10px 8px">Amount</td><td style="font-size:22px;font-weight:700;color:#15803d">$${parseFloat(amount).toFixed(2)}</td></tr><tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Date</td><td>${date}</td></tr><tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Method</td><td>${method}</td></tr><tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Posted By</td><td>${posted_by}</td></tr>${notes ? `<tr><td style="color:#4a5568;font-size:13px;padding:8px 0">Notes</td><td>${notes}</td></tr>` : ''}</table></div></div>`
        })
      })
    } catch (e) { console.error('Email failed:', e) }
    await supabase.from('payment_log').update({ notified_brad: true }).eq('borrower_id', borrower_id).eq('payment_date', payment_date)
    return NextResponse.json({ success: true, message: 'Payment posted and Brad notified.' })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
