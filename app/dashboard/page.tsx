'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type AdminUser = { id: string; username: string; full_name: string; role: string }
type Borrower = {
  id: string; address: string; borrower_name: string; entity: string;
  payment_amount: string; due_day: string; escrow: string; active: boolean;
  bank: string; account_number: string; bank_address: string; payment_method: string;
  entity_address: string; bank_lien: string | null; tax_county: string; zip: string; last_name: string;
}
type Payment = {
  id: string; borrower_id: string; payment_date: string; total_paid: number;
  principal: number | null; interest: number | null; ending_balance: number | null;
  source: string; posted_by: string | null; payment_num: number | null;
}
type PaymentLog = {
  id: string; borrower_id: string; amount: number; payment_date: string;
  method: string; notes: string | null; posted_by: string; created_at: string;
}
type LoanDetail = {
  borrower_id: string; loan_amount: number; rate: number; term_years: number;
  start_date: string; scheduled_payment: number; lender: string;
  current_balance: number; total_interest_paid: number; payments_made: number;
}

const fmt = (n: number | null | undefined) => n != null ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtDate = (d: string) => { if (!d) return '—'; const p = d.split('T')[0].split('-'); return p[1] + '/' + p[2] + '/' + p[0] }

function hashPw(pw: string): string {
  let h = 5381
  for (let i = 0; i < pw.length; i++) { h = ((h << 5) + h) + pw.charCodeAt(i); h = h >>> 0 }
  return h.toString(36)
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const ENTITIES = ['All Entities','A2DSTX, LLC','A2PI, LLC','A2AF2, LLC','A2BH, LLC','A2BA, LLC','A Squared Property Investments, LLC','Equity Trust Company Custodian FBO Arick Wray IRA']

// ── TODO DATA ─────────────────────────────────────────────────────────
const TODO_CATEGORIES = [
  { id: 'website', label: 'Website & Portal', accent: '#0ea5e9', items: [
    { id: 105, text: 'Redeploy Vercel from desktop to activate RESEND_API_KEY email notifications', done: false },
    { id: 106, text: "Delete GitHub PAT token 'lwaw-portal-deploy' (security hygiene)", done: false },
    { id: 124, text: 'Add column sorting to Arick admin panel (due date default)', done: false },
    { id: 125, text: 'Delete old URL Redirect Record in Namecheap DNS', done: false },
    { id: 126, text: "Fix Gladys / 1632 NW 18th — last_name shows as 'contractors'", done: false },
    { id: 107, text: 'Build Brad Dashboard (payments received, overdue, activity, insurance)', done: false },
    { id: 108, text: 'Email + SMS alerts when Arick posts payment (Resend — code done, needs redeploy)', done: false },
    { id: 109, text: 'Insurance expiration tracker: every policy, days remaining, red/yellow/green status', done: false },
    { id: 110, text: 'Borrower payment history PDF export', done: false },
    { id: 111, text: 'Escrow balance tracker (collected vs. paid out per loan)', done: false },
    { id: 112, text: 'Arick monthly payment summary auto-generator', done: false },
    { id: 113, text: 'Payoff quote calculator (borrower + date → payoff with per-diem)', done: false },
    { id: 114, text: 'Borrower communication log (calls, promises to pay, attorney referrals)', done: false },
  ]},
  { id: 'automation', label: 'Automation Pipeline', accent: '#3b82f6', items: [
    { id: 1, text: 'Build Gmail → Make.com → Claude → spreadsheet payment pipeline', done: false },
    { id: 6, text: 'Set up confirmation text/email back to Brad after each update', done: false },
  ]},
  { id: 'insurance', label: 'Insurance', accent: '#f97316', items: [
    { id: 11, text: 'Build JPEG-to-text extraction pipeline for Arick scanned insurance docs', done: false },
    { id: 13, text: 'Resolve expired/urgent policies (1511 Woodland + May 2026 expiring)', done: false },
    { id: 14, text: 'Set up recurring insurance expiration alerts', done: false },
  ]},
  { id: 'deals', label: 'Active Deals & Collections', accent: '#ef4444', items: [
    { id: 22, text: 'Expedite lender wrap approval for active seller-finance contract', done: false },
    { id: 23, text: 'Expedite HOA approval for active seller-finance contract', done: false },
    { id: 24, text: 'Follow up with Evelio Rodriguez on two-month payment offer', done: false },
  ]},
]

export default function DashboardPage() {
  const [screen, setScreen] = useState<'login' | 'dash'>('login')
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Data
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [paymentLog, setPaymentLog] = useState<PaymentLog[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [loanDetails, setLoanDetails] = useState<LoanDetail[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null)
  const [drillPayments, setDrillPayments] = useState<Payment[]>([])
  const [drillLoan, setDrillLoan] = useState<LoanDetail | null>(null)

  // Filters
  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [entityFilter, setEntityFilter] = useState('All Entities')
  const [sortCol, setSortCol] = useState('due_day')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [search, setSearch] = useState('')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalBorrower, setModalBorrower] = useState<Borrower | null>(null)
  const [modalAmount, setModalAmount] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalMethod, setModalMethod] = useState('Bank Deposit')
  const [modalNotes, setModalNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalMsg, setModalMsg] = useState('')

  // Todo
  const [todos, setTodos] = useState(TODO_CATEGORIES)

  useEffect(() => { if (adminUser) loadData() }, [adminUser, month, year])

  async function loadData() {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: bs }, { data: logs }, { data: pmts }, { data: lds }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('active', true).order('address'),
      supabase.from('payment_log').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_history').select('*').order('payment_date', { ascending: false }),
      supabase.from('loan_details').select('*'),
    ])
    if (bs) setBorrowers(bs)
    if (logs) setPaymentLog(logs)
    if (pmts) setAllPayments(pmts)
    if (lds) setLoanDetails(lds)
  }

  async function handleLogin() {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Invalid credentials'); return }
      setAdminUser(data.admin); setScreen('dash')
    } catch { setErr('Connection error.') }
    finally { setLoading(false) }
  }

  async function drillInto(b: Borrower) {
    setSelectedBorrower(b)
    setActiveTab('drill')
    const { supabase } = await import('@/lib/supabase')
    const [{ data: pmts }, { data: ld }] = await Promise.all([
      supabase.from('payment_history').select('*').eq('borrower_id', b.id).order('payment_date', { ascending: false }),
      supabase.from('loan_details').select('*').eq('borrower_id', b.id).single()
    ])
    if (pmts) setDrillPayments(pmts)
    if (ld) setDrillLoan(ld)
  }

  async function submitPayment() {
    if (!modalBorrower) return
    setModalLoading(true); setModalMsg('')
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ borrower_id: modalBorrower.id, amount: parseFloat(modalAmount), payment_date: modalDate, method: modalMethod, notes: modalNotes, posted_by: adminUser?.full_name || 'Admin' })
      })
      const data = await res.json()
      if (!res.ok) { setModalMsg('Error: ' + (data.error || 'Failed')); return }
      setModalMsg('✓ Payment posted!')
      setTimeout(() => { setModalOpen(false); loadData() }, 1500)
    } catch { setModalMsg('Connection error.') }
    finally { setModalLoading(false) }
  }

  function toggleTodo(catId: string, itemId: number) {
    setTodos(prev => prev.map(c => c.id !== catId ? c : {
      ...c, items: c.items.map(i => i.id !== itemId ? i : { ...i, done: !i.done })
    }))
  }

  // ── COMPUTED ─────────────────────────────────────────────────────────
  const now = new Date()
  const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
  const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0]
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  const mtdLogs = paymentLog.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
  const ytdLogs = paymentLog.filter(p => p.payment_date >= yearStart && p.payment_date <= yearEnd)
  const mtdTotal = mtdLogs.reduce((s, p) => s + p.amount, 0)
  const ytdTotal = ytdLogs.reduce((s, p) => s + p.amount, 0)

  // MTD/YTD by entity
  const entityTotals = ENTITIES.slice(1).map(entity => {
    const entityBorrowers = borrowers.filter(b => b.entity === entity).map(b => b.id)
    const mtd = mtdLogs.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    const ytd = ytdLogs.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    return { entity: entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA (Arick)'), mtd, ytd }
  }).filter(e => e.mtd > 0 || e.ytd > 0)

  function getPaymentStatus(b: Borrower) {
    const logged = paymentLog.find(p => {
      const d = new Date(p.payment_date)
      return p.borrower_id === b.id && d.getFullYear() === year && d.getMonth() === month
    })
    if (logged) return { status: 'paid', amount: logged.amount }
    const dueNum = parseInt(b.due_day)
    const isPast = now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() > month) ||
      (now.getFullYear() === year && now.getMonth() === month && now.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }

  const paidCount = borrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = borrowers.filter(b => getPaymentStatus(b).status === 'overdue').length

  // Sorted + filtered borrowers
  const filteredBorrowers = borrowers
    .filter(b => entityFilter === 'All Entities' || b.entity === entityFilter)
    .filter(b => !search || b.address.toLowerCase().includes(search.toLowerCase()) || b.borrower_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let av: any, bv: any
      if (sortCol === 'due_day') { av = parseInt(a.due_day); bv = parseInt(b.due_day) }
      else if (sortCol === 'address') { av = a.address; bv = b.address }
      else if (sortCol === 'payment_amount') { av = parseFloat(a.payment_amount.replace(/[$,]/g,'')); bv = parseFloat(b.payment_amount.replace(/[$,]/g,'')) }
      else if (sortCol === 'status') { av = getPaymentStatus(a).status; bv = getPaymentStatus(b).status }
      else if (sortCol === 'entity') { av = a.entity; bv = b.entity }
      else { av = (a as any)[sortCol]; bv = (b as any)[sortCol] }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })

  function SortHeader({ col, label }: { col: string, label: string }) {
    const active = sortCol === col
    return (
      <th onClick={() => { if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortCol(col); setSortDir('asc') } }}
        style={{ padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', color: active ? '#2e6da4' : '#4a5568', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap', cursor: 'pointer', background: active ? '#f0f7ff' : '#f0f4f8', userSelect: 'none' }}>
        {label} {active ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  const totalDone = todos.flatMap(c => c.items).filter(i => i.done).length
  const totalItems = todos.flatMap(c => c.items).length

  const s = {
    card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '18px 22px' } as React.CSSProperties,
    label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 6 },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#1c2026', background: '#fff', outline: 'none' },
    tab: (active: boolean) => ({ padding: '10px 18px', fontSize: 13, fontWeight: 600, color: active ? '#2e6da4' : '#4a5568', cursor: 'pointer', borderBottom: active ? '2px solid #2e6da4' : '2px solid transparent', marginBottom: -2, background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid' as const, borderBottomColor: active ? '#2e6da4' : 'transparent', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' as const }),
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────────────────
  if (screen === 'login') return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: '40px 44px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#f0f6fc"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#f0f6fc"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#f0f6fc"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: '#f0f6fc', fontWeight: 700 }}>LWAW Investments</div><div style={{ fontSize: 10, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Staff Dashboard</div></div>
        </div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: '#f0f6fc', marginBottom: 6 }}>Sign In</h2>
        <p style={{ fontSize: 13, color: '#8b949e', marginBottom: 24 }}>Restricted access — authorized staff only</p>
        {err && <div style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{err}</div>}
        <div style={{ marginBottom: 14 }}><label style={{ ...s.label, color: '#8b949e' }}>Username</label><input style={{ ...s.input, background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc' }} value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="off"/></div>
        <div style={{ marginBottom: 20 }}><label style={{ ...s.label, color: '#8b949e' }}>Password</label><input style={{ ...s.input, background: '#0d1117', border: '1px solid #30363d', color: '#f0f6fc' }} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleLogin()}/></div>
        <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: '#2e6da4', color: '#fff', border: 'none', padding: '12px', borderRadius: 6, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: loading ? .7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
        <div style={{ marginTop: 20, textAlign: 'center' }}><Link href="/" style={{ fontSize: 12, color: '#8b949e', textDecoration: 'none' }}>← Back to lwawinv.com</Link></div>
      </div>
    </div>
  )

  // ── DASHBOARD ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc', fontFamily: "'DM Sans', sans-serif" }}>
      {/* NAV */}
      <nav style={{ background: '#0d1117', borderBottom: '1px solid #30363d', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#f0f6fc"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#f0f6fc"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#f0f6fc"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#f0f6fc', fontWeight: 700 }}>LWAW Staff Dashboard</span>
          <span style={{ fontSize: 11, color: '#2e6da4', background: '#1d3450', padding: '3px 10px', borderRadius: 12, fontWeight: 600 }}>{adminUser?.full_name}</span>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Link href="/portal" style={{ fontSize: 12, color: '#8b949e', textDecoration: 'none' }}>Borrower Portal</Link>
          <Link href="/" style={{ fontSize: 12, color: '#8b949e', textDecoration: 'none' }}>Public Site</Link>
          <button onClick={() => { setAdminUser(null); setScreen('login') }} style={{ background: 'none', border: '1px solid #30363d', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#8b949e', fontFamily: "'DM Sans', sans-serif" }}>Log Out</button>
        </div>
      </nav>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '2px solid #dce4ed', overflowX: 'auto' }}>
          {[
            ['overview', '📊 Overview'],
            ['payments', '💳 Payments'],
            adminUser?.role === 'superadmin' ? ['brad', '👤 Brad View'] : null,
            ['todo', `✓ To-Do (${totalDone}/${totalItems})`],
          ].filter(Boolean).map(([id, label]: any) => (
            <button key={id} onClick={() => { setActiveTab(id); setSelectedBorrower(null) }} style={s.tab(activeTab === id)}>{label}</button>
          ))}
          {selectedBorrower && <button style={s.tab(activeTab === 'drill')}>🔍 {selectedBorrower.address.split(',')[0]}</button>}
        </div>

        {/* Month/Year filters */}
        {(activeTab === 'overview' || activeTab === 'payments') && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '7px 12px', fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>{MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}</select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '7px 12px', fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}><option value={2025}>2025</option><option value={2026}>2026</option></select>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '7px 12px', fontSize: 13, cursor: 'pointer', outline: 'none', fontFamily: "'DM Sans', sans-serif" }}>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select>
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'MTD Collected', val: fmt(mtdTotal), color: '#15803d', bg: '#f0fdf4' },
                { label: 'YTD Collected', val: fmt(ytdTotal), color: '#2e6da4', bg: '#e8f2fb' },
                { label: 'Paid This Month', val: paidCount, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Overdue', val: overdueCount, color: '#b91c1c', bg: '#fff5f5' },
                { label: 'Unpaid', val: borrowers.length - paidCount - overdueCount, color: '#4a5568', bg: '#f7f9fc' },
                { label: 'Active Loans', val: borrowers.length, color: '#1c2026', bg: '#f7f9fc' },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, border: '1px solid #dce4ed', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* MTD/YTD by entity */}
            {entityTotals.length > 0 && (
              <div style={{ ...s.card, marginBottom: 22 }}>
                <div style={s.label}>Collections by Entity — {MONTHS[month]} {year}</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ background: '#f7f9fc' }}>
                      {['Entity', 'MTD Collected', 'YTD Collected'].map(h => <th key={h} style={{ padding: '8px 14px', fontSize: 11, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === 'Entity' ? 'left' : 'right', borderBottom: '1px solid #dce4ed' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {entityTotals.map((e, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                          <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>{e.entity}</td>
                          <td style={{ padding: '8px 14px', fontSize: 13, textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{fmt(e.mtd)}</td>
                          <td style={{ padding: '8px 14px', fontSize: 13, textAlign: 'right', color: '#2e6da4' }}>{fmt(e.ytd)}</td>
                        </tr>
                      ))}
                      <tr style={{ borderTop: '2px solid #dce4ed', background: '#f7f9fc' }}>
                        <td style={{ padding: '8px 14px', fontSize: 13, fontWeight: 700 }}>TOTAL</td>
                        <td style={{ padding: '8px 14px', fontSize: 14, textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{fmt(mtdTotal)}</td>
                        <td style={{ padding: '8px 14px', fontSize: 14, textAlign: 'right', color: '#2e6da4', fontWeight: 700 }}>{fmt(ytdTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent activity */}
            <div style={s.card}>
              <div style={s.label}>Recent Payment Activity</div>
              {paymentLog.slice(0, 10).map((p, i) => {
                const b = borrowers.find(x => x.id === p.borrower_id)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f4f8' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{b?.address || p.borrower_id}</div>
                      <div style={{ fontSize: 11, color: '#4a5568' }}>{fmtDate(p.payment_date)} · {p.method} · {p.posted_by}</div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{fmt(p.amount)}</div>
                  </div>
                )
              })}
              {paymentLog.length === 0 && <p style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic' }}>No payments posted yet.</p>}
            </div>
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #dce4ed', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address or borrower..." style={{ ...s.input, width: 260, padding: '7px 12px', fontSize: 13 }}/>
              <span style={{ fontSize: 13, color: '#4a5568', marginLeft: 'auto' }}>{filteredBorrowers.length} properties</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <SortHeader col="due_day" label="Due" />
                    <SortHeader col="address" label="Property" />
                    <SortHeader col="borrower_name" label="Borrower" />
                    <SortHeader col="entity" label="Entity" />
                    <SortHeader col="payment_amount" label="Payment" />
                    <SortHeader col="status" label="Status" />
                    <th style={{ padding: '10px 12px', fontSize: 11, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dce4ed', background: '#f0f4f8' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBorrowers.map(b => {
                    const { status, amount } = getPaymentStatus(b)
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f4f8', background: status === 'overdue' ? '#fff9f9' : 'transparent' }}>
                        <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#2e6da4' }}>{b.due_day}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{b.address.split(',')[0]}</td>
                        <td style={{ padding: '9px 12px', fontSize: 12, color: '#4a5568' }}>{b.borrower_name.split(' ').slice(0,2).join(' ')}</td>
                        <td style={{ padding: '9px 12px', fontSize: 11, color: '#4a5568' }}>{b.entity.replace(', LLC','').replace('A Squared Property Investments','A²').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA')}</td>
                        <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600 }}>{b.payment_amount}</td>
                        <td style={{ padding: '9px 12px' }}>
                          {status === 'paid' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>✓ Paid{amount ? ' $' + amount : ''}</span>
                          : status === 'overdue' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#fff5f5', color: '#b91c1c' }}>⚠ Overdue</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#f7f9fc', color: '#4a5568' }}>• Unpaid</span>}
                        </td>
                        <td style={{ padding: '9px 12px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => drillInto(b)} style={{ background: '#f0f4f8', border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Details</button>
                            {status !== 'paid' && <button onClick={() => { setModalBorrower(b); setModalAmount(b.payment_amount.replace(/[$,]/g,'')); setModalDate(new Date().toISOString().split('T')[0]); setModalMethod('Bank Deposit'); setModalNotes(''); setModalMsg(''); setModalOpen(true) }} style={{ background: '#2e6da4', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Post</button>}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRILL DOWN TAB ── */}
        {activeTab === 'drill' && selectedBorrower && (
          <div>
            <button onClick={() => { setActiveTab('payments'); setSelectedBorrower(null) }} style={{ background: 'none', border: 'none', color: '#2e6da4', cursor: 'pointer', fontSize: 13, marginBottom: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>← Back to Payments</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div style={s.card}>
                <div style={s.label}>Loan Details</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{selectedBorrower.address}</div>
                <div style={{ fontSize: 13, color: '#4a5568', marginBottom: 4 }}>{selectedBorrower.borrower_name}</div>
                <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 12 }}>{selectedBorrower.entity}</div>
                {drillLoan && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[
                      { label: 'Original Amount', val: fmt(drillLoan.loan_amount) },
                      { label: 'Current Balance', val: fmt(drillLoan.current_balance) },
                      { label: 'Rate', val: drillLoan.rate + '%' },
                      { label: 'Term', val: drillLoan.term_years + ' years' },
                      { label: 'Scheduled Pmt', val: fmt(drillLoan.scheduled_payment) },
                      { label: 'Payments Made', val: drillLoan.payments_made },
                      { label: 'Interest Paid', val: fmt(drillLoan.total_interest_paid) },
                      { label: 'Start Date', val: fmtDate(drillLoan.start_date) },
                    ].map((item, i) => (
                      <div key={i} style={{ background: '#f7f9fc', borderRadius: 6, padding: '8px 10px' }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#4a5568', fontWeight: 600, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={s.card}>
                <div style={s.label}>Payment Instructions</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{selectedBorrower.bank}</div>
                <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 10 }}>{selectedBorrower.bank_address}</div>
                <div style={{ background: '#e8f2fb', borderRadius: 6, padding: '8px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#2e6da4', fontWeight: 600, marginBottom: 2 }}>Account Number</div>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2 }}>{selectedBorrower.account_number}</div>
                </div>
                <div style={s.label}>Lien Holders</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedBorrower.entity}</div>
                <div style={{ fontSize: 11, color: '#4a5568', marginBottom: 6 }}>{selectedBorrower.entity_address}</div>
                {selectedBorrower.bank_lien && <>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedBorrower.bank_lien.split(' — ')[0]}</div>
                  <div style={{ fontSize: 11, color: '#4a5568' }}>{selectedBorrower.bank_lien.split(' — ')[1]}</div>
                </>}
                <div style={{ marginTop: 12 }}>
                  <div style={s.label}>Escrow</div>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: selectedBorrower.escrow === 'taxes_and_insurance' ? '#f0fdf4' : '#fffbeb', color: selectedBorrower.escrow === 'taxes_and_insurance' ? '#15803d' : '#b45309' }}>
                    {selectedBorrower.escrow === 'taxes_and_insurance' ? '✓ Taxes & Insurance Escrowed' : '⚠ No Escrow'}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Payment History ({drillPayments.length} records)</h4>
              </div>
              <div style={{ overflowX: 'auto', maxHeight: 400, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0 }}>
                    <tr style={{ background: '#f7f9fc' }}>
                      {['#','Date','Total','Principal','Interest','Balance','Source'].map(h => <th key={h} style={{ padding: '8px 12px', fontSize: 11, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === '#' ? 'left' : 'right', borderBottom: '1px solid #dce4ed' }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {drillPayments.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f0f4f8', background: p.source === 'portal' ? '#f5f3ff' : 'transparent' }}>
                        <td style={{ padding: '7px 12px', fontSize: 12, color: '#2e6da4' }}>#{p.payment_num || '—'}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{fmtDate(p.payment_date)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right', color: '#15803d', fontWeight: 600 }}>{fmt(p.total_paid)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(p.principal)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(p.interest)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 12, textAlign: 'right' }}>{fmt(p.ending_balance)}</td>
                        <td style={{ padding: '7px 12px', fontSize: 11, textAlign: 'right', color: p.source === 'portal' ? '#6d28d9' : '#4a5568' }}>{p.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TODO TAB ── */}
        {activeTab === 'todo' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: '#4a5568' }}>{totalDone} of {totalItems} complete</span>
                <span style={{ fontSize: 13, color: '#4a5568', fontFamily: 'monospace' }}>{Math.round(totalDone/totalItems*100)}%</span>
              </div>
              <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: Math.round(totalDone/totalItems*100) + '%', background: 'linear-gradient(90deg, #2e6da4, #22c55e)', borderRadius: 3, transition: 'width .4s' }}/>
              </div>
            </div>
            {todos.map(cat => (
              <div key={cat.id} style={{ background: '#fff', border: '1px solid #dce4ed', borderLeft: `3px solid ${cat.accent}`, borderRadius: 8, marginBottom: 14, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f4f8', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: '#1c2026' }}>{cat.label}</span>
                  <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace' }}>{cat.items.filter(i => i.done).length}/{cat.items.length}</span>
                </div>
                {cat.items.map(item => (
                  <div key={item.id} onClick={() => toggleTodo(cat.id, item.id)} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 16px', cursor: 'pointer', borderBottom: '1px solid #f9fafb' }}>
                    <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${item.done ? cat.accent : '#d1d5db'}`, background: item.done ? cat.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      {item.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 13, color: item.done ? '#9ca3af' : '#1c2026', textDecoration: item.done ? 'line-through' : 'none', lineHeight: 1.5 }}>{item.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── BRAD VIEW TAB ── */}
        {activeTab === 'brad' && adminUser?.role === 'superadmin' && (
          <div style={{ ...s.card, textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏗️</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 8 }}>Brad's Full Dashboard</h3>
            <p style={{ fontSize: 14, color: '#4a5568', maxWidth: 400, margin: '0 auto' }}>Coming next session — insurance tracker, escrow balances, document storage, payoff calculator, and borrower comms log.</p>
          </div>
        )}
      </div>

      {/* ── POST PAYMENT MODAL ── */}
      {modalOpen && modalBorrower && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 460, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, marginBottom: 4 }}>Post Payment</h3>
            <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 20 }}>{modalBorrower.borrower_name}<br/>{modalBorrower.address}</p>
            {modalMsg && <div style={{ background: modalMsg.startsWith('✓') ? '#f0fdf4' : '#fff5f5', color: modalMsg.startsWith('✓') ? '#15803d' : '#b91c1c', border: `1px solid ${modalMsg.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`, borderRadius: 5, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>{modalMsg}</div>}
            <div style={{ marginBottom: 12 }}><label style={s.label}>Amount ($)</label><input style={s.input} type="number" step="0.01" value={modalAmount} onChange={e => setModalAmount(e.target.value)}/></div>
            <div style={{ marginBottom: 12 }}><label style={s.label}>Date</label><input style={s.input} type="date" value={modalDate} onChange={e => setModalDate(e.target.value)}/></div>
            <div style={{ marginBottom: 12 }}><label style={s.label}>Method</label><select style={s.input} value={modalMethod} onChange={e => setModalMethod(e.target.value)}><option>Bank Deposit</option><option>Drop Off</option><option>Online (Equity Trust)</option><option>Other</option></select></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Notes</label><textarea style={{ ...s.input, resize: 'vertical', minHeight: 60 }} value={modalNotes} onChange={e => setModalNotes(e.target.value)} placeholder="Optional..."/></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: '1px solid #dce4ed', color: '#4a5568', padding: '10px 18px', borderRadius: 5, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={submitPayment} disabled={modalLoading} style={{ flex: 1, background: '#15803d', color: '#fff', border: 'none', padding: '10px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: modalLoading ? .7 : 1 }}>{modalLoading ? 'Posting...' : '✓ Post & Notify Brad'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
