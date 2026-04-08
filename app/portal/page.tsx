'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type Borrower = {
  id: string; last_name: string; zip: string; address: string
  borrower_name: string; entity: string; entity_address: string
  bank: string; bank_address: string; account_number: string
  payment_amount: string; due_day: string; escrow: string
  tax_county: string; bank_lien: string | null; payment_method: string
}
type LoanDetail = {
  borrower_id: string; loan_amount: number; rate: number; term_years: number
  start_date: string; scheduled_payment: number; lender: string
  current_balance: number; total_interest_paid: number; payments_made: number
}
type Payment = {
  id: string; payment_num: number; payment_date: string; total_paid: number
  principal: number; interest: number; ending_balance: number; source: string; posted_by: string | null
}
type AdminUser = { id: string; username: string; full_name: string; role: string }

const fmt = (n: number | null) => n ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtDate = (d: string) => { if (!d) return '—'; const p = d.split('-'); return p[1] + '/' + p[2] + '/' + p[0] }

const s = {
  card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '22px 26px' } as React.CSSProperties,
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 8 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#1c2026', background: '#fff', outline: 'none' },
  btnBlue: { background: '#2e6da4', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 5, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' } as React.CSSProperties,
  btnGreen: { background: '#15803d', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  errMsg: { background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  okMsg: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
}

export default function PortalPage() {
  const [screen, setScreen] = useState<'login' | 'register' | 'select' | 'dash' | 'admin'>('login')
  const [loginType, setLoginType] = useState<'borrower' | 'admin'>('borrower')
  const [activeTab, setActiveTab] = useState('payments')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)
  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [allBorrowers, setAllBorrowers] = useState<Borrower[]>([])
  const [paymentLog, setPaymentLog] = useState<any[]>([])
  const [adminMonth, setAdminMonth] = useState(new Date().getMonth())
  const [adminYear, setAdminYear] = useState(new Date().getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalBorrower, setModalBorrower] = useState<Borrower | null>(null)
  const [modalAmount, setModalAmount] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalMethod, setModalMethod] = useState('Bank Deposit')
  const [modalNotes, setModalNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalMsg, setModalMsg] = useState('')
  const [lastName, setLastName] = useState('')
  const [zip, setZip] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [adminUser2, setAdminUser2] = useState('')
  const [adminPass, setAdminPass] = useState('')

  useEffect(() => { if (selectedBorrower) loadBorrowerData(selectedBorrower.id) }, [selectedBorrower])
  useEffect(() => { if (adminUser) loadAdminData() }, [adminUser, adminMonth, adminYear])

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

  async function handleBorrowerLogin(action: 'login' | 'register') {
    setErr(''); setOk(''); setLoading(true)
    try {
      const res = await fetch('/api/borrower-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lastName, zip, password, action }) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Login failed'); return }
      setBorrowers(data.borrowers)
      if (data.borrowers.length === 1) { setSelectedBorrower(data.borrowers[0]); setScreen('dash') }
      else setScreen('select')
    } catch { setErr('Connection error.') }
    finally { setLoading(false) }
  }

  async function handleAdminLogin() {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: adminUser2, password: adminPass }) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Login failed'); return }
      setAdminUser(data.admin); setScreen('admin')
    } catch { setErr('Connection error.') }
    finally { setLoading(false) }
  }

  async function submitPayment() {
    if (!modalBorrower) return
    setModalLoading(true); setModalMsg('')
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrower_id: modalBorrower.id, amount: parseFloat(modalAmount), payment_date: modalDate, method: modalMethod, notes: modalNotes, posted_by: adminUser?.full_name || 'Arick Wray' }) })
      const data = await res.json()
      if (!res.ok) { setModalMsg('Error: ' + (data.error || 'Failed')); return }
      setModalMsg('✓ Payment posted! Brad has been notified.')
      setTimeout(() => { setModalOpen(false); loadAdminData() }, 2000)
    } catch { setModalMsg('Connection error.') }
    finally { setModalLoading(false) }
  }

  function openPaymentModal(b: Borrower) {
    setModalBorrower(b); setModalAmount(b.payment_amount.replace(/[$,]/g, ''))
    setModalDate(new Date().toISOString().split('T')[0]); setModalMethod('Bank Deposit')
    setModalNotes(''); setModalMsg(''); setModalOpen(true)
  }

  function logout() {
    setBorrowers([]); setSelectedBorrower(null); setAdminUser(null)
    setLoanDetail(null); setPayments([]); setAllBorrowers([])
    setLastName(''); setZip(''); setPassword(''); setConfirm('')
    setAdminUser2(''); setAdminPass(''); setErr(''); setOk('')
    setScreen('login'); setLoginType('borrower')
  }

  function getPaymentStatus(b: Borrower) {
    const logged = paymentLog.find(p => { const d = new Date(p.payment_date); return p.borrower_id === b.id && d.getFullYear() === adminYear && d.getMonth() === adminMonth })
    if (logged) return { status: 'paid', amount: logged.amount }
    const dueNum = parseInt(b.due_day)
    const today = new Date()
    const isPast = today.getFullYear() > adminYear || (today.getFullYear() === adminYear && today.getMonth() > adminMonth) || (today.getFullYear() === adminYear && today.getMonth() === adminMonth && today.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const paidCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'overdue').length
  const principalPaid = loanDetail ? (loanDetail.loan_amount - loanDetail.current_balance) : 0
  const pct = loanDetail ? Math.round((principalPaid / loanDetail.loan_amount) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, boxShadow: '0 1px 6px rgba(0,0,0,.05)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div><div style={{ fontSize: 9, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase' }}>{adminUser ? 'Property Manager Portal' : 'Borrower Portal'}</div></div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {adminUser && <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, background: '#f5f3ff', padding: '4px 12px', borderRadius: 20, border: '1px solid #ddd6fe' }}>🔐 {adminUser.full_name}</span>}
          <Link href="/" style={{ color: '#4a5568', textDecoration: 'none', fontSize: 13 }}>← Public Site</Link>
          {(selectedBorrower || adminUser) && <button onClick={logout} style={{ background: 'none', border: '1px solid #dce4ed', padding: '6px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer', color: '#4a5568', fontFamily: "'DM Sans', sans-serif" }}>Log Out</button>}
        </div>
      </nav>

      {screen === 'login' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '32px 18px' }}>
          <div style={{ ...s.card, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Portal Login</h2>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>Sign in to access your loan information and payment history.</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(['borrower', 'admin'] as const).map(t => (
                <button key={t} onClick={() => { setLoginType(t); setErr('') }} style={{ flex: 1, padding: 9, borderRadius: 6, border: '1px solid', borderColor: loginType === t ? '#2e6da4' : '#dce4ed', background: loginType === t ? '#2e6da4' : '#fff', color: loginType === t ? '#fff' : '#4a5568', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {t === 'borrower' ? '🏠 Borrower Login' : '🔐 Property Manager'}
                </button>
              ))}
            </div>
            {err && <div style={s.errMsg}>{err}</div>}
            {loginType === 'borrower' ? (
              <>
                <div style={{ marginBottom: 16 }}><label style={s.label}>Last Name</label><input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name on your loan" autoComplete="off"/></div>
                <div style={{ marginBottom: 16 }}><label style={s.label}>Property ZIP Code</label><input style={s.input} value={zip} onChange={e => setZip(e.target.value)} placeholder="5-digit ZIP" maxLength={5}/></div>
                <div style={{ marginBottom: 16 }}><label style={s.label}>Password</label><input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === 'Enter' && handleBorrowerLogin('login')}/></div>
                <button onClick={() => handleBorrowerLogin('login')} disabled={loading} style={{ ...s.btnBlue, opacity: loading ? .7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5568' }}>First time? <a onClick={() => setScreen('register')} style={{ color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>Create your account →</a></div>
              </>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}><label style={s.label}>Username</label><input style={s.input} value={adminUser2} onChange={e => setAdminUser2(e.target.value)} placeholder="Admin username"/></div>
                <div style={{ marginBottom: 16 }}><label style={s.label}>Password</label><input style={s.input} type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()}/></div>
                <button onClick={handleAdminLogin} disabled={loading} style={{ ...s.btnBlue, background: '#4f46e5', opacity: loading ? .7 : 1 }}>{loading ? 'Signing in...' : 'Sign In as Manager'}</button>
              </>
            )}
          </div>
        </div>
      )}

      {screen === 'register' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '32px 18px' }}>
          <div style={{ ...s.card, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Create Account</h2>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>We verify your identity using your last name and property ZIP code.</p>
            {err && <div style={s.errMsg}>{err}</div>}
            {ok && <div style={s.okMsg}>{ok}</div>}
            <div style={{ marginBottom: 16 }}><label style={s.label}>Last Name</label><input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name exactly as on your loan"/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Property ZIP Code</label><input style={s.input} value={zip} onChange={e => setZip(e.target.value)} placeholder="ZIP code of your property" maxLength={5}/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Choose a Password</label><input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters"/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Confirm Password</label><input style={s.input} type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Re-enter password"/></div>
            <button onClick={() => { if(password!==confirm){setErr('Passwords do not match');return} handleBorrowerLogin('register') }} disabled={loading} style={{ ...s.btnBlue, opacity: loading ? .7 : 1 }}>{loading ? 'Creating account...' : 'Create Account'}</button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5568' }}>Already have an account? <a onClick={() => setScreen('login')} style={{ color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>Sign in →</a></div>
          </div>
        </div>
      )}

      {screen === 'select' && (
        <div style={{ padding: '40px 36px', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 24 }}>Select Your Property</h2>
          {borrowers.map(b => (
            <button key={b.id} onClick={() => { setSelectedBorrower(b); setScreen('dash'); setActiveTab('payments') }} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '18px 22px', marginBottom: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <strong style={{ display: 'block', fontSize: 15, marginBottom: 3 }}>{b.address}</strong>
              <span style={{ fontSize: 13, color: '#4a5568' }}>{b.entity} · Due {b.due_day} · {b.payment_amount}/mo</span>
            </button>
          ))}
        </div>
      )}

      {screen === 'dash' && selectedBorrower && (
        <div style={{ padding: '32px 36px 72px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #dce4ed' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 3 }}>{selectedBorrower.borrower_name}</h1>
            <div style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, marginBottom: 8 }}>Loan serviced by LWAW Investments, LLC on behalf of <strong>{selectedBorrower.entity}</strong></div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f2fb', color: '#2e6da4', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>📍 {selectedBorrower.address}</span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #dce4ed', flexWrap: 'wrap' }}>
            {[['payments','💳 Payments'],['details','📋 Loan Details'],['history','📜 History'],['insurance','🏠 Insurance & Tax'],['contact','📞 Contact']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, color: activeTab===id ? '#2e6da4' : '#4a5568', cursor: 'pointer', borderBottom: activeTab===id ? '2px solid #2e6da4' : '2px solid transparent', marginBottom: -2, background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab===id ? '#2e6da4' : 'transparent', fontFamily: "'DM Sans', sans-serif" }}>{label}</button>
            ))}
          </div>

          {activeTab === 'payments' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={{ ...s.card, borderLeft: '3px solid #2e6da4' }}>
                  <div style={s.label}>Monthly Payment</div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 34, color: '#2e6da4', fontWeight: 700, margin: '4px 0 5px' }}>{selectedBorrower.payment_amount}</div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Due: {selectedBorrower.due_day}</div>
                </div>
                <div style={s.card}>
                  <div style={s.label}>Escrow Status</div>
                  {selectedBorrower.escrow === 'taxes_and_insurance'
                    ? <><span style={{ display: 'inline-flex', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: 8 }}>✓ Taxes & Insurance Escrowed</span><p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, lineHeight: 1.6 }}>LWAW pays taxes and insurance on the note holder&apos;s behalf.</p></>
                    : <><span style={{ display: 'inline-flex', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', marginBottom: 8 }}>⚠ No Escrow — Your Responsibility</span><p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, lineHeight: 1.6 }}>You are responsible for property taxes (due Jan 31) and insurance.</p></>
                  }
                </div>
              </div>
              <div style={{ ...s.card, borderLeft: '3px solid #1c2026', marginBottom: 20 }}>
                <div style={s.label}>Where to Make Your Payment</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 2 }}>{selectedBorrower.bank}</div>
                <div style={{ fontSize: 12, color: '#4a5568', marginBottom: 14, fontWeight: 300 }}>{selectedBorrower.bank_address}</div>
                <div style={{ background: '#e8f2fb', borderRadius: 6, padding: '10px 14px', display: 'inline-block' }}>
                  <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 2 }}>Account Number</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#1c2026', letterSpacing: 2 }}>{selectedBorrower.account_number}</div>
                </div>
                <p style={{ fontSize: 13, color: '#4a5568', marginTop: 12, fontWeight: 300 }}>After deposit: text slip to 806-680-3556</p>
              </div>
            </>
          )}

          {activeTab === 'details' && loanDetail && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
                {[{label:'Loan Amount',val:fmt(loanDetail.loan_amount),color:'#1c2026'},{label:'Current Balance',val:fmt(loanDetail.current_balance),color:'#2e6da4'},{label:'Principal Paid',val:fmt(principalPaid),color:'#15803d'},{label:'Rate',val:loanDetail.rate+'%',color:'#1c2026'},{label:'Term',val:loanDetail.term_years+' yrs',color:'#1c2026'},{label:'Start Date',val:fmtDate(loanDetail.start_date),color:'#1c2026'}].map((stat,i)=>(
                  <div key={i} style={{...s.card,textAlign:'center'}}><div style={{...s.label,marginBottom:6}}>{stat.label}</div><div style={{fontFamily:"'Playfair Display', serif",fontSize:22,color:stat.color,fontWeight:700}}>{stat.val}</div></div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.label}>Payoff Progress</div>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:13,color:'#4a5568',marginBottom:8}}><span>Start</span><span style={{fontWeight:600,color:'#2e6da4'}}>{pct}% paid off</span><span>Paid in Full</span></div>
                <div style={{height:10,background:'#e2e8f0',borderRadius:5,overflow:'hidden'}}><div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#2e6da4,#22c55e)',borderRadius:5,transition:'width .5s'}}/></div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div style={{background:'#fff',border:'1px solid #dce4ed',borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'16px 22px',borderBottom:'1px solid #dce4ed'}}><h4 style={{fontSize:14,fontWeight:700}}>Payment History</h4></div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f7f9fc'}}>{['#','Date','Total','Principal','Interest','Balance','Source'].map(h=><th key={h} style={{padding:'10px 16px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:h==='#'?'left':'right',borderBottom:'1px solid #dce4ed'}}>{h}</th>)}</tr></thead>
                  <tbody>{payments.map(p=><tr key={p.id} style={{borderBottom:'1px solid #f0f4f8'}}><td style={{padding:'10px 16px',fontSize:13.5,color:'#2e6da4'}}>#{p.payment_num}</td><td style={{padding:'10px 16px',fontSize:13.5,textAlign:'right'}}>{fmtDate(p.payment_date)}</td><td style={{padding:'10px 16px',fontSize:13.5,textAlign:'right',color:'#15803d',fontWeight:600}}>{fmt(p.total_paid)}</td><td style={{padding:'10px 16px',fontSize:13.5,textAlign:'right'}}>{fmt(p.principal)}</td><td style={{padding:'10px 16px',fontSize:13.5,textAlign:'right'}}>{fmt(p.interest)}</td><td style={{padding:'10px 16px',fontSize:13.5,textAlign:'right'}}>{fmt(p.ending_balance)}</td><td style={{padding:'10px 16px',fontSize:11,textAlign:'right',color:p.source==='portal'?'#6d28d9':'#4a5568'}}>{p.source==='portal'?'🔐 Portal':p.source}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'insurance' && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20}}>
              <div style={s.card}>
                <div style={s.label}>Lien Holders — Insurance Policy</div>
                <div style={{background:'#f7f9fc',borderRadius:6,padding:'10px 14px',marginBottom:8,borderLeft:'2px solid #2e6da4'}}><div style={{fontWeight:700,fontSize:13.5}}>{selectedBorrower.entity}</div><div style={{fontSize:12,color:'#4a5568',marginTop:2}}>{selectedBorrower.entity_address}</div></div>
                {selectedBorrower.bank_lien && <div style={{background:'#f7f9fc',borderRadius:6,padding:'10px 14px',borderLeft:'2px solid #2e6da4'}}><div style={{fontWeight:700,fontSize:13.5}}>{selectedBorrower.bank_lien.split(' — ')[0]}</div><div style={{fontSize:12,color:'#4a5568',marginTop:2}}>{selectedBorrower.bank_lien.split(' — ')[1]}</div></div>}
                <div style={{fontSize:12,color:'#4a5568',marginTop:12}}>Send policy to: <strong>lwawinv@gmail.com</strong></div>
              </div>
              <div style={s.card}>
                <div style={s.label}>Property Tax</div>
                <div style={{fontFamily:"'Playfair Display', serif",fontSize:20,marginBottom:6}}>{selectedBorrower.tax_county === 'potter' ? 'Potter County' : 'Randall County'}</div>
                <p style={{fontSize:13.5,color:'#4a5568',fontWeight:300}}>Taxes due <strong>January 31st</strong> each year.</p>
                {selectedBorrower.escrow !== 'taxes_and_insurance' && <a href={selectedBorrower.tax_county==='potter'?'https://www.pottercountytax.com/search':'https://randallcounty.propertytaxpayments.net/search'} target="_blank" rel="noreferrer" style={{display:'inline-block',background:'#1c2026',color:'#fff',padding:'9px 20px',borderRadius:5,textDecoration:'none',fontSize:13,fontWeight:600,marginTop:12}}>Pay Taxes →</a>}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div style={{...s.card,borderLeft:'3px solid #2e6da4'}}>
              <div style={s.label}>Contact Your Servicer — LWAW Investments, LLC</div>
              <div style={{display:'flex',gap:32,flexWrap:'wrap',marginTop:8}}>
                {[{label:'Phone / Text',val:'806-680-3556',href:'tel:8066803556'},{label:'Email',val:'lwawinv@gmail.com',href:'mailto:lwawinv@gmail.com'}].map(c=><div key={c.label}><div style={{fontSize:10,letterSpacing:1,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:4}}>{c.label}</div><a href={c.href} style={{fontSize:16,fontWeight:700,color:'#1c2026',textDecoration:'none'}}>{c.val}</a></div>)}
                <div><div style={{fontSize:10,letterSpacing:1,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:4}}>Office</div><span style={{fontSize:16,fontWeight:700}}>1026 SW 6th, Amarillo TX 79101</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {screen === 'admin' && adminUser && (
        <div style={{padding:'32px 36px 72px',maxWidth:1200,margin:'0 auto'}}>
          <div style={{marginBottom:28,paddingBottom:20,borderBottom:'1px solid #dce4ed'}}>
            <h1 style={{fontFamily:"'Playfair Display', serif",fontSize:26}}>Payment Manager</h1>
            <p style={{fontSize:13,color:'#4a5568',fontWeight:300,marginTop:3}}>All active loans — post payments, track status, flag overdue accounts</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
            {[{label:'Total Active',val:allBorrowers.length,color:'#2e6da4'},{label:'Paid',val:paidCount,color:'#15803d'},{label:'Unpaid',val:allBorrowers.length-paidCount-overdueCount,color:'#4a5568'},{label:'Overdue',val:overdueCount,color:'#b45309'}].map((stat,i)=>(
              <div key={i} style={{background:'#fff',border:'1px solid #dce4ed',borderRadius:8,padding:'16px 20px',textAlign:'center'}}>
                <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:6}}>{stat.label}</div>
                <div style={{fontFamily:"'Playfair Display', serif",fontSize:28,fontWeight:700,color:stat.color}}>{stat.val}</div>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',border:'1px solid #dce4ed',borderRadius:10,overflow:'hidden'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid #dce4ed',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
              <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18}}>All Properties — {monthNames[adminMonth]} {adminYear}</h3>
              <div style={{display:'flex',alignItems:'center',gap:8,fontSize:13}}>
                <label>Month:</label>
                <select value={adminMonth} onChange={e=>setAdminMonth(parseInt(e.target.value))} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'6px 10px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}>{monthNames.map((m,i)=><option key={i} value={i}>{m}</option>)}</select>
                <select value={adminYear} onChange={e=>setAdminYear(parseInt(e.target.value))} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'6px 10px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}><option value={2025}>2025</option><option value={2026}>2026</option></select>
              </div>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f0f4f8'}}>{['Address','Borrower','Payment','Balance','Due','Status','Action'].map(h=><th key={h} style={{padding:'10px 16px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
                <tbody>{allBorrowers.map(b=>{
                  const {status,amount}=getPaymentStatus(b)
                  return (
                    <tr key={b.id} style={{borderBottom:'1px solid #f0f4f8',background:status==='overdue'?'#fff9f9':'transparent'}}>
                      <td style={{padding:'10px 16px',fontWeight:600,fontSize:13}}>{b.address}</td>
                      <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568'}}>{b.borrower_name}</td>
                      <td style={{padding:'10px 16px',fontWeight:600,fontSize:13}}>{b.payment_amount}</td>
                      <td style={{padding:'10px 16px',fontSize:13,color:'#2e6da4'}}>—</td>
                      <td style={{padding:'10px 16px',fontSize:13,textAlign:'center'}}>{b.due_day}</td>
                      <td style={{padding:'10px 16px'}}>
                        {status==='paid'?<span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f0fdf4',color:'#15803d'}}>✓ Paid{amount?' — $'+amount:''}</span>:status==='overdue'?<span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#fff5f5',color:'#b91c1c'}}>⚠ Overdue</span>:<span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f7f9fc',color:'#4a5568'}}>• Unpaid</span>}
                      </td>
                      <td style={{padding:'10px 16px'}}>
                        {status==='paid'?<button disabled style={{background:'#15803d',color:'#fff',border:'none',padding:'6px 14px',borderRadius:4,fontSize:12,fontWeight:600,opacity:.6,cursor:'default',fontFamily:"'DM Sans', sans-serif"}}>✓ Posted</button>:<button onClick={()=>openPaymentModal(b)} style={{background:'#2e6da4',color:'#fff',border:'none',padding:'6px 14px',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Post Payment</button>}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {modalOpen && modalBorrower && (
        <div onClick={e=>{if(e.target===e.currentTarget)setModalOpen(false)}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:'32px 36px',width:'100%',maxWidth:480,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:20,marginBottom:4}}>Post Payment</h3>
            <p style={{fontSize:13,color:'#4a5568',marginBottom:24,fontWeight:300}}>{modalBorrower.borrower_name}<br/>{modalBorrower.address}</p>
            {modalMsg && <div style={modalMsg.startsWith('✓') ? s.okMsg : s.errMsg}>{modalMsg}</div>}
            <div style={{marginBottom:16}}><label style={s.label}>Amount ($)</label><input style={s.input} type="number" step="0.01" value={modalAmount} onChange={e=>setModalAmount(e.target.value)}/></div>
            <div style={{marginBottom:16}}><label style={s.label}>Date</label><input style={s.input} type="date" value={modalDate} onChange={e=>setModalDate(e.target.value)}/></div>
            <div style={{marginBottom:16}}><label style={s.label}>Method</label><select style={s.input} value={modalMethod} onChange={e=>setModalMethod(e.target.value)}><option>Bank Deposit</option><option>Drop Off</option><option>Online (Equity Trust)</option><option>Other</option></select></div>
            <div style={{marginBottom:16}}><label style={s.label}>Notes (optional)</label><textarea style={{...s.input,resize:'vertical',minHeight:70}} value={modalNotes} onChange={e=>setModalNotes(e.target.value)} placeholder="e.g. partial payment..."/></div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setModalOpen(false)} style={{background:'none',border:'1px solid #dce4ed',color:'#4a5568',padding:'11px 20px',borderRadius:5,fontSize:14,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
              <button onClick={submitPayment} disabled={modalLoading} style={{...s.btnGreen,flex:1,opacity:modalLoading?.7:1}}>{modalLoading?'Posting...':'✓ Post Payment & Notify Brad'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
