'use client'
import React, { useState, useEffect } from 'react'
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

// ── ESCROW DATA ────────────────────────────────────────────────────────
const ESCROW_DATA = [
  { entity: 'A2PI, LLC',          address: '4214 SW 38th',      db_id: 'juan-4214',      pi: 1715.63, tax: 316.35, ins: 109.63, total: 2141.61, balance: 2992.23 },
  { entity: 'A2PI, LLC',          address: '1937 S Roosevelt',  db_id: 'reina-1937',     pi: 1239.30, tax: 173.28, ins: 210.67, total: 1623.25, balance: 6042.85 },
  { entity: 'A2PI, LLC',          address: '3311 NE 20th',      db_id: 'griselda-3311',  pi: 1240.86, tax: 227.42, ins: 134.35, total: 1602.63, balance: 3583.79 },
  { entity: 'A2BH, LLC',          address: '3309 NE 20th',      db_id: 'perla-3309',     pi: 894.44,  tax: 194.09, ins: 225.51, total: 1314.04, balance: 2812.54 },
  { entity: 'A2BH, LLC',          address: '1508 N Washington', db_id: 'ochoa-1508',     pi: 994.03,  tax: 84.63,  ins: 163.09, total: 1241.75, balance: 1043.14 },
  { entity: 'A2BH, LLC',          address: '1408 Heather',      db_id: 'nancy-1408',     pi: 1285.45, tax: 204.73, ins: 294.33, total: 1784.51, balance: 2558.06 },
  { entity: 'A2BH, LLC',          address: '1933 S Highland',   db_id: 'ochoa-1933',     pi: 1276.26, tax: 244.85, ins: 205.93, total: 1727.04, balance: 597.96  },
  { entity: 'A2BH, LLC',          address: '2504 Bivins',       db_id: 'david-2504',     pi: 1281.20, tax: 242.36, ins: 228.50, total: 1752.06, balance: 4402.89 },
  { entity: 'A2DSTX, LLC',        address: '4312 Bonham',       db_id: 'angel-4312',     pi: 1619.68, tax: 212.03, ins: 181.81, total: 2013.52, balance: 3966.05 },
  { entity: 'A2BA Finance, LLC',   address: '1908 Seminole',     db_id: 'alicia-1908',    pi: 1309.28, tax: 170.42, ins: 181.92, total: 1661.62, balance: 2125.88 },
  { entity: 'A2BH, LLC',          address: '1920 Manhattan',    db_id: 'lidice-1920',    pi: 1096.72, tax: 229.86, ins: 183.56, total: 1532.66, balance: null    },
]

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



// ── DASHBOARD AMORTIZATION TABLE ───────────────────────────────────────────
function DashAmortizationTable({ borrowerId }: { borrowerId: string }) {
  const [rows, setRows] = React.useState<any[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)
  const fmt2 = (n: number | null) => n != null ? '$' + n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'

  React.useEffect(() => {
    import('@/lib/supabase').then(({supabase}) => {
      supabase.from('amortization_schedule').select('*').eq('borrower_id', borrowerId).order('payment_num')
        .then(({data}) => { if (data) setRows(data); setLoaded(true) })
    })
  }, [borrowerId])

  if (!loaded) return <div style={{ padding: '20px', fontSize: 13, color: '#4a5568' }}>Loading...</div>
  if (rows.length === 0) return (
    <div style={{ padding: '20px', fontSize: 13, color: '#4a5568', fontStyle: 'italic' }}>
      Schedule pending — data will be validated and loaded. Mark data as validated to enable.
    </div>
  )

  const displayed = showAll ? rows : rows.slice(0, 30)
  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0 }}>
            <tr style={{ background: '#f7f9fc' }}>
              {['#','Date','Total','Principal','Interest','Ending Balance','Status'].map(h => (
                <th key={h} style={{ padding: '8px 12px', fontSize: 10, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h==='#'?'center':'right', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r: any) => {
              const isConf = r.is_confirmed && r.source === 'confirmed'
              const isSumm = r.is_confirmed && r.source === 'summary'
              const bg = isConf ? '#f0fdf4' : isSumm ? '#d1fae5' : '#fff'
              const color = isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af'
              return (
                <tr key={r.payment_num} style={{ borderBottom: '1px solid #f0f4f8', background: bg }}>
                  <td style={{ padding: '7px 12px', textAlign: 'center', color: '#2e6da4', fontWeight: 600, fontSize: 12 }}>{r.payment_num}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontFamily: 'monospace', fontSize: 11, color }}>{r.payment_date?.substring(0,10) || '—'}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: 12, fontWeight: r.is_confirmed ? 600 : 400, color }}>{fmt2(r.total_payment)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: 12, color }}>{fmt2(r.principal)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: 12, color }}>{fmt2(r.interest)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: 12, fontWeight: r.is_confirmed ? 700 : 400, color: isConf ? '#15803d' : isSumm ? '#065f46' : '#6b7280' }}>{fmt2(r.ending_balance)}</td>
                  <td style={{ padding: '7px 12px', textAlign: 'right', fontSize: 11, color }}>
                    {isConf ? '✓ Confirmed' : isSumm ? '✓ Summary' : 'Projected'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {rows.length > 30 && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid #f0f4f8' }}>
          <button onClick={() => setShowAll(!showAll)} style={{ background: 'none', border: '1px solid #dce4ed', borderRadius: 5, padding: '6px 14px', fontSize: 12, cursor: 'pointer', color: '#2e6da4', fontFamily: "'DM Sans', sans-serif" }}>
            {showAll ? `Show Less` : `Show All ${rows.length} Rows`}
          </button>
        </div>
      )}
    </div>
  )
}

// ── INSURANCE DATA ────────────────────────────────────────────────────────────
const INSURANCE_DATA = [
  { address: '821 N Apache', entity: 'A Squared', borrower: 'Carlos Perez', ins_exp: '2024-10-25', days_left: -532, escrow: 'NO', status: 'expired' },
  { address: '4008 S Tyler', entity: 'A Squared', borrower: 'Borrower', ins_exp: '2024-12-11', days_left: -485, escrow: 'NO', status: 'expired' },
  { address: '3611 & 3613 SE 13th', entity: 'A2DSTX', borrower: 'Multiple', ins_exp: '2025-07-23', days_left: -261, escrow: 'YES', status: 'expired' },
  { address: '207 Mississippi', entity: 'A Squared', borrower: 'Eli Huhem', ins_exp: '2025-10-01', days_left: -191, escrow: 'NO', status: 'expired' },
  { address: '609 & 611 N Mirror', entity: 'A2DSTX', borrower: 'Multiple', ins_exp: '2025-10-17', days_left: -175, escrow: 'TAX', status: 'expired' },
  { address: '805 S Louisiana', entity: 'A Squared', borrower: 'Multiple', ins_exp: '2025-11-28', days_left: -133, escrow: 'NO', status: 'expired' },
  { address: '409 Forest', entity: 'A Squared', borrower: 'Borrower', ins_exp: '2026-01-08', days_left: -92, escrow: 'NO', status: 'expired' },
  { address: '1601 Hillcrest', entity: 'A2AF2', borrower: 'Garcia/Deleon', ins_exp: '2026-03-08', days_left: -33, escrow: 'YES', status: 'expired' },
  { address: '1511 S Woodland', entity: 'A2DSTX', borrower: 'Adriana Colina', ins_exp: '2026-03-11', days_left: -30, escrow: 'NO', status: 'expired' },
  { address: '404 S Crockett', entity: 'A2BH', borrower: 'Cindy/Sindy', ins_exp: '2026-03-24', days_left: -17, escrow: 'YES', status: 'expired' },
  { address: '3813 S Hughes', entity: 'A2PI', borrower: 'Brundage', ins_exp: '2026-04-22', days_left: 12, escrow: 'NO', status: 'critical' },
  { address: '2504 Bivins', entity: 'A2BH', borrower: 'David Flores', ins_exp: '2026-05-05', days_left: 25, escrow: 'YES', status: 'critical' },
  { address: '3204 Spring', entity: 'A2AF2', borrower: 'Zane Rojas', ins_exp: '2026-05-06', days_left: 26, escrow: 'NO', status: 'critical' },
  { address: '1903 S Roosevelt', entity: 'A2BH', borrower: 'Ochoa Enterprises', ins_exp: '2026-05-06', days_left: 26, escrow: 'NO', status: 'critical' },
  { address: '4433 Fannin', entity: 'A2BH', borrower: 'Ochoa Enterprises', ins_exp: '2026-05-06', days_left: 26, escrow: 'NO', status: 'critical' },
  { address: '3702 S Monroe', entity: 'A2DSTX', borrower: 'Synthia Henderson', ins_exp: '2026-05-17', days_left: 37, escrow: 'NO', status: 'warning' },
  { address: '4109 S Polk', entity: 'A Squared', borrower: 'Jordan Rentals', ins_exp: '2026-06-02', days_left: 53, escrow: 'NO', status: 'warning' },
  { address: '1410 S Ong/4012 Gables', entity: 'A2BA', borrower: 'LLC', ins_exp: '2026-06-02', days_left: 53, escrow: 'NO', status: 'warning' },
  { address: '4214 SW 38th', entity: 'A2PI', borrower: 'Juan San Martin', ins_exp: '2026-07-06', days_left: 87, escrow: 'YES', status: 'warning' },
  { address: '700 N Houston', entity: 'A Squared', borrower: 'Borrower', ins_exp: '2026-07-11', days_left: 92, escrow: 'NO', status: 'ok' },
  { address: '1937 S Roosevelt', entity: 'A2PI', borrower: 'Jesus Macias', ins_exp: '2026-08-05', days_left: 117, escrow: 'YES', status: 'ok' },
  { address: '1908 Seminole', entity: 'A2BA', borrower: 'Borrower', ins_exp: '2026-08-08', days_left: 120, escrow: 'YES', status: 'ok' },
  { address: '3311 NE 20th', entity: 'A2PI', borrower: 'Pascual Sanchez', ins_exp: '2026-08-12', days_left: 124, escrow: 'YES', status: 'ok' },
  { address: '1920 Manhattan', entity: 'A2BH', borrower: 'Lidice', ins_exp: '2026-09-04', days_left: 147, escrow: 'YES', status: 'ok' },
  { address: '2602 Olive', entity: 'A2BA', borrower: 'Zachary Lopez', ins_exp: '2026-09-11', days_left: 154, escrow: 'NO', status: 'ok' },
  { address: '3309 NE 20th', entity: 'A2BH', borrower: 'Perla Terrazas', ins_exp: '2026-09-20', days_left: 163, escrow: 'YES', status: 'ok' },
  { address: '4312 Bonham', entity: 'A2BA', borrower: 'Leyva/Sarmiento', ins_exp: '2026-10-09', days_left: 182, escrow: 'YES', status: 'ok' },
  { address: '11403 Palermo', entity: 'A2PI', borrower: 'Yusdel Rivero', ins_exp: '2026-10-22', days_left: 195, escrow: 'NO', status: 'ok' },
  { address: '315 SW 29th', entity: 'A2PI', borrower: 'Evelyn Aviles', ins_exp: '2026-10-23', days_left: 196, escrow: 'NO', status: 'ok' },
  { address: '4209 S Polk + 3', entity: 'A Squared', borrower: 'Eli Huhem', ins_exp: '2026-11-05', days_left: 209, escrow: 'NO', status: 'ok' },
  { address: '1408 Heather', entity: 'A2BH', borrower: 'Multiple', ins_exp: '2026-11-22', days_left: 226, escrow: 'YES', status: 'ok' },
  { address: '4207 Harmony', entity: 'A2PI', borrower: 'Rafaela Asencio', ins_exp: '2026-11-26', days_left: 230, escrow: 'NO', status: 'ok' },
  { address: '3612 Atkinsen', entity: 'A2PI', borrower: 'Maria Mancinas', ins_exp: '2026-12-07', days_left: 241, escrow: 'NO', status: 'ok' },
  { address: '600 Houston', entity: 'A2DSTX', borrower: 'Luis Lancho', ins_exp: '2027-01-06', days_left: 271, escrow: 'NO', status: 'ok' },
  { address: '1632 NW 18th', entity: 'IRA', borrower: 'Gladys', ins_exp: '2027-01-11', days_left: 276, escrow: 'NO', status: 'ok' },
  { address: '1933 S Highland', entity: 'A2BH', borrower: 'Ochoa Enterprises', ins_exp: '2027-01-25', days_left: 290, escrow: 'YES', status: 'ok' },
  { address: '1508 N Washington', entity: 'A2BH', borrower: 'Ochoa Enterprises', ins_exp: '2027-01-25', days_left: 290, escrow: 'YES', status: 'ok' },
  { address: '209 Louisiana +4', entity: 'A Squared', borrower: 'Eli Huhem', ins_exp: '2027-01-26', days_left: 291, escrow: 'NO', status: 'ok' },
  { address: '4326 & 4328 S Polk', entity: 'A Squared', borrower: 'Eli Huhem', ins_exp: '2027-01-26', days_left: 291, escrow: 'NO', status: 'ok' },
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

  // New Loan modal (Brad/superadmin only)
  const [newLoanOpen, setNewLoanOpen] = useState(false)
  const [nlAddress, setNlAddress] = useState('')
  const [nlBorrower, setNlBorrower] = useState('')
  const [nlEntity, setNlEntity] = useState('A Squared Property Investments, LLC')
  const [nlAmount, setNlAmount] = useState('')
  const [nlRate, setNlRate] = useState('')
  const [nlTerm, setNlTerm] = useState('30')
  const [nlStart, setNlStart] = useState(new Date().toISOString().split('T')[0])
  const [nlEscrow, setNlEscrow] = useState('none')
  const [nlBank, setNlBank] = useState('')
  const [nlAcct, setNlAcct] = useState('')
  const [nlMsg, setNlMsg] = useState('')
  const [nlLoading, setNlLoading] = useState(false)

  // Todo
  const [todos, setTodos] = useState(TODO_CATEGORIES)

  // Escrow expanded entities
  const [escrowExpanded, setEscrowExpanded] = useState<Record<string, boolean>>({})

  // Amortization collections (YTD/MTD from confirmed amort rows)
  const [amortCollections, setAmortCollections] = useState<any[]>([])

  useEffect(() => { if (adminUser) loadData() }, [adminUser, month, year])

  async function loadData() {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: bs }, { data: logs }, { data: pmts }, { data: lds }, { data: amort }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('active', true).order('address'),
      supabase.from('payment_log').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_history').select('*').order('payment_date', { ascending: false }),
      supabase.from('loan_details').select('*'),
      supabase.from('amortization_schedule').select('borrower_id,payment_date,principal,interest,total_payment,is_confirmed').eq('is_confirmed', true),
    ])
    if (bs) setBorrowers(bs)
    if (logs) setPaymentLog(logs)
    if (pmts) setAllPayments(pmts)
    if (lds) setLoanDetails(lds)
    if (amort) setAmortCollections(amort)
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

  // MTD/YTD by entity — with P&I breakdown from payment_history
  const mtdPayments = allPayments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
  const ytdPayments = allPayments.filter(p => p.payment_date >= yearStart && p.payment_date <= yearEnd)

  // Overall P&I totals
  const mtdPrincipal = mtdPayments.reduce((s, p) => s + (p.principal || 0), 0)
  const mtdInterest = mtdPayments.reduce((s, p) => s + (p.interest || 0), 0)
  const ytdPrincipal = ytdPayments.reduce((s, p) => s + (p.principal || 0), 0)
  const ytdInterest = ytdPayments.reduce((s, p) => s + (p.interest || 0), 0)

  const entityTotals = ENTITIES.slice(1).map(entity => {
    const entityBorrowers = borrowers.filter(b => b.entity === entity).map(b => b.id)
    const mtd = mtdLogs.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    const ytd = ytdLogs.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    const mtdP = mtdPayments.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + (p.principal || 0), 0)
    const mtdI = mtdPayments.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + (p.interest || 0), 0)
    const ytdP = ytdPayments.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + (p.principal || 0), 0)
    const ytdI = ytdPayments.filter(p => entityBorrowers.includes(p.borrower_id)).reduce((s, p) => s + (p.interest || 0), 0)
    return { entity: entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA (Arick)'), mtd, ytd, mtdP, mtdI, ytdP, ytdI }
  }).filter(e => e.mtd > 0 || e.ytd > 0)

  function getPaymentStatus(b: Borrower) {
    // Check payment_log first (manually posted by Arick)
    const logged = paymentLog.find(p => {
      const d = new Date(p.payment_date)
      return p.borrower_id === b.id && d.getFullYear() === year && d.getMonth() === month
    })
    if (logged) return { status: 'paid', amount: logged.amount }
    // Also check confirmed amortization rows for this month
    const amortPaid = amortCollections.find(r => {
      if (r.borrower_id !== b.id) return false
      const d = new Date(r.payment_date)
      return d.getFullYear() === year && d.getMonth() === month
    })
    if (amortPaid) return { status: 'paid', amount: amortPaid.total_payment }
    const dueNum = parseInt(b.due_day)
    const isPast = now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() > month) ||
      (now.getFullYear() === year && now.getMonth() === month && now.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }

  const paidCount = borrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = borrowers.filter(b => getPaymentStatus(b).status === 'overdue').length

  // Amortization-based MTD/YTD collections (from confirmed amort rows)
  const amortMTD = amortCollections.filter(r => r.payment_date >= monthStart && r.payment_date <= monthEnd)
  const amortYTD = amortCollections.filter(r => r.payment_date >= yearStart && r.payment_date <= yearEnd)
  const amortMTDPrincipal = amortMTD.reduce((s, r) => s + (r.principal || 0), 0)
  const amortMTDInterest  = amortMTD.reduce((s, r) => s + (r.interest || 0), 0)
  const amortMTDTotal     = amortMTD.reduce((s, r) => s + (r.total_payment || 0), 0)
  const amortYTDPrincipal = amortYTD.reduce((s, r) => s + (r.principal || 0), 0)
  const amortYTDInterest  = amortYTD.reduce((s, r) => s + (r.interest || 0), 0)
  const amortYTDTotal     = amortYTD.reduce((s, r) => s + (r.total_payment || 0), 0)

  // Escrow entity totals
  const escrowEntities = [...new Set(ESCROW_DATA.map(e => e.entity))]
  const escrowByEntity = escrowEntities.map(entity => {
    const props = ESCROW_DATA.filter(e => e.entity === entity)
    const totalBal = props.reduce((s, p) => s + (p.balance || 0), 0)
    const totalPmt = props.reduce((s, p) => s + p.total, 0)
    return { entity, props, totalBal, totalPmt }
  })

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
          {adminUser?.role === 'superadmin' && (
            <button onClick={() => { setNewLoanOpen(true); setNlMsg('') }} style={{ background: '#15803d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              + New Loan
            </button>
          )}
          {adminUser?.role === 'superadmin' && (
            <button onClick={() => { setNewLoanOpen(true); setNlMsg('') }} style={{ background: '#15803d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>+ New Loan</button>
          )}
          <button onClick={() => { setAdminUser(null); setScreen('login') }} style={{ background: 'none', border: '1px solid #30363d', padding: '5px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#8b949e', fontFamily: "'DM Sans', sans-serif" }}>Log Out</button>
        </div>
      </nav>

      <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, borderBottom: '2px solid #dce4ed', overflowX: 'auto' }}>
          {[
            ['overview', 'Overview'],
            ['payments', 'Payments'],
            ['escrow', '🏦 Escrow'],
            adminUser?.role === 'superadmin' ? ['brad', 'Brad View'] : null,
            adminUser?.role === 'superadmin' ? ['insurance', 'Insurance'] : null,
            adminUser?.role === 'superadmin' ? ['todo', `To-Do (${totalDone}/${totalItems})`] : null,
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

            {/* Collections from confirmed amortization rows */}
            <div style={{ ...s.card, marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={s.label}>Collections — {MONTHS[month]} {year}</div>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Source: confirmed amortization schedule</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f7f9fc' }}>
                    {['Period','Principal','Interest','Total Collected'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', fontSize: 11, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === 'Period' ? 'left' : 'right', borderBottom: '1px solid #dce4ed' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f0f4f8' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>MTD — {MONTHS[month]}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'right', color: '#2e6da4', fontWeight: 600 }}>{fmt(amortMTDPrincipal)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'right', color: '#64748b' }}>{fmt(amortMTDInterest)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 15, textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{fmt(amortMTDTotal)}</td>
                    </tr>
                    <tr style={{ background: '#f7f9fc' }}>
                      <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600 }}>YTD — {year}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'right', color: '#2e6da4', fontWeight: 600 }}>{fmt(amortYTDPrincipal)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 13, textAlign: 'right', color: '#64748b' }}>{fmt(amortYTDInterest)}</td>
                      <td style={{ padding: '11px 14px', fontSize: 15, textAlign: 'right', color: '#15803d', fontWeight: 700 }}>{fmt(amortYTDTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

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
                          {status === 'paid' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>✓ Paid{amount ? ' ' + fmt(amount) : ''}</span>
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
            <button onClick={() => { setSelectedBorrower(null); setActiveTab('payments') }}
              style={{ marginBottom: 16, background: 'none', border: '1px solid #dce4ed', borderRadius: 6, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#2e6da4', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              ← Back to Payments
            </button>
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
                      { label: 'Rate', val: (drillLoan.rate * 100).toFixed(3).replace(/\.?0+$/, '') + '%' },
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
            {/* Amortization Schedule (confirmed = historical payments, projected = future) */}
            <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden', marginTop: 16 }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Payment History / Amortization Schedule</h4>
                <span style={{ fontSize: 12, color: '#4a5568' }}>
                  <span style={{ display: 'inline-block', width: 10, height: 10, background: '#92D050', borderRadius: 2, marginRight: 4 }}></span>Confirmed
                  <span style={{ display: 'inline-block', width: 10, height: 10, background: '#D1FAE5', borderRadius: 2, marginLeft: 10, marginRight: 4 }}></span>Summary
                  <span style={{ display: 'inline-block', width: 10, height: 10, background: '#F7F9FC', border: '1px solid #dce4ed', borderRadius: 2, marginLeft: 10, marginRight: 4 }}></span>Projected
                </span>
              </div>
              <DashAmortizationTable borrowerId={selectedBorrower.id} />
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

        {/* ── INSURANCE TRACKER TAB ── */}
        {activeTab === 'insurance' && adminUser?.role === 'superadmin' && (
          <div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'Expired', val: INSURANCE_DATA.filter(d => d.status === 'expired').length, color: '#b91c1c', bg: '#fff5f5' },
                { label: 'Critical (< 30d)', val: INSURANCE_DATA.filter(d => d.status === 'critical').length, color: '#b45309', bg: '#fffbeb' },
                { label: 'Warning (< 90d)', val: INSURANCE_DATA.filter(d => d.status === 'warning').length, color: '#1d4ed8', bg: '#eff6ff' },
                { label: 'Current', val: INSURANCE_DATA.filter(d => d.status === 'ok').length, color: '#15803d', bg: '#f0fdf4' },
                { label: 'Total Tracked', val: INSURANCE_DATA.length, color: '#1c2026', bg: '#f7f9fc' },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, border: '1px solid #dce4ed', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.val}</div>
                </div>
              ))}
            </div>
            {/* Table */}
            <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #dce4ed', background: '#f7f9fc' }}>
                <span style={{ fontWeight: 700, fontSize: 15 }}>Insurance Expiration Tracker</span>
                <span style={{ fontSize: 12, color: '#4a5568', marginLeft: 12 }}>Updated from Note Tracking sheet · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f0f4f8' }}>
                      {['Property', 'Borrower', 'Entity', 'Expires', 'Days Left', 'Escrow', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', fontSize: 11, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {INSURANCE_DATA.map((item, i) => {
                      const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
                        expired:  { bg: '#fff5f5', color: '#b91c1c', label: 'EXPIRED' },
                        critical: { bg: '#fffbeb', color: '#b45309', label: 'CRITICAL' },
                        warning:  { bg: '#eff6ff', color: '#1d4ed8', label: 'WARNING' },
                        ok:       { bg: 'transparent', color: '#15803d', label: 'OK' },
                      }
                      const ss = statusStyles[item.status] || statusStyles.ok
                      return (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f4f8', background: ss.bg }}>
                          <td style={{ padding: '9px 14px', fontWeight: 600, fontSize: 13 }}>{item.address}</td>
                          <td style={{ padding: '9px 14px', fontSize: 12, color: '#4a5568' }}>{item.borrower.split(' ').slice(0, 2).join(' ')}</td>
                          <td style={{ padding: '9px 14px', fontSize: 11, color: '#4a5568' }}>{item.entity.replace(', LLC', '').replace('A Squared Property Investments', 'A Squared')}</td>
                          <td style={{ padding: '9px 14px', fontSize: 13, fontFamily: 'monospace' }}>{item.ins_exp}</td>
                          <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'center', fontWeight: 700, color: ss.color }}>{item.days_left}</td>
                          <td style={{ padding: '9px 14px', fontSize: 11, textAlign: 'center' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600, background: item.escrow === 'YES' ? '#f0fdf4' : '#f7f9fc', color: item.escrow === 'YES' ? '#15803d' : '#4a5568' }}>{item.escrow}</span>
                          </td>
                          <td style={{ padding: '9px 14px' }}>
                            <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700, background: ss.bg, color: ss.color, border: `1px solid ${ss.color}33` }}>{ss.label}</span>
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

        {/* ── ESCROW TAB ── */}
        {activeTab === 'escrow' && (
          <div>
            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 22 }}>
              {[
                { label: 'Total Escrow Balance', val: fmt(ESCROW_DATA.reduce((s, e) => s + (e.balance || 0), 0)), color: '#15803d', bg: '#f0fdf4' },
                { label: 'Escrowed Properties', val: ESCROW_DATA.length, color: '#2e6da4', bg: '#e8f2fb' },
                { label: 'Entities with Escrow', val: escrowByEntity.length, color: '#1c2026', bg: '#f7f9fc' },
                { label: 'Total Monthly Required', val: fmt(ESCROW_DATA.reduce((s, e) => s + e.total, 0)), color: '#4a5568', bg: '#f7f9fc' },
              ].map((stat, i) => (
                <div key={i} style={{ background: stat.bg, border: '1px solid #dce4ed', borderRadius: 8, padding: '14px 18px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, marginBottom: 6 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: stat.color }}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Entity accordion */}
            {escrowByEntity.map(({ entity, props, totalBal, totalPmt }) => (
              <div key={entity} style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
                {/* Entity header — clickable to expand */}
                <div
                  onClick={() => setEscrowExpanded(prev => ({ ...prev, [entity]: !prev[entity] }))}
                  style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: escrowExpanded[entity] ? '#f0f7ff' : '#fff', borderBottom: escrowExpanded[entity] ? '1px solid #dce4ed' : 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: escrowExpanded[entity] ? '#2e6da4' : '#1c2026' }}>
                      {escrowExpanded[entity] ? '▼' : '▶'} {entity.replace(', LLC', '').replace('A Squared Property Investments', 'A Squared').replace('Finance', 'Fin.')}
                    </span>
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{props.length} {props.length === 1 ? 'property' : 'properties'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', fontWeight: 600 }}>Mo. Required</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#4a5568' }}>{fmt(totalPmt)}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#9ca3af', fontWeight: 600 }}>Escrow Balance</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#15803d' }}>{fmt(totalBal)}</div>
                    </div>
                  </div>
                </div>

                {/* Expanded property rows */}
                {escrowExpanded[entity] && (
                  <div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f7f9fc' }}>
                          {['Property', 'P&I', 'Taxes', 'Insurance', 'Total Required', 'Escrow Balance'].map(h => (
                            <th key={h} style={{ padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: h === 'Property' ? 'left' : 'right', borderBottom: '1px solid #dce4ed' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {props.map((prop, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}>
                            <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{prop.address}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', color: '#2e6da4' }}>{fmt(prop.pi)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', color: '#64748b' }}>{fmt(prop.tax)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 12, textAlign: 'right', color: '#64748b' }}>{fmt(prop.ins)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 600 }}>{fmt(prop.total)}</td>
                            <td style={{ padding: '10px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: prop.balance && prop.balance > 0 ? '#15803d' : '#9ca3af' }}>
                              {prop.balance != null ? fmt(prop.balance) : '—'}
                            </td>
                          </tr>
                        ))}
                        {/* Entity subtotal */}
                        <tr style={{ background: '#f0f7ff', borderTop: '1px solid #dce4ed' }}>
                          <td style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, color: '#2e6da4' }}>Subtotal</td>
                          <td colSpan={3} style={{ padding: '9px 14px' }}></td>
                          <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: '#2e6da4' }}>{fmt(totalPmt)}</td>
                          <td style={{ padding: '9px 14px', fontSize: 13, textAlign: 'right', fontWeight: 700, color: '#15803d' }}>{fmt(totalBal)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}

            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 16 }}>
              Balances from Escrow Tracking Sheet · Updated April 2026 · Read-only view
            </div>
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

      {/* ── NEW LOAN MODAL (Brad only) ── */}
      {newLoanOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setNewLoanOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '28px 32px', width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,.2)', margin: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: 0 }}>New Loan Transaction</h3>
              <button onClick={() => setNewLoanOpen(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            {nlMsg && <div style={{ background: nlMsg.startsWith('✓') ? '#f0fdf4' : '#fff5f5', color: nlMsg.startsWith('✓') ? '#15803d' : '#b91c1c', border: `1px solid ${nlMsg.startsWith('✓') ? '#bbf7d0' : '#fecaca'}`, borderRadius: 5, padding: '8px 12px', fontSize: 13, marginBottom: 14 }}>{nlMsg}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1/-1' }}><label style={s.label}>Property Address</label><input style={s.input} value={nlAddress} onChange={e => setNlAddress(e.target.value)} placeholder="4109 S Polk, Amarillo TX 79110"/></div>
              <div style={{ gridColumn: '1/-1' }}><label style={s.label}>Borrower Name</label><input style={s.input} value={nlBorrower} onChange={e => setNlBorrower(e.target.value)} placeholder="Full legal name(s)"/></div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={s.label}>Entity (Lender)</label>
                <select style={s.input} value={nlEntity} onChange={e => setNlEntity(e.target.value)}>
                  <option>A Squared Property Investments, LLC</option>
                  <option>A2PI, LLC</option>
                  <option>A2AF2, LLC</option>
                  <option>A2BH, LLC</option>
                  <option>A2BA Finance, LLC</option>
                  <option>A2DSTX, LLC</option>
                  <option>Equity Trust Company Custodian FBO Arick Wray IRA</option>
                </select>
              </div>
              <div><label style={s.label}>Loan Amount ($)</label><input style={s.input} type="number" step="0.01" value={nlAmount} onChange={e => setNlAmount(e.target.value)} placeholder="150000.00"/></div>
              <div><label style={s.label}>Interest Rate (%)</label><input style={s.input} type="number" step="0.01" value={nlRate} onChange={e => setNlRate(e.target.value)} placeholder="10.00"/></div>
              <div><label style={s.label}>Term (years)</label><input style={s.input} type="number" value={nlTerm} onChange={e => setNlTerm(e.target.value)} placeholder="30"/></div>
              <div><label style={s.label}>First Payment Date</label><input style={s.input} type="date" value={nlStart} onChange={e => setNlStart(e.target.value)}/></div>
              <div>
                <label style={s.label}>Escrow</label>
                <select style={s.input} value={nlEscrow} onChange={e => setNlEscrow(e.target.value)}>
                  <option value="none">No Escrow</option>
                  <option value="taxes_and_insurance">Taxes & Insurance</option>
                  <option value="taxes_only">Taxes Only</option>
                </select>
              </div>
              <div><label style={s.label}>Bank</label><input style={s.input} value={nlBank} onChange={e => setNlBank(e.target.value)} placeholder="Interstate State Bank (ISB)"/></div>
              <div><label style={s.label}>Account Number</label><input style={s.input} value={nlAcct} onChange={e => setNlAcct(e.target.value)} placeholder="Account #"/></div>
            </div>
            <div style={{ marginTop: 6, padding: '12px 14px', background: '#f7f9fc', borderRadius: 6, fontSize: 12, color: '#4a5568' }}>
              <strong>Next steps after saving:</strong> Add borrower record to Supabase, update Note Tracking spreadsheet, add amortization tab, seed amortization schedule to DB.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setNewLoanOpen(false)} style={{ background: 'none', border: '1px solid #dce4ed', color: '#4a5568', padding: '10px 18px', borderRadius: 5, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button
                onClick={() => {
                  if (!nlAddress || !nlBorrower || !nlAmount || !nlRate) { setNlMsg('Please fill in address, borrower, amount, and rate.'); return }
                  const rate = parseFloat(nlRate) / 100
                  const mo = rate / 12
                  const n = parseFloat(nlTerm) * 12
                  const pi = parseFloat(nlAmount) * mo * Math.pow(1 + mo, n) / (Math.pow(1 + mo, n) - 1)
                  setNlMsg(`✓ Loan summary: ${nlBorrower} | ${nlAddress} | $${parseFloat(nlAmount).toLocaleString()} @ ${nlRate}% | P&I = $${pi.toFixed(2)}/mo. Record this in your Note Tracking spreadsheet and Supabase to complete setup.`)
                }}
                disabled={nlLoading}
                style={{ flex: 1, background: '#15803d', color: '#fff', border: 'none', padding: '10px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                Calculate & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
