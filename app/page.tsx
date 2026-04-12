'use client'
import React, { useState } from 'react'
import Link from 'next/link'

const ENTITIES: Record<string, { address: string; signer: string; bank: string; acct: string; bankAddr: string }> = {
  'A2DSTX, LLC':   { address: '1026 SW 6th, Amarillo TX 79101', signer: 'Arick Wray, member', bank: 'Prosperity Bank', acct: '41010620', bankAddr: '3900 S Soncy, Amarillo TX' },
  'A2PI, LLC':     { address: 'P.O. Box 740, Bushland, TX 79012', signer: 'Arick Wray, member', bank: 'Interstate State Bank', acct: '', bankAddr: '5085 S Coulter, Amarillo TX' },
  'A2AF2, LLC':    { address: '1026 SW 6th, Amarillo TX 79101', signer: 'Arick Wray, member', bank: 'A2AF2 Escrow', acct: '', bankAddr: '' },
  'A2BH, LLC':     { address: '1612 S Washington, Amarillo TX 79102', signer: 'Arick Wray, member', bank: 'Interstate State Bank', acct: '31013820', bankAddr: '5085 S Coulter, Amarillo TX' },
  'A2BA Finance, LLC': { address: '1612 S Washington St, TX 79102', signer: 'Arick Wray, member', bank: 'Western Bank', acct: '8127722', bankAddr: '4800 Lexington Square Suite 100, Amarillo TX 79119' },
  'A Squared Property Investments, LLC': { address: '1612 S Washington, Amarillo TX 79102', signer: 'Arick Wray, member', bank: 'Prosperity Bank', acct: '', bankAddr: '' },
  'Equity Trust Company Custodian FBO Arick Wray IRA': { address: '1612 S Washington, Amarillo TX 79102', signer: '', bank: 'Equity Trust (trustetc.com)', acct: '', bankAddr: '' },
}

const s = {
  card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '22px 26px', marginBottom: 20 } as React.CSSProperties,
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 6, display: 'block' as const },
  input: { width: '100%', padding: '9px 13px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#1c2026', outline: 'none', boxSizing: 'border-box' as const },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 } as React.CSSProperties,
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 } as React.CSSProperties,
  btnBlue: { background: '#2e6da4', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  btnGreen: { background: '#15803d', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
  section: { fontSize: 12, fontWeight: 700, color: '#2e6da4', textTransform: 'uppercase' as const, letterSpacing: 1.5, marginBottom: 10, marginTop: 20, paddingBottom: 6, borderBottom: '1px solid #e8f2fb' },
  output: { background: '#f7f9fc', border: '1px solid #dce4ed', borderRadius: 8, padding: '20px 24px', fontFamily: 'monospace', fontSize: 13, lineHeight: '1.8', whiteSpace: 'pre-wrap' as const, marginTop: 16 },
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 14 }}><label style={s.label}>{label}</label>{children}</div>
}

function DocOrderForm() {
  const [form, setForm] = useState<any>({ lenderEntity: 'A2DSTX, LLC', hasPrepay: false, taxesEscrowed: false, insuranceEscrowed: false })
  const [output, setOutput] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const onEntityChange = (entity: string) => {
    const cfg = ENTITIES[entity]
    if (cfg) { set('lenderEntity', entity); set('lenderAddress', cfg.address); set('lenderSigner', cfg.signer); set('bank', cfg.bank); set('accountNum', cfg.acct); set('bankAddress', cfg.bankAddr) }
  }

  const generate = () => {
    const f = form
    const escrowNote = (f.taxesEscrowed || f.insuranceEscrowed) ? '\n- TAXES AND INSURANCE WILL BE ESCROWED ON THIS LOAN.' : ''
    const prepayNote = !f.hasPrepay ? '\n- NO PREPAYMENT LANGUAGE' : (f.prepayTerms ? `\n- Prepay: ${f.prepayTerms}` : '')
    setOutput(`Docs Needed: Note, Deed of Trust, Warranty Deed & Non-Homestead\n\nLender: ${f.lenderEntity || ''}\n     By: ${f.lenderSigner || ''}\n     ${f.lenderAddress || ''}\n\nBorrower: ${f.borrowerName || ''}\n${f.borrowerAddress || ''}\n\nNOTE TERMS:\nNote Amount: $${f.noteAmount || ''}\nP&I of $${f.piPayment || ''} based on a ${f.termYears || '30'} year amortization.${f.firstPayment ? ` First payment ${f.firstPayment}` : ''}\nInterest Rate: ${f.interestRate || ''}% interest fixed${prepayNote}${escrowNote}\nNote Date: ${f.noteDate || ''}\nMaturity Date: ${f.maturityDate || ''}\n\nCollateral: FLDT ${f.collateral || ''} — See Attached Title Commitment\n\nPayment Instructions:\n- Go to ${f.bank || ''} (${f.bankAddress || ''}) and deposit into account # ${f.accountNum || ''} under ${f.lenderEntity || ''}.\n- Please text a copy of deposit slip to 806-680-3556.\n\nSee attached Title Commitment`)
  }

  return (
    <div>
      <div style={s.section}>Lender</div>
      <div style={s.grid2}>
        <Field label="Entity"><select value={form.lenderEntity} onChange={e => onEntityChange(e.target.value)} style={s.input}>{Object.keys(ENTITIES).map(e => <option key={e}>{e}</option>)}</select></Field>
        <Field label="Signer"><input style={s.input} value={form.lenderSigner || ''} onChange={e => set('lenderSigner', e.target.value)} /></Field>
      </div>
      <Field label="Lender Address"><input style={s.input} value={form.lenderAddress || ''} onChange={e => set('lenderAddress', e.target.value)} /></Field>
      <div style={s.section}>Borrower</div>
      <Field label="Full Legal Name(s)"><input style={s.input} value={form.borrowerName || ''} onChange={e => set('borrowerName', e.target.value)} placeholder="First Last and First Last" /></Field>
      <Field label="Mailing Address"><input style={s.input} value={form.borrowerAddress || ''} onChange={e => set('borrowerAddress', e.target.value)} /></Field>
      <div style={s.section}>Note Terms</div>
      <div style={s.grid3}>
        <Field label="Note Amount ($)"><input style={s.input} value={form.noteAmount || ''} onChange={e => set('noteAmount', e.target.value)} placeholder="165,000" /></Field>
        <Field label="P&I Payment ($)"><input style={s.input} value={form.piPayment || ''} onChange={e => set('piPayment', e.target.value)} placeholder="1,557.71" /></Field>
        <Field label="Interest Rate (%)"><input style={s.input} value={form.interestRate || ''} onChange={e => set('interestRate', e.target.value)} placeholder="10.5" /></Field>
      </div>
      <div style={s.grid3}>
        <Field label="Term (years)"><input style={s.input} value={form.termYears || '30'} onChange={e => set('termYears', e.target.value)} /></Field>
        <Field label="Note Date"><input style={s.input} type="date" value={form.noteDate || ''} onChange={e => set('noteDate', e.target.value)} /></Field>
        <Field label="First Payment Date"><input style={s.input} type="date" value={form.firstPayment || ''} onChange={e => set('firstPayment', e.target.value)} /></Field>
      </div>
      <Field label="Collateral Property Address"><input style={s.input} value={form.collateral || ''} onChange={e => set('collateral', e.target.value)} /></Field>
      <div style={{ display: 'flex', gap: 24, marginBottom: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={!form.hasPrepay} onChange={e => set('hasPrepay', !e.target.checked)} /> No Prepayment Language</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={form.taxesEscrowed} onChange={e => set('taxesEscrowed', e.target.checked)} /> Escrow Taxes</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}><input type="checkbox" checked={form.insuranceEscrowed} onChange={e => set('insuranceEscrowed', e.target.checked)} /> Escrow Insurance</label>
      </div>
      <div style={s.section}>Payment Instructions</div>
      <div style={s.grid3}>
        <Field label="Bank"><input style={s.input} value={form.bank || ''} onChange={e => set('bank', e.target.value)} /></Field>
        <Field label="Account Number"><input style={s.input} value={form.accountNum || ''} onChange={e => set('accountNum', e.target.value)} /></Field>
        <Field label="Bank Address"><input style={s.input} value={form.bankAddress || ''} onChange={e => set('bankAddress', e.target.value)} /></Field>
      </div>
      <button onClick={generate} style={s.btnBlue}>Generate Doc Order</button>
      {output && <div><div style={s.output}>{output}</div><button onClick={() => navigator.clipboard.writeText(output)} style={{ ...s.btnGreen, marginTop: 10 }}>Copy to Clipboard</button></div>}
    </div>
  )
}

function ClosingFeesCalc() {
  const [form, setForm] = useState<any>({ txFee: '500', attyFee: '555', attyPages: '13', titleCompany: 'Texas Legacy Land Title' })
  const [output, setOutput] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const generate = () => {
    const f = form
    const taxAmt = parseFloat(f.taxAmount || '0'), taxMo = parseInt(f.taxMonths || '0')
    const insAmt = parseFloat(f.insuranceAmount || '0'), insMo = parseInt(f.insuranceMonths || '0')
    const taxCollect = Math.round(taxAmt/12*taxMo*100)/100
    const insCollect = Math.round(insAmt/12*insMo*100)/100
    const totalEscrow = Math.round((taxCollect+insCollect)*100)/100
    const prepaid = parseFloat(f.prepaidInterest || '0')
    const txFee = parseFloat(f.txFee || '0'), attyFee = parseFloat(f.attyFee || '0')
    const total = totalEscrow + prepaid + txFee + attyFee
    setOutput(`${f.entity || '[ENTITY]'} - Closing Fees & Instructions\n\nAttn: Brad Stuteville\nLWAW Investments, LLC — 1026 SW 6th Amarillo, TX 79101\n\nBorrower: ${f.borrowerName || ''}\nProperty: ${f.address || ''}\nLoan Amount: $${f.loanAmount || 'TBD'} – Final TBD\n\nPrepaid Interest: $${prepaid.toFixed(2)}\n\n${taxAmt>0||insAmt>0?`ESCROW:\nEST Taxes – $${taxAmt.toFixed(2)} x ${taxMo} months = $${taxCollect.toFixed(2)}\nInsurance – $${insAmt.toFixed(2)} x ${insMo} months = $${insCollect.toFixed(2)}\n- Total Escrow Collections = $${totalEscrow.toFixed(2)}\n`:'No escrow on this loan.\n'}\nFEES:\n$${txFee.toFixed(2)} – Transaction fees to LWAW Investments, LLC\n$${attyFee.toFixed(2)} – Attorney fees – payable to Morgan Williamson\n${f.attyPages||'13'} page DOT\n\nTOTAL DUE AT CLOSING: $${total.toFixed(2)}\n\nTitle Company: ${f.titleCompany||''}\n\nThanks!\nBrad Stuteville`)
  }

  return (
    <div>
      <div style={s.section}>Deal Info</div>
      <div style={s.grid2}>
        <Field label="Entity"><select style={s.input} value={form.entity||''} onChange={e => set('entity', e.target.value)}><option value="">Select entity...</option>{Object.keys(ENTITIES).map(e => <option key={e}>{e}</option>)}</select></Field>
        <Field label="Loan Amount"><input style={s.input} value={form.loanAmount||''} onChange={e => set('loanAmount', e.target.value)} placeholder="165,000" /></Field>
      </div>
      <Field label="Borrower Name"><input style={s.input} value={form.borrowerName||''} onChange={e => set('borrowerName', e.target.value)} /></Field>
      <Field label="Property Address"><input style={s.input} value={form.address||''} onChange={e => set('address', e.target.value)} /></Field>
      <div style={s.section}>Escrow (leave blank if none)</div>
      <div style={s.grid2}>
        <Field label="Annual Tax Amount ($)"><input style={s.input} value={form.taxAmount||''} onChange={e => set('taxAmount', e.target.value)} placeholder="2,329.05" /></Field>
        <Field label="Tax Months to Collect"><input style={s.input} value={form.taxMonths||''} onChange={e => set('taxMonths', e.target.value)} placeholder="10" /></Field>
      </div>
      <div style={s.grid2}>
        <Field label="Annual Insurance ($)"><input style={s.input} value={form.insuranceAmount||''} onChange={e => set('insuranceAmount', e.target.value)} placeholder="2,706.16" /></Field>
        <Field label="Insurance Months to Collect"><input style={s.input} value={form.insuranceMonths||''} onChange={e => set('insuranceMonths', e.target.value)} placeholder="14" /></Field>
      </div>
      <div style={s.section}>Fees</div>
      <div style={s.grid3}>
        <Field label="Prepaid Interest ($)"><input style={s.input} value={form.prepaidInterest||'0'} onChange={e => set('prepaidInterest', e.target.value)} /></Field>
        <Field label="LWAW Tx Fee ($)"><input style={s.input} value={form.txFee||'500'} onChange={e => set('txFee', e.target.value)} /></Field>
        <Field label="Attorney Fee ($)"><input style={s.input} value={form.attyFee||'555'} onChange={e => set('attyFee', e.target.value)} /></Field>
      </div>
      <div style={s.grid2}>
        <Field label="DOT Pages"><input style={s.input} value={form.attyPages||'13'} onChange={e => set('attyPages', e.target.value)} /></Field>
        <Field label="Title Company"><input style={s.input} value={form.titleCompany||''} onChange={e => set('titleCompany', e.target.value)} /></Field>
      </div>
      <button onClick={generate} style={s.btnBlue}>Calculate & Generate</button>
      {output && <div><div style={s.output}>{output}</div><button onClick={() => navigator.clipboard.writeText(output)} style={{ ...s.btnGreen, marginTop: 10 }}>Copy</button></div>}
    </div>
  )
}

const CHECKLIST = [
  { id:1, phase:'Pre-Contract', text:'Get signed purchase contract' },
  { id:2, phase:'Pre-Contract', text:'Let buyer know we need docs ASAP' },
  { id:3, phase:'Buyer Onboarding', text:'Reply with intro — get ID + phone + email' },
  { id:4, phase:'Buyer Onboarding', text:'Add Social Security / Tax ID to 1098 tracking' },
  { id:5, phase:'Buyer Onboarding', text:'Request original Note/DT from lender if applicable' },
  { id:6, phase:'Title & Taxes', text:'Request Tax Certs from Title Company + Title Commitment' },
  { id:7, phase:'Title & Taxes', text:'Create new folder; save contact + contact info (IDs)' },
  { id:8, phase:'Spreadsheet', text:'Add to spreadsheet Summary (Master Note Tracking)' },
  { id:9, phase:'Spreadsheet', text:'Add new tab with Amortization Schedule' },
  { id:10, phase:'Spreadsheet', text:'Add to Escrow Tracking (if applicable)' },
  { id:11, phase:'Insurance', text:'Get insurance quote from buyer' },
  { id:12, phase:'Insurance', text:'Verify amount by reaching out to agent — send invoice to Title Co' },
  { id:13, phase:'Closing Prep', text:'Send fees to Title Company' },
  { id:14, phase:'Closing Prep', text:'Send formal intro email requesting insurance ASAP' },
  { id:15, phase:'Closing Prep', text:'Wait on Title Co to send final loan amount from Settlement Statement' },
  { id:16, phase:'Closing Prep', text:'Request Title Commitment with final loan $ from Title Co' },
  { id:17, phase:'Documents', text:'Prepare Doc Order form — communicate date docs needed' },
  { id:18, phase:'Documents', text:'Receive loan docs — review & make sure it matches' },
  { id:19, phase:'Documents', text:'Send loan docs to Title Company' },
  { id:20, phase:'Documents', text:'Save copy in folder' },
  { id:21, phase:'Post-Close', text:'Send payment intro letter to borrower (email)' },
  { id:22, phase:'Post-Close', text:'Send T1 new borrower intro text via Quo' },
  { id:23, phase:'Post-Close', text:'Send T10 insurance request text via Quo' },
  { id:24, phase:'Post-Close', text:'Add borrower to lwawinv.com portal (Supabase)' },
  { id:25, phase:'Post-Close', text:'Update loss payee with insurance agent' },
]

function NewDealChecklist() {
const [checked, setChecked] = useState<number[]>([])
  const [dealName, setDealName] = useState('')
const toggle = (id: number) => setChecked(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
const phaseSet: Record<string, boolean> = {}
  CHECKLIST.forEach(i => { phaseSet[i.phase] = true })
  const phases = Object.keys(phaseSet)
  const pct = Math.round(checked.length/CHECKLIST.length*100)
  const phaseColors: Record<string,string> = { 'Pre-Contract':'#2e6da4','Buyer Onboarding':'#15803d','Title & Taxes':'#b45309','Spreadsheet':'#7c3aed','Insurance':'#f97316','Closing Prep':'#dc2626','Documents':'#0891b2','Post-Close':'#15803d' }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <label style={s.label}>Deal / Property Name</label>
        <input style={{ ...s.input, maxWidth: 420 }} value={dealName} onChange={e => setDealName(e.target.value)} placeholder="e.g. 1601 Hillcrest — Garcia/Deleon" />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom: 6 }}>
        <span style={{ fontSize:13, color:'#4a5568' }}>{checked.length} of {CHECKLIST.length} complete</span>
        <span style={{ fontSize:13, color:'#4a5568', fontFamily:'monospace' }}>{pct}%</span>
      </div>
      <div style={{ height:8, background:'#e2e8f0', borderRadius:4, overflow:'hidden', marginBottom:24 }}>
        <div style={{ height:'100%', width:pct+'%', background:'linear-gradient(90deg,#2e6da4,#22c55e)', transition:'width .3s', borderRadius:4 }} />
      </div>
      {phases.map(phase => {
        const items = CHECKLIST.filter(i => i.phase === phase)
        const done = items.filter(i => checked.includes(i.id)).length
        return (
          <div key={phase} style={{ background:'#fff', border:'1px solid #dce4ed', borderLeft:`3px solid ${phaseColors[phase]||'#2e6da4'}`, borderRadius:8, marginBottom:14, overflow:'hidden' }}>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid #f0f4f8', display:'flex', justifyContent:'space-between', background:'#f7f9fc' }}>
              <span style={{ fontWeight:700, fontSize:13, color:phaseColors[phase]||'#2e6da4' }}>{phase}</span>
              <span style={{ fontSize:11, color:'#8b949e', fontFamily:'monospace' }}>{done}/{items.length}</span>
            </div>
            {items.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 16px', cursor:'pointer', borderBottom:'1px solid #f9fafb', background:checked.includes(item.id)?'#f0fdf4':'transparent' }}>
                <div style={{ width:18, height:18, borderRadius:3, border:`2px solid ${checked.includes(item.id)?(phaseColors[phase]||'#2e6da4'):'#d1d5db'}`, background:checked.includes(item.id)?(phaseColors[phase]||'#2e6da4'):'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  {checked.includes(item.id) && <span style={{ color:'#fff', fontSize:11, fontWeight:900 }}>✓</span>}
                </div>
                <span style={{ fontSize:13, color:checked.includes(item.id)?'#9ca3af':'#1c2026', textDecoration:checked.includes(item.id)?'line-through':'none' }}>{item.text}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function ToolsPage() {
  const [activeTab, setActiveTab] = useState('docorder')
  const tabs = [{ id:'docorder', label:'Doc Order Form' },{ id:'closingfees', label:'Closing Fees Calculator' },{ id:'checklist', label:'New Deal Checklist' }]
  return (
    <div style={{ minHeight:'100vh', background:'#f7f9fc', fontFamily:"'DM Sans', sans-serif" }}>
      <nav style={{ background:'#0d1117', borderBottom:'1px solid #30363d', padding:'0 28px', display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
        <span style={{ fontFamily:"'Playfair Display', serif", fontSize:16, color:'#f0f6fc', fontWeight:700 }}>LWAW Deal Tools</span>
        <div style={{ display:'flex', gap:16 }}>
          <Link href="/dashboard" style={{ fontSize:12, color:'#8b949e', textDecoration:'none' }}>Dashboard</Link>
          <Link href="/portal" style={{ fontSize:12, color:'#8b949e', textDecoration:'none' }}>Borrower Portal</Link>
          <Link href="/" style={{ fontSize:12, color:'#8b949e', textDecoration:'none' }}>Public Site</Link>
        </div>
      </nav>
      <div style={{ maxWidth:900, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex', gap:2, marginBottom:28, borderBottom:'2px solid #dce4ed' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding:'10px 20px', fontSize:14, fontWeight:600, color:activeTab===t.id?'#2e6da4':'#4a5568', cursor:'pointer', background:'none', border:'none', borderBottom:activeTab===t.id?'2px solid #2e6da4':'2px solid transparent', marginBottom:-2, fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }}>{t.label}</button>
          ))}
        </div>
        <div style={{ background:'#fff', border:'1px solid #dce4ed', borderRadius:10, padding:'22px 26px' }}>
          {activeTab === 'docorder' && <DocOrderForm />}
          {activeTab === 'closingfees' && <ClosingFeesCalc />}
          {activeTab === 'checklist' && <NewDealChecklist />}
        </div>
      </div>
    </div>
  )
}
