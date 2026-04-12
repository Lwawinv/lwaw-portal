'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

// ── TYPES ──────────────────────────────────────────────────────────
type Borrower = {
  id: string; last_name: string; zip: string; address: string;
  borrower_name: string; entity: string; entity_address: string;
  bank: string; bank_address: string; account_number: string;
  payment_amount: string; due_day: string; escrow: string;
  tax_county: string; bank_lien: string | null; payment_method: string;
}
type LoanDetail = {
  borrower_id: string; loan_amount: number; rate: number; term_years: number;
  start_date: string; scheduled_payment: number; lender: string;
  current_balance: number; total_interest_paid: number; payments_made: number;
}
type Payment = {
  id: string; payment_num: number; payment_date: string; total_paid: number;
  principal: number; interest: number; ending_balance: number; source: string;
  posted_by: string | null;
}
type AdminUser = { id: string; username: string; full_name: string; role: string }

// ── HELPERS ────────────────────────────────────────────────────────
const fmt = (n: number | null) => n ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtDate = (d: string) => { if (!d) return '—'; const p = d.split('-'); return p[1] + '/' + p[2] + '/' + p[0] }

// ── STYLES ─────────────────────────────────────────────────────────
const s = {
  card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '22px 26px' } as React.CSSProperties,
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 8 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#1c2026', background: '#fff', outline: 'none' },
  btnBlue: { background: '#2e6da4', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 5, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif', width: '100%'" } as React.CSSProperties,
  btnGreen: { background: '#15803d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  errMsg: { background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  okMsg: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
}



// ── AMORTIZATION TABLE COMPONENT ───────────────────────────────────────────
function AmortizationTable({ borrowerId, scheduledPayment }: { borrowerId: string, scheduledPayment: number }) {
  const [schedule, setSchedule] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)

  React.useEffect(() => {
    if (!borrowerId) return
    setLoading(true)
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('amortization_schedule')
        .select('*')
        .eq('borrower_id', borrowerId)
        .order('payment_num')
        .then(({ data }) => {
          if (data) setSchedule(data)
          setLoading(false)
        })
    })
  }, [borrowerId])

  if (loading) return <div style={{ fontSize: 13, color: '#4a5568', padding: '20px 0' }}>Loading schedule...</div>
  if (schedule.length === 0) return (
    <div style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic', padding: '16px 0' }}>
      Schedule not yet loaded. Check back soon or contact lwawinv@gmail.com.
    </div>
  )

  const fmt2 = (n: number | null) => n != null ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
  const displayed = showAll ? schedule : schedule.slice(0, 36)

  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight: 420, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#f0f4f8' }}>
              {['#', 'Date', 'Payment', 'Principal', 'Interest', 'Balance', 'Status'].map(h => (
                <th key={h} style={{ padding: '8px 10px', fontSize: 10, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === '#' ? 'center' : 'right', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((row: any) => {
              const isConf = row.is_confirmed && row.source === 'confirmed'
              const isSumm = row.is_confirmed && row.source === 'summary'
              const bg = isConf ? '#f0fdf4' : isSumm ? '#ecfdf5' : 'transparent'
              const textColor = isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af'
              const statusLabel = isConf ? '✓ Confirmed' : isSumm ? '✓ Summary' : 'Projected'
              return (
                <tr key={row.payment_num} style={{ borderBottom: '1px solid #f0f4f8', background: bg }}>
                  <td style={{ padding: '6px 10px', textAlign: 'center', color: '#2e6da4', fontWeight: 600 }}>{row.payment_num}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: textColor }}>{row.payment_date ? row.payment_date.substring(0,10) : '—'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: row.is_confirmed ? 600 : 400, color: textColor }}>{fmt2(row.total_payment)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: textColor }}>{fmt2(row.principal)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: textColor }}>{fmt2(row.interest)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: row.is_confirmed ? 700 : 400, color: isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af' }}>{fmt2(row.ending_balance)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: textColor }}>{statusLabel}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {schedule.length > 36 && (
        <button onClick={() => setShowAll(!showAll)} style={{ marginTop: 10, background: 'none', border: '1px solid #dce4ed', borderRadius: 5, padding: '7px 16px', fontSize: 13, cursor: 'pointer', color: '#2e6da4', fontFamily: "'DM Sans', sans-serif" }}>
          {showAll ? 'Show Less' : `Show All ${schedule.length} Payments`}
        </button>
      )}
    </div>
  )
}

// ── PAYOFF CALCULATOR COMPONENT ────────────────────────────────────────────
function PayoffCalculator({ borrower, loanDetail }: { borrower: any, loanDetail: any }) {
  const [payoffDate, setPayoffDate] = React.useState(new Date().toISOString().split('T')[0])
  const [result, setResult] = React.useState<null | { payoff: number; perDiem: number; interestToDate: number; daysRemaining: number }>(null)

  function calculate() {
    if (!loanDetail) return
    const balance = loanDetail.current_balance || loanDetail.loan_amount
    const rate = loanDetail.rate
    const daily = (balance * rate) / 365
    const today = new Date()
    const target = new Date(payoffDate)
    const days = Math.max(0, Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    const interestToDate = daily * days
    const payoff = balance + interestToDate
    setResult({ payoff: Math.round(payoff * 100) / 100, perDiem: Math.round(daily * 100) / 100, interestToDate: Math.round(interestToDate * 100) / 100, daysRemaining: days })
  }

  const fmtMoney = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '22px 26px', marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 16 }}>Payoff Quote Calculator</div>
        <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 20 }}>
          Estimate the total payoff amount needed to satisfy your loan in full as of a specific date.
          Contact LWAW Investments for an official payoff letter.
        </p>
        {!loanDetail ? (
          <p style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic' }}>Loan detail data not available. Please contact lwawinv@gmail.com for a payoff quote.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#f7f9fc', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Current Balance</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1c2026', fontFamily: "'Playfair Display', serif" }}>
                  {fmtMoney(loanDetail.current_balance || loanDetail.loan_amount)}
                </div>
              </div>
              <div style={{ background: '#f7f9fc', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Interest Rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1c2026', fontFamily: "'Playfair Display', serif" }}>
                  {(loanDetail.rate * 100).toFixed(2)}%
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 8, display: 'block' }}>
                Select Payoff Date
              </label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="date" value={payoffDate} onChange={e => setPayoffDate(e.target.value)}
                  style={{ padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                <button onClick={calculate}
                  style={{ background: '#2e6da4', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Calculate
                </button>
              </div>
            </div>
            {result && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d', marginBottom: 16 }}>
                  Estimated Payoff — {new Date(payoffDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Payoff Amount', val: fmtMoney(result.payoff), highlight: true },
                    { label: 'Per Diem Interest', val: fmtMoney(result.perDiem) + '/day', highlight: false },
                    { label: 'Interest to Payoff Date', val: fmtMoney(result.interestToDate), highlight: false },
                    { label: 'Days Until Payoff', val: result.daysRemaining + ' days', highlight: false },
                  ].map((item, i) => (
                    <div key={i} style={{ background: item.highlight ? '#dcfce7' : '#fff', borderRadius: 6, padding: '12px 16px', border: '1px solid ' + (item.highlight ? '#86efac' : '#dce4ed') }}>
                      <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: item.highlight ? 22 : 16, fontWeight: 700, color: item.highlight ? '#15803d' : '#1c2026', fontFamily: item.highlight ? "'Playfair Display', serif" : 'inherit' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#4a5568', margin: 0, fontStyle: 'italic' }}>
                  * This is an estimate only. Contact LWAW Investments at lwawinv@gmail.com or 806-680-3556 for an official payoff letter with exact figures including any fees.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PortalPage() {
  const [screen, setScreen] = useState<'login' | 'register' | 'select' | 'dash' | 'admin'>('login')
  const [loginType, setLoginType] = useState<'borrower' | 'admin'>('borrower')
  const [activeTab, setActiveTab] = useState('payments')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  // Auth state
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)

  // Borrower data
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])

  // Admin data
  const [allBorrowers, setAllBorrowers] = useState<Borrower[]>([])
  const [paymentLog, setPaymentLog] = useState<any[]>([])
  const [adminMonth, setAdminMonth] = useState(new Date().getMonth())
  const [adminYear, setAdminYear] = useState(new Date().getFullYear())

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalBorrower, setModalBorrower] = useState<Borrower | null>(null)
  const [modalAmount, setModalAmount] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalMethod, setModalMethod] = useState('Bank Deposit')
  const [modalNotes, setModalNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalMsg, setModalMsg] = useState('')

  // Form fields
  const [lastName, setLastName] = useState('')
  const [zip, setZip] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [adminUser2, setAdminUser2] = useState('')
  const [adminPass, setAdminPass] = useState('')

  // Load borrower dashboard data
  useEffect(() => {
    if (selectedBorrower) {
      loadBorrowerData(selectedBorrower.id)
    }
  }, [selectedBorrower])

  // Load admin data
  useEffect(() => {
    if (adminUser) loadAdminData()
  }, [adminUser, adminMonth, adminYear])

  async function loadBorrowerData(bid: string) {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: ld }, { data: pmts }] = await Promise.all([
      supabase.from('loan_details').select('*').eq('borrower_id', bid).single(),
      supabase.from('payment_history').select('*').eq('borrower_id', bid).order('payment_date', { ascending: false }).limit(36)
    ])
    if (ld) setLoanDetail(ld)
    if (pmts) setPayments(pmts)
  }

  async function loadAdminData() {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: bs }, { data: logs }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('active', true).order('address'),
      supabase.from('payment_log').select('*').order('created_at', { ascending: false })
    ])
    if (bs) setAllBorrowers(bs)
    if (logs) setPaymentLog(logs)
  }

  // ── AUTH HANDLERS ────────────────────────────────────────────────
  async function handleBorrowerLogin(action: 'login' | 'register') {
    setErr(''); setOk(''); setLoading(true)
    try {
      const res = await fetch('/api/borrower-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastName, zip, password, action })
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Login failed'); return }
      setBorrowers(data.borrowers)
      if (data.borrowers.length === 1) {
        setSelectedBorrower(data.borrowers[0])
        setScreen('dash')
      } else {
        setScreen('select')
      }
    } catch { setErr('Connection error. Please try again.') }
    finally { setLoading(false) }
  }

  async function handleAdminLogin() {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUser2, password: adminPass })
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Login failed'); return }
      setAdminUser(data.admin)
      setScreen('admin')
    } catch { setErr('Connection error. Please try again.') }
    finally { setLoading(false) }
  }

  // ── POST PAYMENT ─────────────────────────────────────────────────
  async function submitPayment() {
    if (!modalBorrower) return
    setModalLoading(true); setModalMsg('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrower_id: modalBorrower.id,
          amount: parseFloat(modalAmount),
          payment_date: modalDate,
          method: modalMethod,
          notes: modalNotes,
          posted_by: adminUser?.full_name || 'Arick Wray'
        })
      })
      const data = await res.json()
      if (!res.ok) { setModalMsg('Error: ' + (data.error || 'Failed')); return }
      setModalMsg('✓ Payment posted! Brad has been notified.')
      setTimeout(() => { setModalOpen(false); loadAdminData() }, 2000)
    } catch { setModalMsg('Connection error.') }
    finally { setModalLoading(false) }
  }

  function openPaymentModal(b: Borrower) {
    setModalBorrower(b)
    setModalAmount(b.payment_amount.replace(/[$,]/g, ''))
    setModalDate(new Date().toISOString().split('T')[0])
    setModalMethod('Bank Deposit')
    setModalNotes('')
    setModalMsg('')
    setModalOpen(true)
  }

  function logout() {
    setBorrowers([]); setSelectedBorrower(null); setAdminUser(null)
    setLoanDetail(null); setPayments([]); setAllBorrowers([])
    setLastName(''); setZip(''); setPassword(''); setConfirm('')
    setAdminUser2(''); setAdminPass(''); setErr(''); setOk('')
    setScreen('login'); setLoginType('borrower')
  }

  // ── ADMIN TABLE HELPERS ──────────────────────────────────────────
  function getPaymentStatus(b: Borrower) {
    const logged = paymentLog.find(p => {
      const d = new Date(p.payment_date)
      return p.borrower_id === b.id && d.getFullYear() === adminYear && d.getMonth() === adminMonth
    })
    if (logged) return { status: 'paid', amount: logged.amount }
    const dueNum = parseInt(b.due_day)
    const today = new Date()
    const isPast = today.getFullYear() > adminYear ||
      (today.getFullYear() === adminYear && today.getMonth() > adminMonth) ||
      (today.getFullYear() === adminYear && today.getMonth() === adminMonth && today.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const paidCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'overdue').length

  // ── RENDER ───────────────────────────────────────────────────────
  const principalPaid = loanDetail ? (loanDetail.loan_amount - loanDetail.current_balance) : 0
  const pct = loanDetail ? Math.round((principalPaid / loanDetail.loan_amount) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc', fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/>
            <rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/>
            <rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/>
            <path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <polygon points="34,4 38,10 30,10" fill="#2e6da4"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div>
            <div style={{ fontSize: 9, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
              {adminUser ? 'Property Manager Portal' : 'Borrower Portal'}
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {adminUser && <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, background: '#f5f3ff', padding: '4px 12px', borderRadius: 20, border: '1px solid #ddd6fe' }}>🔐 {adminUser.full_name}</span>}
          <Link href="/" style={{ color: '#4a5568', textDecoration: 'none', fontSize: 13 }}>← Public Site</Link>
          {(selectedBorrower || adminUser) && (
            <button onClick={logout} style={{ background: 'none', border: '1px solid #dce4ed', padding: '6px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer', color: '#4a5568', fontFamily: "'DM Sans', sans-serif" }}>Log Out</button>
          )}
        </div>
      </nav>

      {/* ═══ LOGIN ═══ */}
      {screen === 'login' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '32px 18px' }}>
          <div style={{ ...s.card, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Portal Login</h2>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>Sign in to access your loan information and payment history.</p>

            {err && <div style={s.errMsg}>{err}</div>}

            <div style={{ marginBottom: 16 }}><label style={s.label}>Last Name</label><input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name on your loan" autoComplete="off"/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Property ZIP Code</label><input style={s.input} value={zip} onChange={e => setZip(e.target.value)} placeholder="5-digit ZIP" maxLength={5} autoComplete="off"/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Password</label><input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === 'Enter' && handleBorrowerLogin('login')}/></div>
            <button onClick={() => handleBorrowerLogin('login')} disabled={loading} style={{ ...s.btnBlue, width: '100%', marginTop: 4, opacity: loading ? .7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5568' }}>First time? <a onClick={() => setScreen('register')} style={{ color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>Create your account →</a></div>
          </div>
        </div>
      )}

      {/* ═══ REGISTER ═══ */}
      {screen === 'register' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '32px 18px' }}>
          <div style={{ ...s.card, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Create Your Account</h2>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>We verify your identity using your last name and property ZIP code.</p>
            {err && <div style={s.errMsg}>{err}</div>}
            {ok && <div style={s.okMsg}>{ok}</div>}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Last Name</label>
              <input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name exactly as on your loan"/>
              <p style={{ fontSize: 12, color: '#4a5568', marginTop: 6, fontStyle: 'italic' }}>Must match your loan documents exactly.</p>
            </div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Property ZIP Code</label><input style={s.input} value={zip} onChange={e => setZip(e.target.value)} placeholder="ZIP code of your property" maxLength={5}/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Choose a Password</label><input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Confirm Password</label><input style={s.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password" onKeyDown={e => { if(e.key==='Enter'){ if(password!==confirm){setErr('Passwords do not match');return} handleBorrowerLogin('register') } }}/></div>
            <button onClick={() => { if(password!==confirm){setErr('Passwords do not match');return} handleBorrowerLogin('register') }} disabled={loading} style={{ ...s.btnBlue, width: '100%', opacity: loading ? .7 : 1 }}>{loading ? 'Creating account...' : 'Create Account'}</button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5568' }}>Already have an account? <a onClick={() => setScreen('login')} style={{ color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>Sign in →</a></div>
          </div>
        </div>
      )}

      {/* ═══ PROPERTY SELECT ═══ */}
      {screen === 'select' && (
        <div style={{ padding: '40px 36px', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 8 }}>Select Your Property</h2>
          <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24, fontWeight: 300 }}>Multiple loans are associated with your account.</p>
          {borrowers.map(b => (
            <button key={b.id} onClick={() => { setSelectedBorrower(b); setScreen('dash'); setActiveTab('payments') }}
              style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '18px 22px', marginBottom: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all .2s' }}>
              <strong style={{ display: 'block', fontSize: 15, color: '#1c2026', marginBottom: 3 }}>{b.address}</strong>
              <span style={{ fontSize: 13, color: '#4a5568' }}>{b.entity} &nbsp;·&nbsp; Due {b.due_day} &nbsp;·&nbsp; {b.payment_amount}/mo</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ BORROWER DASHBOARD ═══ */}
      {screen === 'dash' && selectedBorrower && (
        <div style={{ padding: '32px 36px 72px', maxWidth: 1100, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #dce4ed' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 3 }}>{selectedBorrower.borrower_name}</h1>
            <div style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, marginBottom: 8 }}>Loan serviced by LWAW Investments, LLC on behalf of <strong>{selectedBorrower.entity}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f2fb', color: '#2e6da4', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>📍 {selectedBorrower.address}</span>
              {borrowers.length > 1 && <a onClick={() => setScreen('select')} style={{ fontSize: 13, color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>← Switch Property</a>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #dce4ed', flexWrap: 'wrap' }}>
            {[['payments','Payments'],['details','Loan Details'],['history','Payment History'],['amortization','Amortization'],['1098s','1098 Tax Docs'],['payoff','Payoff Quote'],['insurance','Insurance & Tax'],['contact','Contact']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)}
                style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, color: activeTab===id ? '#2e6da4' : '#4a5568', cursor: 'pointer', borderBottom: activeTab===id ? '2px solid #2e6da4' : '2px solid transparent', marginBottom: -2, background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab===id ? '#2e6da4' : 'transparent', fontFamily: "'DM Sans', sans-serif" }}>
                {label}
              </button>
            ))}
          </div>

          {/* PAYMENTS TAB */}
          {activeTab === 'payments' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ ...s.card, borderLeft: '3px solid #2e6da4' }}>
                  <div style={s.label}>Monthly Payment</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#2e6da4', fontWeight: 700, margin: '4px 0 5px' }}>{selectedBorrower.payment_amount}</div>
                  <div style={{ fontSize: 14, color: '#1c2026', fontWeight: 500 }}>Due: {selectedBorrower.due_day}</div>
                </div>
                <div style={s.card}>
                  <div style={s.label}>Escrow Status</div>
                  {selectedBorrower.escrow === 'taxes_and_insurance'
                    ? <><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: 8 }}>✓ Taxes & Insurance Escrowed</span><p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, lineHeight: 1.6 }}>Your monthly payment includes reserves for taxes and insurance. LWAW pays these on the note holder's behalf.</p></>
                    : <><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', marginBottom: 8 }}>⚠ No Escrow — Borrower Responsible</span><p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, lineHeight: 1.6 }}>You are responsible for property taxes (due Jan 31) and maintaining active insurance. Send proof to lwawinv@gmail.com.</p></>
                  }
                </div>
              </div>
              <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>📸</span>
                <p style={{ fontSize: 13, color: '#78350f', lineHeight: 1.65 }}><strong>Always send your deposit slip.</strong> After every payment, text a photo of your deposit slip to <strong>806-680-3556</strong>. You may also drop off payments at <strong>1026 SW 6th, Amarillo TX 79101</strong>.</p>
              </div>
              <div style={{ ...s.card, borderLeft: '3px solid #1c2026', marginBottom: 20 }}>
                <div style={s.label}>Where to Make Your Payment</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{selectedBorrower.bank}</div>
                <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 14, fontWeight: 300 }}>{selectedBorrower.bank_address}</div>
                <div style={{ background: '#e8f2fb', borderRadius: 6, padding: '10px 14px', display: 'inline-block' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 2 }}>Deposit Account Number</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1c2026', letterSpacing: 2 }}>{selectedBorrower.account_number}</div>
                </div>
                <p style={{ fontSize: 13, color: '#4a5568', marginTop: 12, fontWeight: 300, lineHeight: 1.6 }}>{selectedBorrower.payment_method}</p>
              </div>
            </>
          )}

          {/* LOAN DETAILS TAB */}
          {activeTab === 'details' && loanDetail && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                {[
                  { label: 'Original Loan Amount', val: fmt(loanDetail.loan_amount), color: '#1c2026' },
                  { label: 'Current Balance', val: fmt(loanDetail.current_balance), color: '#2e6da4' },
                  { label: 'Principal Paid', val: fmt(principalPaid), color: '#15803d' },
                  { label: 'Interest Rate', val: loanDetail.rate + '%', color: '#1c2026' },
                  { label: 'Loan Term', val: loanDetail.term_years + ' years', color: '#1c2026' },
                  { label: 'Loan Start Date', val: fmtDate(loanDetail.start_date), color: '#1c2026' },
                ].map((stat, i) => (
                  <div key={i} style={{ ...s.card, textAlign: 'center' }}>
                    <div style={{ ...s.label, marginBottom: 6 }}>{stat.label}</div>
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: stat.color, fontWeight: 700 }}>{stat.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...s.card, marginBottom: 20 }}>
                <div style={s.label}>Loan Payoff Progress</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#4a5568', marginBottom: 8 }}>
                  <span>Loan Start</span><span style={{ fontWeight: 600, color: '#2e6da4' }}>{pct}% paid off</span><span>Paid in Full</span>
                </div>
                <div style={{ height: 10, background: '#e2e8f0', borderRadius: 5, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#2e6da4,#22c55e)', borderRadius: 5, transition: 'width .5s ease' }}/>
                </div>
                <div style={{ display: 'flex', gap: 24, marginTop: 12, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, color: '#4a5568' }}>Scheduled Payment: <strong style={{ color: '#1c2026' }}>{fmt(loanDetail.scheduled_payment)}</strong></span>
                  <span style={{ fontSize: 13, color: '#4a5568' }}>Payments Made: <strong style={{ color: '#1c2026' }}>{loanDetail.payments_made}</strong></span>
                  <span style={{ fontSize: 13, color: '#4a5568' }}>Interest Paid: <strong style={{ color: '#1c2026' }}>{fmt(loanDetail.total_interest_paid)}</strong></span>
                  <span style={{ fontSize: 13, color: '#4a5568' }}>Lender: <strong style={{ color: '#1c2026' }}>{loanDetail.lender}</strong></span>
                </div>
              </div>
            </>
          )}

          {/* PAYMENT HISTORY TAB */}
          {activeTab === 'history' && (
            <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700 }}>Payment History</h4>
                <span style={{ fontSize: 12, color: '#4a5568' }}>Showing {payments.length} most recent payments</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f7f9fc' }}>
                      {['#','Payment Date','Total Paid','Principal','Interest','Remaining Balance','Source'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', fontSize: 11, letterSpacing: .5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === '#' ? 'left' : 'right', borderBottom: '1px solid #dce4ed' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8' }}>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, color: '#2e6da4' }}>#{p.payment_num}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, textAlign: 'right' }}>{fmtDate(p.payment_date)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{fmt(p.total_paid)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, textAlign: 'right' }}>{fmt(p.principal)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, textAlign: 'right' }}>{fmt(p.interest)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13.5, textAlign: 'right' }}>{fmt(p.ending_balance)}</td>
                        <td style={{ padding: '10px 16px', fontSize: 11, textAlign: 'right', color: p.source === 'portal' ? '#6d28d9' : '#4a5568' }}>{p.source === 'portal' ? '🔐 Portal' : p.source}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#4a5568', fontStyle: 'italic' }}>No payment history available yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INSURANCE & TAX TAB */}


          {/* ═══ AMORTIZATION SCHEDULE TAB ═══ */}
          {activeTab === 'amortization' && (
            <div>
              <div style={{ ...s.card, marginBottom: 20 }}>
                <div style={s.label}>Amortization Schedule</div>
                {loanDetail ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
                      {[
                        { label: 'Original Loan', val: fmt(loanDetail.loan_amount) },
                        { label: 'Current Balance', val: fmt(loanDetail.current_balance), highlight: true },
                        { label: 'Interest Rate', val: (loanDetail.rate * 100).toFixed(2) + '%' },
                        { label: 'Term', val: loanDetail.term_years + ' years' },
                        { label: 'Scheduled P&I', val: fmt(loanDetail.scheduled_payment) },
                        { label: 'Payments Made', val: String(loanDetail.payments_made) },
                        { label: 'Interest Paid', val: fmt(loanDetail.total_interest_paid) },
                        { label: 'Start Date', val: fmtDate(loanDetail.start_date) },
                      ].map((item, i) => (
                        <div key={i} style={{ background: item.highlight ? '#f0fdf4' : '#f7f9fc', borderRadius: 7, padding: '12px 14px', border: item.highlight ? '1px solid #bbf7d0' : '1px solid #dce4ed' }}>
                          <div style={{ fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 1.5, color: '#4a5568', fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: item.highlight ? 18 : 15, fontWeight: 700, color: item.highlight ? '#15803d' : '#1c2026' }}>{item.val}</div>
                        </div>
                      ))}
                    </div>
                    <AmortizationTable borrowerId={selectedBorrower?.id || ''} scheduledPayment={loanDetail.scheduled_payment} />
                  </>
                ) : (
                  <p style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic' }}>
                    Amortization schedule not available. Contact lwawinv@gmail.com for details.
                  </p>
                )}
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
                  <strong>Note:</strong> Green rows = confirmed payments received. Teal rows = additional payments from summary records. White rows = projected future payments. 
                  Balance figures are estimates and will be validated. Contact LWAW for official balance verification.
                </div>
              </div>
            </div>
          )}

          {/* ═══ 1098 TAX DOCUMENTS TAB ═══ */}
          {activeTab === '1098s' && (
            <div>
              <div style={{ ...s.card, marginBottom: 20 }}>
                <div style={s.label}>Form 1098 — Mortgage Interest Statements</div>
                <p style={{ fontSize: 13, color: '#4a5568', margin: '8px 0 20px' }}>
                  Your Form 1098 shows the mortgage interest paid during the year. Use this when filing your federal tax return.
                  Contact lwawinv@gmail.com if you need a copy mailed or have questions.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {[
                    { year: 2025, label: '2025 Form 1098 (Current Year)', available: true },
                    { year: 2024, label: '2024 Form 1098 (Prior Year)', available: true },
                  ].map(doc => (
                    <div key={doc.year} style={{ background: '#f7f9fc', border: '1px solid #dce4ed', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{doc.label}</div>
                        <div style={{ fontSize: 12, color: '#4a5568' }}>Tax Year {doc.year} · Mortgage Interest</div>
                      </div>
                      <a
                        href={`mailto:lwawinv@gmail.com?subject=1098 Request - ${selectedBorrower?.address} - ${doc.year}&body=Hi Brad, please send me my ${doc.year} Form 1098 for ${selectedBorrower?.address}. Thank you.`}
                        style={{ background: '#2e6da4', color: '#fff', padding: '8px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                      >
                        Request
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ ...s.card }}>
                <div style={s.label}>About Your 1098</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                  {[
                    { label: 'Box 1 — Mortgage Interest', desc: 'Total interest you paid during the year. Deductible on Schedule A.' },
                    { label: 'Box 2 — Outstanding Principal', desc: 'Your loan balance as of January 1 of the tax year.' },
                    { label: 'Box 3 — Origination Date', desc: 'The date your loan originated.' },
                    { label: 'Box 8 — Property Address', desc: 'The property securing this mortgage.' },
                  ].map((item, i) => (
                    <div key={i} style={{ background: '#f0f7ff', borderRadius: 6, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#2e6da4', marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 12, color: '#4a5568', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, fontSize: 12, color: '#92400e' }}>
                  <strong>Important:</strong> The interest shown on your 1098 may not be fully deductible. Consult a tax professional regarding your specific deduction eligibility.
                </div>
              </div>
            </div>
          )}


          {/* ═══ PAYOFF QUOTE TAB ═══ */}
          {activeTab === 'payoff' && (
            <PayoffCalculator borrower={selectedBorrower} loanDetail={loanDetail} />
          )}

          {activeTab === 'insurance' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={s.card}>
                <div style={s.label}>Required Lien Holders — Insurance Policy</div>
                <div style={{ background: '#f7f9fc', borderRadius: 6, padding: '10px 14px', marginBottom: 8, borderLeft: '2px solid #2e6da4' }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{selectedBorrower.entity}</div>
                  <div style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>{selectedBorrower.entity_address}</div>
                </div>
                {selectedBorrower.bank_lien && (
                  <div style={{ background: '#f7f9fc', borderRadius: 6, padding: '10px 14px', borderLeft: '2px solid #2e6da4' }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{selectedBorrower.bank_lien.split(' — ')[0]}</div>
                    <div style={{ fontSize: 12, color: '#4a5568', marginTop: 2 }}>{selectedBorrower.bank_lien.split(' — ')[1]}</div>
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#4a5568', marginTop: 12, paddingTop: 12, borderTop: '1px solid #dce4ed' }}>Send policy to: <strong>lwawinv@gmail.com</strong></div>
              </div>
              <div style={s.card}>
                <div style={s.label}>Property Tax</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6 }}>{selectedBorrower.tax_county === 'potter' ? 'Potter County' : 'Randall County'}</div>
                <p style={{ fontSize: 13.5, color: '#4a5568', fontWeight: 300, marginBottom: 4 }}>Taxes due <strong>January 31st</strong> each year.</p>
                {selectedBorrower.escrow !== 'taxes_and_insurance' ? (
                  <a href={selectedBorrower.tax_county === 'potter' ? 'https://www.pottercountytax.com/search' : 'https://randallcounty.propertytaxpayments.net/search'} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#1c2026', color: '#fff', padding: '9px 20px', borderRadius: 5, textDecoration: 'none', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Pay Property Taxes →</a>
                ) : (
                  <p style={{ fontSize: 12, color: '#4a5568', marginTop: 8, fontStyle: 'italic' }}>Taxes are escrowed — LWAW pays on your behalf.</p>
                )}
              </div>
            </div>
          )}

          {/* CONTACT TAB */}
          {activeTab === 'contact' && (
            <div style={{ ...s.card, borderLeft: '3px solid #2e6da4' }}>
              <div style={s.label}>Contact Your Servicer — LWAW Investments, LLC</div>
              <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginTop: 8 }}>
                {[{ label: 'Phone / Text', val: '806-680-3556', href: 'tel:8066803556' }, { label: 'Email', val: 'lwawinv@gmail.com', href: 'mailto:lwawinv@gmail.com' }].map(c => (
                  <div key={c.label}><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 4 }}>{c.label}</div><a href={c.href} style={{ fontSize: 16, fontWeight: 700, color: '#1c2026', textDecoration: 'none' }}>{c.val}</a></div>
                ))}
                <div><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 4 }}>Office</div><span style={{ fontSize: 16, fontWeight: 700 }}>1026 SW 6th, Amarillo TX 79101</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ ADMIN DASHBOARD ═══ */}
      {screen === 'admin' && adminUser && (
        <div style={{ padding: '32px 36px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26 }}>Payment Manager</h1>
              <p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, marginTop: 3 }}>All active loans — post payments, track status, flag overdue accounts</p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
            {[
              { label: 'Total Active Loans', val: allBorrowers.length, color: '#2e6da4' },
              { label: 'Paid This Month', val: paidCount, color: '#15803d' },
              { label: 'Unpaid This Month', val: allBorrowers.length - paidCount - overdueCount, color: '#4a5568' },
              { label: 'Overdue / Flagged', val: overdueCount, color: '#b45309' },
            ].map((stat, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '16px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>All Properties — {monthNames[adminMonth]} {adminYear}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4a5568' }}>
                <label>Month:</label>
                <select value={adminMonth} onChange={e => setAdminMonth(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '6px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}>
                  {monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <select value={adminYear} onChange={e => setAdminYear(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '6px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}>
                  <option value={2025}>2025</option><option value={2026}>2026</option>
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f0f4f8' }}>
                    {['Property Address','Borrower','Monthly Pmt','Current Balance','Due Day','Status','Action'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', fontSize: 11, letterSpacing: .5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allBorrowers.map(b => {
                    const { status, amount } = getPaymentStatus(b)
                    const isOverdue = status === 'overdue'
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f4f8', background: isOverdue ? '#fff9f9' : 'transparent' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{b.address}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#4a5568' }}>{b.borrower_name}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{b.payment_amount}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#2e6da4' }}>—</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'center' }}>{b.due_day}</td>
                        <td style={{ padding: '10px 16px' }}>
                          {status === 'paid'
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>✓ Paid{amount ? ' — $' + amount : ''}</span>
                            : status === 'overdue'
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#fff5f5', color: '#b91c1c' }}>⚠ Overdue</span>
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#f7f9fc', color: '#4a5568' }}>• Unpaid</span>
                          }
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          {status === 'paid'
                            ? <button disabled style={{ background: '#15803d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, opacity: .6, cursor: 'default', fontFamily: "'DM Sans', sans-serif" }}>✓ Posted</button>
                            : <button onClick={() => openPaymentModal(b)} style={{ background: '#2e6da4', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Post Payment</button>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ POST PAYMENT MODAL ═══ */}
      {modalOpen && modalBorrower && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>Post Payment</h3>
            <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>Recording payment for <strong>{modalBorrower.borrower_name}</strong><br/>{modalBorrower.address}</p>

            {modalMsg && <div style={modalMsg.startsWith('✓') ? s.okMsg : s.errMsg}>{modalMsg}</div>}

            <div style={{ marginBottom: 16 }}><label style={s.label}>Payment Amount ($)</label><input style={s.input} type="number" step="0.01" value={modalAmount} onChange={e => setModalAmount(e.target.value)}/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Payment Date</label><input style={s.input} type="date" value={modalDate} onChange={e => setModalDate(e.target.value)}/></div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Payment Method</label>
              <select style={s.input} value={modalMethod} onChange={e => setModalMethod(e.target.value)}>
                <option>Bank Deposit</option><option>Drop Off</option><option>Online (Equity Trust)</option><option>Other</option>
              </select>
            </div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Notes (optional)</label><textarea style={{ ...s.input, resize: 'vertical', minHeight: 70 }} value={modalNotes} onChange={e => setModalNotes(e.target.value)} placeholder="e.g. partial payment, late fee included..."/></div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: '1px solid #dce4ed', color: '#4a5568', padding: '11px 20px', borderRadius: 5, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={submitPayment} disabled={modalLoading} style={{ ...s.btnGreen, flex: 1, opacity: modalLoading ? .7 : 1 }}>{modalLoading ? 'Posting...' : '✓ Post Payment & Notify Brad'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
