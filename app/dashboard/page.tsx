'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

type AdminUser = { id: string; username: string; full_name: string; role: string }
type Borrower = {
  id: string; address: string; borrower_name: string; entity: string;
  payment_amount: string; due_day: string; escrow: string; active: boolean;
  bank: string; account_number: string; bank_address: string; payment_method: string;
  entity_address: string; bank_lien: string | null; tax_county: string; zip: string; last_name: string;
  ins_expiry: string | null; ins_follow_up_date: string | null; ins_follow_up_notes: string | null;
  first_payment_date: string | null;
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
type EscrowAccount = { borrower_id: string; address: string; entity: string; bank: string; balance: number; as_of_date: string }
type TodoItem = { id: string; category_id: string; category_label: string; category_accent: string; item_id: number; text: string; done: boolean }
type DocRecord = { id: string; name: string; category: string; borrower_id: string | null; notes: string | null; created_at: string; file_url: string | null }

const fmt = (n: number | null | undefined) => n != null ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtDate = (d: string) => { if (!d) return '—'; const p = d.split('T')[0].split('-'); return p[1] + '/' + p[2] + '/' + p[0] }
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const ENTITIES = ['All Entities','A2DSTX, LLC','A2PI, LLC','A2AF2, LLC','A2BH, LLC','A2BA Finance, LLC','A Squared Property Investments, LLC','Equity Trust Company Custodian FBO Arick Wray IRA']


// ── AMORTIZATION TABLE ────────────────────────────────────────────────────────
function DashAmortizationTable({ borrowerId }: { borrowerId: string }) {
  const [rows, setRows] = React.useState<any[]>([])
  const [loaded, setLoaded] = React.useState(false)
  const [showAll, setShowAll] = React.useState(false)
  const f2 = (n: number | null) => n != null ? '$' + n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) : '—'
  React.useEffect(() => {
    import('@/lib/supabase').then(({supabase}) => {
      supabase.from('amortization_schedule').select('*').eq('borrower_id', borrowerId).order('payment_num')
        .then(({data}) => { if (data) setRows(data); setLoaded(true) })
    })
  }, [borrowerId])
  if (!loaded) return <div style={{padding:20,fontSize:13,color:'#4a5568'}}>Loading...</div>
  if (rows.length === 0) return <div style={{padding:20,fontSize:13,color:'#4a5568',fontStyle:'italic'}}>Schedule not yet loaded.</div>
  const confirmed = rows.filter((r:any) => r.is_confirmed)
  const projected = rows.filter((r:any) => !r.is_confirmed)
  const displayed = showAll ? [...confirmed, ...projected] : [...confirmed, ...projected.slice(0, Math.max(0, 12 - confirmed.length))]
  return (
    <div>
      <div style={{overflowX:'auto',maxHeight:380,overflowY:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead style={{position:'sticky',top:0}}>
            <tr style={{background:'#f7f9fc'}}>
              {['#','Date','Total','Principal','Interest','Balance','Status'].map(h => (
                <th key={h} style={{padding:'8px 12px',fontSize:10,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:h==='#'?'center':'right',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayed.map((r:any) => {
              const isConf = r.is_confirmed && r.source === 'confirmed'
              const isSumm = r.is_confirmed && r.source === 'summary'
              const bg = isConf ? '#f0fdf4' : isSumm ? '#d1fae5' : '#fff'
              const color = isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af'
              return (
                <tr key={r.payment_num} style={{borderBottom:'1px solid #f0f4f8',background:bg}}>
                  <td style={{padding:'7px 12px',textAlign:'center',color:'#2e6da4',fontWeight:600,fontSize:12}}>{r.payment_num}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontFamily:'monospace',fontSize:11,color}}>{r.payment_date?.substring(0,10)||'—'}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontSize:12,fontWeight:r.is_confirmed?600:400,color}}>{f2(r.total_payment)}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontSize:12,color}}>{f2(r.principal)}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontSize:12,color}}>{f2(r.interest)}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontSize:12,fontWeight:r.is_confirmed?700:400,color:isConf?'#15803d':isSumm?'#065f46':'#6b7280'}}>{f2(r.ending_balance)}</td>
                  <td style={{padding:'7px 12px',textAlign:'right',fontSize:11,color}}>{isConf?'✓ Confirmed':isSumm?'✓ Summary':'Projected'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{padding:'10px 18px',borderTop:'1px solid #f0f4f8'}}>
        <button onClick={() => setShowAll(!showAll)} style={{background:'none',border:'1px solid #dce4ed',borderRadius:5,padding:'6px 14px',fontSize:12,cursor:'pointer',color:'#2e6da4',fontFamily:"'DM Sans', sans-serif"}}>
          {showAll ? 'Show Less' : `Show All ${rows.length} Rows`}
        </button>
      </div>
    </div>
  )
}

// ── TOOLS (embedded from /tools) ──────────────────────────────────────────────
const TOOL_ENTITIES: Record<string, { address: string; signer: string; bank: string; acct: string; bankAddr: string }> = {
  'A2DSTX, LLC':   { address: '1026 SW 6th, Amarillo TX 79101', signer: 'Arick Wray, member', bank: 'Prosperity Bank', acct: '41010620', bankAddr: '3900 S Soncy, Amarillo TX' },
  'A2PI, LLC':     { address: 'P.O. Box 740, Bushland, TX 79012', signer: 'Arick Wray, member', bank: 'Interstate State Bank', acct: '', bankAddr: '5085 S Coulter, Amarillo TX' },
  'A2AF2, LLC':    { address: '1026 SW 6th, Amarillo TX 79101', signer: 'Arick Wray, member', bank: 'A2AF2 Escrow', acct: '', bankAddr: '' },
  'A2BH, LLC':     { address: '1612 S Washington, Amarillo TX 79102', signer: 'Arick Wray, member', bank: 'Interstate State Bank', acct: '31013820', bankAddr: '5085 S Coulter, Amarillo TX' },
  'A2BA Finance, LLC': { address: '1612 S Washington St, TX 79102', signer: 'Arick Wray, member', bank: 'Western Bank', acct: '8127722', bankAddr: '4800 Lexington Square Suite 100, Amarillo TX 79119' },
  'A Squared Property Investments, LLC': { address: '1612 S Washington, Amarillo TX 79102', signer: 'Arick Wray, member', bank: 'Prosperity Bank', acct: '', bankAddr: '' },
  'Equity Trust Company Custodian FBO Arick Wray IRA': { address: '1612 S Washington, Amarillo TX 79102', signer: '', bank: 'Equity Trust (trustetc.com)', acct: '', bankAddr: '' },
}
const ts = {
  label: { fontSize:10,letterSpacing:2,textTransform:'uppercase' as const,color:'#4a5568',fontWeight:600,marginBottom:6,display:'block' as const },
  input: { width:'100%',padding:'9px 13px',border:'1px solid #dce4ed',borderRadius:5,fontSize:14,fontFamily:"'DM Sans', sans-serif",color:'#1c2026',outline:'none',boxSizing:'border-box' as const },
  grid2: { display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:14 } as React.CSSProperties,
  grid3: { display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14 } as React.CSSProperties,
  btnBlue: { background:'#2e6da4',color:'#fff',border:'none',padding:'11px 24px',borderRadius:6,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif" } as React.CSSProperties,
  btnGreen: { background:'#15803d',color:'#fff',border:'none',padding:'11px 24px',borderRadius:6,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif" } as React.CSSProperties,
  section: { fontSize:12,fontWeight:700,color:'#2e6da4',textTransform:'uppercase' as const,letterSpacing:1.5,marginBottom:10,marginTop:20,paddingBottom:6,borderBottom:'1px solid #e8f2fb' },
  output: { background:'#f7f9fc',border:'1px solid #dce4ed',borderRadius:8,padding:'20px 24px',fontFamily:'monospace',fontSize:13,lineHeight:'1.8',whiteSpace:'pre-wrap' as const,marginTop:16 },
}
function TField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{marginBottom:14}}><label style={ts.label}>{label}</label>{children}</div>
}
function DocOrderForm() {
  const [form, setForm] = useState<any>({ lenderEntity:'A2DSTX, LLC', hasPrepay:false, taxesEscrowed:false, insuranceEscrowed:false })
  const [output, setOutput] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
  const onEntityChange = (entity: string) => {
    const cfg = TOOL_ENTITIES[entity]
    if (cfg) { set('lenderEntity', entity); set('lenderAddress', cfg.address); set('lenderSigner', cfg.signer); set('bank', cfg.bank); set('accountNum', cfg.acct); set('bankAddress', cfg.bankAddr) }
  }
  React.useEffect(() => { onEntityChange('A2DSTX, LLC') }, [])
  const generate = () => {
    const f = form
    const escrowNote = (f.taxesEscrowed || f.insuranceEscrowed) ? '\n- TAXES AND INSURANCE WILL BE ESCROWED ON THIS LOAN.' : ''
    const prepayNote = !f.hasPrepay ? '\n- NO PREPAYMENT LANGUAGE' : (f.prepayTerms ? `\n- Prepay: ${f.prepayTerms}` : '')
    setOutput(`Docs Needed: Note, Deed of Trust, Warranty Deed & Non-Homestead\n\nLender: ${f.lenderEntity||''}\n     By: ${f.lenderSigner||''}\n     ${f.lenderAddress||''}\n\nBorrower: ${f.borrowerName||''}\n${f.borrowerAddress||''}\n\nNOTE TERMS:\nNote Amount: $${f.noteAmount||''}\nP&I of $${f.piPayment||''} based on a ${f.termYears||'30'} year amortization.${f.firstPayment?` First payment ${f.firstPayment}`:''}\nInterest Rate: ${f.interestRate||''}% interest fixed${prepayNote}${escrowNote}\nNote Date: ${f.noteDate||''}\nMaturity Date: ${f.maturityDate||''}\n\nCollateral: FLDT ${f.collateral||''} — See Attached Title Commitment\n\nPayment Instructions:\n- Go to ${f.bank||''} (${f.bankAddress||''}) and deposit into account # ${f.accountNum||''} under ${f.lenderEntity||''}.\n- Please text a copy of deposit slip to 806-680-3556.\n\nSee attached Title Commitment`)
  }
  return (
    <div>
      <div style={ts.section}>Lender</div>
      <div style={ts.grid2}>
        <TField label="Entity"><select value={form.lenderEntity} onChange={e => onEntityChange(e.target.value)} style={ts.input}>{Object.keys(TOOL_ENTITIES).map(e => <option key={e}>{e}</option>)}</select></TField>
        <TField label="Signer"><input style={ts.input} value={form.lenderSigner||''} onChange={e => set('lenderSigner', e.target.value)} /></TField>
      </div>
      <TField label="Lender Address"><input style={ts.input} value={form.lenderAddress||''} onChange={e => set('lenderAddress', e.target.value)} /></TField>
      <div style={ts.section}>Borrower</div>
      <TField label="Full Legal Name(s)"><input style={ts.input} value={form.borrowerName||''} onChange={e => set('borrowerName', e.target.value)} placeholder="First Last and First Last" /></TField>
      <TField label="Mailing Address"><input style={ts.input} value={form.borrowerAddress||''} onChange={e => set('borrowerAddress', e.target.value)} /></TField>
      <div style={ts.section}>Note Terms</div>
      <div style={ts.grid3}>
        <TField label="Note Amount ($)"><input style={ts.input} value={form.noteAmount||''} onChange={e => set('noteAmount', e.target.value)} placeholder="165,000" /></TField>
        <TField label="P&I Payment ($)"><input style={ts.input} value={form.piPayment||''} onChange={e => set('piPayment', e.target.value)} placeholder="1,557.71" /></TField>
        <TField label="Interest Rate (%)"><input style={ts.input} value={form.interestRate||''} onChange={e => set('interestRate', e.target.value)} placeholder="10.5" /></TField>
      </div>
      <div style={ts.grid2}>
        <TField label="Term (years)"><input style={ts.input} value={form.termYears||'30'} onChange={e => set('termYears', e.target.value)} /></TField>
        <TField label="First Payment Date"><input style={ts.input} type="date" value={form.firstPayment||''} onChange={e => set('firstPayment', e.target.value)} /></TField>
      </div>
      <div style={ts.grid2}>
        <TField label="Note Date"><input style={ts.input} type="date" value={form.noteDate||''} onChange={e => set('noteDate', e.target.value)} /></TField>
        <TField label="Maturity Date"><input style={ts.input} type="date" value={form.maturityDate||''} onChange={e => set('maturityDate', e.target.value)} /></TField>
      </div>
      <TField label="Collateral Property Address"><input style={ts.input} value={form.collateral||''} onChange={e => set('collateral', e.target.value)} /></TField>
      <div style={{display:'flex',gap:24,marginBottom:14}}>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14}}><input type="checkbox" checked={!form.hasPrepay} onChange={e => set('hasPrepay', !e.target.checked)} /> No Prepayment Language</label>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14}}><input type="checkbox" checked={form.taxesEscrowed} onChange={e => set('taxesEscrowed', e.target.checked)} /> Escrow Taxes</label>
        <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14}}><input type="checkbox" checked={form.insuranceEscrowed} onChange={e => set('insuranceEscrowed', e.target.checked)} /> Escrow Insurance</label>
      </div>
      <div style={ts.section}>Payment Instructions</div>
      <div style={ts.grid3}>
        <TField label="Bank"><input style={ts.input} value={form.bank||''} onChange={e => set('bank', e.target.value)} /></TField>
        <TField label="Account Number"><input style={ts.input} value={form.accountNum||''} onChange={e => set('accountNum', e.target.value)} /></TField>
        <TField label="Bank Address"><input style={ts.input} value={form.bankAddress||''} onChange={e => set('bankAddress', e.target.value)} /></TField>
      </div>
      <button onClick={generate} style={ts.btnBlue}>Generate Doc Order</button>
      {output && <div><div style={ts.output}>{output}</div><button onClick={() => navigator.clipboard.writeText(output)} style={{...ts.btnGreen,marginTop:10}}>Copy to Clipboard</button></div>}
    </div>
  )
}
function ClosingFeesCalc() {
  const [form, setForm] = useState<any>({ txFee:'500', attyFee:'555', attyPages:'13', titleCompany:'Texas Legacy Land Title' })
  const [output, setOutput] = useState('')
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))
  const generate = () => {
    const f = form
    const taxAmt = parseFloat(f.taxAmount||'0'), taxMo = parseInt(f.taxMonths||'0')
    const insAmt = parseFloat(f.insuranceAmount||'0'), insMo = parseInt(f.insuranceMonths||'0')
    const taxCollect = Math.round(taxAmt/12*taxMo*100)/100
    const insCollect = Math.round(insAmt/12*insMo*100)/100
    const totalEscrow = Math.round((taxCollect+insCollect)*100)/100
    const prepaid = parseFloat(f.prepaidInterest||'0')
    const txFee = parseFloat(f.txFee||'0'), attyFee = parseFloat(f.attyFee||'0')
    const total = totalEscrow + prepaid + txFee + attyFee
    setOutput(`${f.entity||'[ENTITY]'} - Closing Fees & Instructions\n\nAttn: Brad Stuteville\nLWAW Investments, LLC — 1026 SW 6th Amarillo, TX 79101\n\nBorrower: ${f.borrowerName||''}\nProperty: ${f.address||''}\nLoan Amount: $${f.loanAmount||'TBD'} – Final TBD\n\nPrepaid Interest: $${prepaid.toFixed(2)}\n\n${taxAmt>0||insAmt>0?`ESCROW:\nEST Taxes – $${taxAmt.toFixed(2)} x ${taxMo} months = $${taxCollect.toFixed(2)}\nInsurance – $${insAmt.toFixed(2)} x ${insMo} months = $${insCollect.toFixed(2)}\n- Total Escrow Collections = $${totalEscrow.toFixed(2)}\n`:'No escrow on this loan.\n'}\nFEES:\n$${txFee.toFixed(2)} – Transaction fees to LWAW Investments, LLC\n$${attyFee.toFixed(2)} – Attorney fees – payable to Morgan Williamson\n${f.attyPages||'13'} page DOT\n\nTOTAL DUE AT CLOSING: $${total.toFixed(2)}\n\nTitle Company: ${f.titleCompany||''}\n\nThanks!\nBrad Stuteville`)
  }
  return (
    <div>
      <div style={ts.section}>Deal Info</div>
      <div style={ts.grid2}>
        <TField label="Entity"><select style={ts.input} value={form.entity||''} onChange={e => set('entity', e.target.value)}><option value="">Select entity...</option>{Object.keys(TOOL_ENTITIES).map(e => <option key={e}>{e}</option>)}</select></TField>
        <TField label="Loan Amount"><input style={ts.input} value={form.loanAmount||''} onChange={e => set('loanAmount', e.target.value)} placeholder="165,000" /></TField>
      </div>
      <TField label="Borrower Name"><input style={ts.input} value={form.borrowerName||''} onChange={e => set('borrowerName', e.target.value)} /></TField>
      <TField label="Property Address"><input style={ts.input} value={form.address||''} onChange={e => set('address', e.target.value)} /></TField>
      <div style={ts.section}>Escrow (leave blank if none)</div>
      <div style={ts.grid2}>
        <TField label="Annual Tax Amount ($)"><input style={ts.input} value={form.taxAmount||''} onChange={e => set('taxAmount', e.target.value)} placeholder="2,329.05" /></TField>
        <TField label="Tax Months to Collect"><input style={ts.input} value={form.taxMonths||''} onChange={e => set('taxMonths', e.target.value)} placeholder="10" /></TField>
      </div>
      <div style={ts.grid2}>
        <TField label="Annual Insurance ($)"><input style={ts.input} value={form.insuranceAmount||''} onChange={e => set('insuranceAmount', e.target.value)} placeholder="2,706.16" /></TField>
        <TField label="Insurance Months to Collect"><input style={ts.input} value={form.insuranceMonths||''} onChange={e => set('insuranceMonths', e.target.value)} placeholder="14" /></TField>
      </div>
      <div style={ts.section}>Fees</div>
      <div style={ts.grid3}>
        <TField label="Prepaid Interest ($)"><input style={ts.input} value={form.prepaidInterest||'0'} onChange={e => set('prepaidInterest', e.target.value)} /></TField>
        <TField label="LWAW Tx Fee ($)"><input style={ts.input} value={form.txFee||'500'} onChange={e => set('txFee', e.target.value)} /></TField>
        <TField label="Attorney Fee ($)"><input style={ts.input} value={form.attyFee||'555'} onChange={e => set('attyFee', e.target.value)} /></TField>
      </div>
      <div style={ts.grid2}>
        <TField label="DOT Pages"><input style={ts.input} value={form.attyPages||'13'} onChange={e => set('attyPages', e.target.value)} /></TField>
        <TField label="Title Company"><input style={ts.input} value={form.titleCompany||''} onChange={e => set('titleCompany', e.target.value)} /></TField>
      </div>
      <button onClick={generate} style={ts.btnBlue}>Calculate & Generate</button>
      {output && <div><div style={ts.output}>{output}</div><button onClick={() => navigator.clipboard.writeText(output)} style={{...ts.btnGreen,marginTop:10}}>Copy</button></div>}
    </div>
  )
}
const CHECKLIST = [
  {id:1,phase:'Pre-Contract',text:'Get signed purchase contract'},
  {id:2,phase:'Pre-Contract',text:'Let buyer know we need docs ASAP'},
  {id:3,phase:'Buyer Onboarding',text:'Reply with intro — get ID + phone + email'},
  {id:4,phase:'Buyer Onboarding',text:'Add Social Security / Tax ID to 1098 tracking'},
  {id:5,phase:'Buyer Onboarding',text:'Request original Note/DT from lender if applicable'},
  {id:6,phase:'Title & Taxes',text:'Request Tax Certs from Title Company + Title Commitment'},
  {id:7,phase:'Title & Taxes',text:'Create new folder; save contact + contact info (IDs)'},
  {id:8,phase:'Spreadsheet',text:'Add to spreadsheet Summary (Master Note Tracking)'},
  {id:9,phase:'Spreadsheet',text:'Add new tab with Amortization Schedule'},
  {id:10,phase:'Spreadsheet',text:'Add to Escrow Tracking (if applicable)'},
  {id:11,phase:'Insurance',text:'Get insurance quote from buyer'},
  {id:12,phase:'Insurance',text:'Verify amount by reaching out to agent — send invoice to Title Co'},
  {id:13,phase:'Closing Prep',text:'Send fees to Title Company'},
  {id:14,phase:'Closing Prep',text:'Send formal intro email requesting insurance ASAP'},
  {id:15,phase:'Closing Prep',text:'Wait on Title Co to send final loan amount from Settlement Statement'},
  {id:16,phase:'Closing Prep',text:'Request Title Commitment with final loan $ from Title Co'},
  {id:17,phase:'Documents',text:'Prepare Doc Order form — communicate date docs needed'},
  {id:18,phase:'Documents',text:'Receive loan docs — review & make sure it matches'},
  {id:19,phase:'Documents',text:'Send loan docs to Title Company'},
  {id:20,phase:'Documents',text:'Save copy in folder'},
  {id:21,phase:'Post-Close',text:'Send payment intro letter to borrower (email)'},
  {id:22,phase:'Post-Close',text:'Send T1 new borrower intro text via Quo'},
  {id:23,phase:'Post-Close',text:'Send T10 insurance request text via Quo'},
  {id:24,phase:'Post-Close',text:'Add borrower to lwawinv.com portal (Supabase)'},
  {id:25,phase:'Post-Close',text:'Update loss payee with insurance agent'},
]
const PHASE_COLORS: Record<string,string> = {'Pre-Contract':'#2e6da4','Buyer Onboarding':'#15803d','Title & Taxes':'#b45309','Spreadsheet':'#7c3aed','Insurance':'#f97316','Closing Prep':'#dc2626','Documents':'#0891b2','Post-Close':'#15803d'}
function NewDealChecklist() {
  const [checked, setChecked] = useState<number[]>([])
  const [dealName, setDealName] = useState('')
  const toggle = (id: number) => setChecked(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const phases = Array.from(new Set(CHECKLIST.map(i => i.phase)))
  const pct = Math.round(checked.length/CHECKLIST.length*100)
  return (
    <div>
      <div style={{marginBottom:20}}>
        <label style={ts.label}>Deal / Property Name</label>
        <input style={{...ts.input,maxWidth:420}} value={dealName} onChange={e => setDealName(e.target.value)} placeholder="e.g. 1601 Hillcrest — Garcia/Deleon" />
      </div>
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
        <span style={{fontSize:13,color:'#4a5568'}}>{checked.length} of {CHECKLIST.length} complete</span>
        <span style={{fontSize:13,color:'#4a5568',fontFamily:'monospace'}}>{pct}%</span>
      </div>
      <div style={{height:8,background:'#e2e8f0',borderRadius:4,overflow:'hidden',marginBottom:24}}>
        <div style={{height:'100%',width:pct+'%',background:'linear-gradient(90deg,#2e6da4,#22c55e)',transition:'width .3s',borderRadius:4}} />
      </div>
      {phases.map(phase => {
        const items = CHECKLIST.filter(i => i.phase === phase)
        const done = items.filter(i => checked.includes(i.id)).length
        return (
          <div key={phase} style={{background:'#fff',border:'1px solid #dce4ed',borderLeft:`3px solid ${PHASE_COLORS[phase]||'#2e6da4'}`,borderRadius:8,marginBottom:14,overflow:'hidden'}}>
            <div style={{padding:'10px 16px',borderBottom:'1px solid #f0f4f8',display:'flex',justifyContent:'space-between',background:'#f7f9fc'}}>
              <span style={{fontWeight:700,fontSize:13,color:PHASE_COLORS[phase]||'#2e6da4'}}>{phase}</span>
              <span style={{fontSize:11,color:'#8b949e',fontFamily:'monospace'}}>{done}/{items.length}</span>
            </div>
            {items.map(item => (
              <div key={item.id} onClick={() => toggle(item.id)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',cursor:'pointer',borderBottom:'1px solid #f9fafb',background:checked.includes(item.id)?'#f0fdf4':'transparent'}}>
                <div style={{width:18,height:18,borderRadius:3,border:`2px solid ${checked.includes(item.id)?(PHASE_COLORS[phase]||'#2e6da4'):'#d1d5db'}`,background:checked.includes(item.id)?(PHASE_COLORS[phase]||'#2e6da4'):'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  {checked.includes(item.id) && <span style={{color:'#fff',fontSize:11,fontWeight:900}}>✓</span>}
                </div>
                <span style={{fontSize:13,color:checked.includes(item.id)?'#9ca3af':'#1c2026',textDecoration:checked.includes(item.id)?'line-through':'none'}}>{item.text}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function DashboardPage() {
  const [screen, setScreen] = useState<'login'|'dash'>('login')
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [paymentLog, setPaymentLog] = useState<PaymentLog[]>([])
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [escrowAccounts, setEscrowAccounts] = useState<EscrowAccount[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [documents, setDocuments] = useState<DocRecord[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null)
  const [drillLoan, setDrillLoan] = useState<LoanDetail | null>(null)

  const [month, setMonth] = useState(new Date().getMonth())
  const [year, setYear] = useState(new Date().getFullYear())
  const [entityFilter, setEntityFilter] = useState('All Entities')
  const [sortCol, setSortCol] = useState('due_day')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [search, setSearch] = useState('')
  const [insSearch, setInsSearch] = useState('')
  const [insSortCol, setInsSortCol] = useState('ins_expiry')
  const [insSortDir, setInsSortDir] = useState<'asc'|'desc'>('asc')
  const [insStatusFilter, setInsStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalBorrower, setModalBorrower] = useState<Borrower | null>(null)
  const [modalAmount, setModalAmount] = useState('')
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0])
  const [modalMethod, setModalMethod] = useState('Bank Deposit')
  const [modalNotes, setModalNotes] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalMsg, setModalMsg] = useState('')

  const [docFile, setDocFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docCategory, setDocCategory] = useState('general')
  const [docBorrowerId, setDocBorrowerId] = useState('')
  const [docNotes, setDocNotes] = useState('')
  const [docUploading, setDocUploading] = useState(false)
  const [docMsg, setDocMsg] = useState('')

  const [toolTab, setToolTab] = useState('docorder')

  useEffect(() => { if (adminUser) loadData() }, [adminUser, month, year])

  async function loadData() {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: bs }, { data: logs }, { data: pmts }, { data: esc }, { data: td }, { data: docs }] = await Promise.all([
      supabase.from('borrowers').select('*').eq('active', true).order('address'),
      supabase.from('payment_log').select('*').order('created_at', { ascending: false }),
      supabase.from('payment_history').select('*').order('payment_date', { ascending: false }),
      supabase.from('escrow_accounts').select('*').order('entity'),
      supabase.from('todo_items').select('*').order('category_id').order('item_id'),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
    ])
    if (bs) setBorrowers(bs)
    if (logs) setPaymentLog(logs)
    if (pmts) setAllPayments(pmts)
    if (esc) setEscrowAccounts(esc)
    if (td) setTodos(td)
    if (docs) setDocuments(docs)
  }

  async function handleLogin() {
    setErr(''); setLoading(true)
    try {
      const res = await fetch('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Invalid credentials'); return }
      setAdminUser(data.admin); setScreen('dash')
    } catch { setErr('Connection error.') }
    finally { setLoading(false) }
  }

  async function drillInto(b: Borrower) {
    setSelectedBorrower(b); setActiveTab('drill')
    const { supabase } = await import('@/lib/supabase')
    const { data: ld } = await supabase.from('loan_details').select('*').eq('borrower_id', b.id).single()
    if (ld) setDrillLoan(ld)
  }

  async function submitPayment() {
    if (!modalBorrower) return
    setModalLoading(true); setModalMsg('')
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrower_id: modalBorrower.id, amount: parseFloat(modalAmount), payment_date: modalDate, method: modalMethod, notes: modalNotes, posted_by: adminUser?.full_name || 'Admin' }) })
      const data = await res.json()
      if (!res.ok) { setModalMsg('Error: ' + (data.error || 'Failed')); return }
      setModalMsg('✓ Payment posted!')
      setTimeout(() => { setModalOpen(false); loadData() }, 1500)
    } catch { setModalMsg('Connection error.') }
    finally { setModalLoading(false) }
  }

  async function toggleTodo(t: TodoItem) {
    const { supabase } = await import('@/lib/supabase')
    await supabase.from('todo_items').update({ done: !t.done, updated_at: new Date().toISOString() }).eq('id', t.id)
    setTodos(prev => prev.map(x => x.id === t.id ? { ...x, done: !x.done } : x))
  }

  async function uploadDocument() {
    if (!docName) { setDocMsg('Please enter a document name.'); return }
    setDocUploading(true); setDocMsg('')
    try {
      const { supabase } = await import('@/lib/supabase')
      let file_url = null
      if (docFile) {
        const ext = docFile.name.split('.').pop()
        const path = `documents/${Date.now()}-${docName.replace(/[^a-z0-9]/gi,'_')}.${ext}`
        const { error } = await supabase.storage.from('documents').upload(path, docFile)
        if (!error) {
          const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)
          file_url = urlData.publicUrl
        }
      }
      await supabase.from('documents').insert({ name: docName, category: docCategory, borrower_id: docBorrowerId || null, notes: docNotes || null, file_url, uploaded_by: adminUser?.full_name || 'brad' })
      setDocMsg('✓ Document saved!'); setDocName(''); setDocNotes(''); setDocFile(null); setDocBorrowerId(''); loadData()
    } catch { setDocMsg('Error saving document.') }
    finally { setDocUploading(false) }
  }

  // ── COMPUTED ──────────────────────────────────────────────────────────────
  const now = new Date()
  const monthStart = new Date(year, month, 1).toISOString().split('T')[0]
  const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0]
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`
  const mtdLogs = paymentLog.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
  const ytdLogs = paymentLog.filter(p => p.payment_date >= yearStart && p.payment_date <= yearEnd)
  const mtdTotal = mtdLogs.reduce((s, p) => s + p.amount, 0)
  const ytdTotal = ytdLogs.reduce((s, p) => s + p.amount, 0)
  const mtdPayments = allPayments.filter(p => p.payment_date >= monthStart && p.payment_date <= monthEnd)
  const ytdPayments = allPayments.filter(p => p.payment_date >= yearStart && p.payment_date <= yearEnd)
  const mtdPrincipal = mtdPayments.reduce((s, p) => s + (p.principal || 0), 0)
  const mtdInterest = mtdPayments.reduce((s, p) => s + (p.interest || 0), 0)
  const ytdPrincipal = ytdPayments.reduce((s, p) => s + (p.principal || 0), 0)
  const ytdInterest = ytdPayments.reduce((s, p) => s + (p.interest || 0), 0)

  const entityTotals = ENTITIES.slice(1).map(entity => {
    const ids = borrowers.filter(b => b.entity === entity).map(b => b.id)
    const mtd = mtdLogs.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    const ytd = ytdLogs.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + p.amount, 0)
    const mtdP = mtdPayments.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + (p.principal || 0), 0)
    const mtdI = mtdPayments.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + (p.interest || 0), 0)
    const ytdP = ytdPayments.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + (p.principal || 0), 0)
    const ytdI = ytdPayments.filter(p => ids.includes(p.borrower_id)).reduce((s, p) => s + (p.interest || 0), 0)
    return { entity: entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA (Arick)'), mtd, ytd, mtdP, mtdI, ytdP, ytdI }
  }).filter(e => e.mtd > 0 || e.ytd > 0)

  const escrowByEntity: Record<string, number> = {}
  escrowAccounts.forEach(e => { escrowByEntity[e.entity] = (escrowByEntity[e.entity] || 0) + e.balance })
  const totalEscrow = escrowAccounts.reduce((s, e) => s + e.balance, 0)

  function getPaymentStatus(b: Borrower) {
    const firstPay = b.first_payment_date ? new Date(b.first_payment_date) : null
    const viewDate = new Date(year, month, 1)
    if (firstPay && viewDate < firstPay) return { status: 'future', amount: null }
    const logged = paymentLog.find(p => { const d = new Date(p.payment_date); return p.borrower_id === b.id && d.getFullYear() === year && d.getMonth() === month })
    if (logged) return { status: 'paid', amount: logged.amount }
    const fromAmort = allPayments.find(p => { const d = new Date(p.payment_date); return p.borrower_id === b.id && d.getFullYear() === year && d.getMonth() === month })
    if (fromAmort) return { status: 'paid', amount: fromAmort.total_paid }
    const dueNum = parseInt(b.due_day)
    const isPast = now.getFullYear() > year || (now.getFullYear() === year && now.getMonth() > month) ||
      (now.getFullYear() === year && now.getMonth() === month && now.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }

  const activeBorrowers = borrowers.filter(b => entityFilter === 'All Entities' || b.entity === entityFilter)
    .filter(b => !search || b.address.toLowerCase().includes(search.toLowerCase()) || b.borrower_name.toLowerCase().includes(search.toLowerCase()))

  const paidCount = activeBorrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = activeBorrowers.filter(b => getPaymentStatus(b).status === 'overdue').length

  const filteredBorrowers = [...activeBorrowers].sort((a, b) => {
    let av: any, bv: any
    if (sortCol === 'due_day') { av = parseInt(a.due_day); bv = parseInt(b.due_day) }
    else if (sortCol === 'payment_amount') { av = parseFloat(a.payment_amount.replace(/[$,]/g,'')); bv = parseFloat(b.payment_amount.replace(/[$,]/g,'')) }
    else if (sortCol === 'status') { av = getPaymentStatus(a).status; bv = getPaymentStatus(b).status }
    else { av = (a as any)[sortCol]; bv = (b as any)[sortCol] }
    if (av < bv) return sortDir === 'asc' ? -1 : 1
    if (av > bv) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  // Insurance computed
  const today = new Date()
  const insData = borrowers.map(b => {
    const expDate = b.ins_expiry ? new Date(b.ins_expiry) : null
    const daysLeft = expDate ? Math.ceil((expDate.getTime() - today.getTime()) / (1000*60*60*24)) : null
    const status = !expDate ? 'unknown' : daysLeft! < 0 ? 'expired' : daysLeft! <= 30 ? 'critical' : daysLeft! <= 90 ? 'warning' : 'ok'
    return { ...b, expDate, daysLeft, insStatus: status }
  })
  const filteredIns = insData
    .filter(b => insStatusFilter === 'all' || b.insStatus === insStatusFilter)
    .filter(b => !insSearch || b.address.toLowerCase().includes(insSearch.toLowerCase()) || b.borrower_name.toLowerCase().includes(insSearch.toLowerCase()) || b.entity.toLowerCase().includes(insSearch.toLowerCase()))
    .sort((a, b) => {
      let av: any, bv: any
      if (insSortCol === 'ins_expiry') { av = a.daysLeft ?? 99999; bv = b.daysLeft ?? 99999 }
      else if (insSortCol === 'address') { av = a.address; bv = b.address }
      else if (insSortCol === 'entity') { av = a.entity; bv = b.entity }
      else if (insSortCol === 'escrow') { av = a.escrow; bv = b.escrow }
      else { av = (a as any)[insSortCol]; bv = (b as any)[insSortCol] }
      if (av < bv) return insSortDir === 'asc' ? -1 : 1
      if (av > bv) return insSortDir === 'asc' ? 1 : -1
      return 0
    })

  const todoCategories = Array.from(new Set(todos.map(t => t.category_id))).map(cid => ({
    id: cid, label: todos.find(t => t.category_id === cid)?.category_label || cid,
    accent: todos.find(t => t.category_id === cid)?.category_accent || '#2e6da4',
    items: todos.filter(t => t.category_id === cid)
  }))
  const totalDone = todos.filter(t => t.done).length
  const totalItems = todos.length

  function SortHeader({ col, label, onSort, cur, dir }: { col: string; label: string; onSort: (c: string) => void; cur: string; dir: string }) {
    const active = cur === col
    return (
      <th onClick={() => onSort(col)} style={{padding:'10px 12px',fontSize:11,textTransform:'uppercase',color:active?'#2e6da4':'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap',cursor:'pointer',background:active?'#f0f7ff':'#f0f4f8',userSelect:'none'}}>
        {label} {active ? (dir === 'asc' ? '↑' : '↓') : ''}
      </th>
    )
  }

  const s = {
    card: { background:'#fff', border:'1px solid #dce4ed', borderRadius:10, padding:'18px 22px' },
    label: { fontSize:10, letterSpacing:2, textTransform:'uppercase' as const, color:'#4a5568', fontWeight:600, marginBottom:6 },
    input: { width:'100%', padding:'10px 14px', border:'1px solid #dce4ed', borderRadius:5, fontSize:14, fontFamily:"'DM Sans', sans-serif", color:'#1c2026', background:'#fff', outline:'none' },
    tab: (active: boolean): React.CSSProperties => ({ padding:'10px 18px', fontSize:13, fontWeight:600, color:active?'#2e6da4':'#4a5568', cursor:'pointer', borderBottom:active?'2px solid #2e6da4':'2px solid transparent', marginBottom:-2, background:'none', border:'none', fontFamily:"'DM Sans', sans-serif", whiteSpace:'nowrap' }),
  }

  if (screen === 'login') return (
    <div style={{minHeight:'100vh',background:'#0d1117',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'DM Sans', sans-serif"}}>
      <div style={{background:'#161b22',border:'1px solid #30363d',borderRadius:12,padding:'40px 44px',width:'100%',maxWidth:400,boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:28}}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#f0f6fc"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#f0f6fc"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#f0f6fc"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <div><div style={{fontFamily:"'Playfair Display', serif",fontSize:16,color:'#f0f6fc',fontWeight:700}}>LWAW Investments</div><div style={{fontSize:10,color:'#2e6da4',letterSpacing:'1.5px',textTransform:'uppercase'}}>Staff Dashboard</div></div>
        </div>
        <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:22,color:'#f0f6fc',marginBottom:6}}>Sign In</h2>
        <p style={{fontSize:13,color:'#8b949e',marginBottom:24}}>Restricted access — authorized staff only</p>
        {err && <div style={{background:'#3d1515',color:'#f87171',border:'1px solid #7f1d1d',borderRadius:5,padding:'10px 14px',fontSize:13,marginBottom:16}}>{err}</div>}
        <div style={{marginBottom:14}}><label style={{...s.label,color:'#8b949e'}}>Username</label><input style={{...s.input,background:'#0d1117',border:'1px solid #30363d',color:'#f0f6fc'}} value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" autoComplete="off"/></div>
        <div style={{marginBottom:20}}><label style={{...s.label,color:'#8b949e'}}>Password</label><input style={{...s.input,background:'#0d1117',border:'1px solid #30363d',color:'#f0f6fc'}} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" onKeyDown={e => e.key === 'Enter' && handleLogin()}/></div>
        <button onClick={handleLogin} disabled={loading} style={{width:'100%',background:'#2e6da4',color:'#fff',border:'none',padding:'12px',borderRadius:6,fontSize:15,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",opacity:loading ? 0.7 : 1}}>{loading ? 'Signing in...' : 'Sign In'}</button>
        <div style={{marginTop:20,textAlign:'center'}}><Link href="/" style={{fontSize:12,color:'#8b949e',textDecoration:'none'}}>← Back to lwawinv.com</Link></div>
      </div>
    </div>
  )

  const tabList = [
    ['overview','Overview'],
    ['payments','Payments'],
    adminUser?.role === 'superadmin' ? ['insurance',`Insurance`] : null,
    adminUser?.role === 'superadmin' ? ['escrow','Escrow'] : null,
    adminUser?.role === 'superadmin' ? ['tools','Tools'] : null,
    adminUser?.role === 'superadmin' ? ['documents','Documents'] : null,
    adminUser?.role === 'superadmin' ? ['todo',`To-Do (${totalDone}/${totalItems})`] : null,
  ].filter(Boolean) as string[][]

  const insStatusStyle: Record<string,{bg:string;color:string;label:string}> = {
    expired:  {bg:'#fff5f5',color:'#b91c1c',label:'EXPIRED'},
    critical: {bg:'#fffbeb',color:'#b45309',label:'CRITICAL'},
    warning:  {bg:'#eff6ff',color:'#1d4ed8',label:'WARNING'},
    ok:       {bg:'transparent',color:'#15803d',label:'OK'},
    unknown:  {bg:'#f9fafb',color:'#6b7280',label:'N/A'},
  }

  return (
    <div style={{minHeight:'100vh',background:'#f7f9fc',fontFamily:"'DM Sans', sans-serif"}}>
      <nav style={{background:'#0d1117',borderBottom:'1px solid #30363d',padding:'0 28px',display:'flex',alignItems:'center',justifyContent:'space-between',height:60}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#f0f6fc"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#f0f6fc"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#f0f6fc"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <span style={{fontFamily:"'Playfair Display', serif",fontSize:15,color:'#f0f6fc',fontWeight:700}}>LWAW Staff Dashboard</span>
          <span style={{fontSize:11,color:'#2e6da4',background:'#1d3450',padding:'3px 10px',borderRadius:12,fontWeight:600}}>{adminUser?.full_name}</span>
        </div>
        <div style={{display:'flex',gap:16,alignItems:'center'}}>
          <Link href="/portal" style={{fontSize:12,color:'#8b949e',textDecoration:'none'}}>Borrower Portal</Link>
          <Link href="/" style={{fontSize:12,color:'#8b949e',textDecoration:'none'}}>Public Site</Link>
          <button onClick={() => { setAdminUser(null); setScreen('login') }} style={{background:'none',border:'1px solid #30363d',padding:'5px 12px',borderRadius:4,fontSize:12,cursor:'pointer',color:'#8b949e',fontFamily:"'DM Sans', sans-serif"}}>Log Out</button>
        </div>
      </nav>

      <div style={{padding:'24px 28px',maxWidth:1400,margin:'0 auto'}}>
        <div style={{display:'flex',gap:2,marginBottom:24,borderBottom:'2px solid #dce4ed',overflowX:'auto'}}>
          {tabList.map(([id, label]) => (
            <button key={id} onClick={() => { setActiveTab(id); setSelectedBorrower(null) }} style={s.tab(activeTab === id)}>{label}</button>
          ))}
          {selectedBorrower && <button onClick={() => setActiveTab('drill')} style={s.tab(activeTab === 'drill')}>🔍 {selectedBorrower.address.split(',')[0]}</button>}
        </div>

        {/* ── OVERVIEW + PAYMENTS filter row ── */}
        {(activeTab === 'overview' || activeTab === 'payments') && (
          <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap',alignItems:'center'}}>
            <select value={month} onChange={e => setMonth(parseInt(e.target.value))} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 12px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}>{MONTHS.map((m,i) => <option key={i} value={i}>{m}</option>)}</select>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 12px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}><option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option></select>
            <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 12px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}>{ENTITIES.map(e => <option key={e}>{e}</option>)}</select>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search address or borrower..." style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 14px',fontSize:13,outline:'none',fontFamily:"'DM Sans', sans-serif",width:240}} />
          </div>
        )}

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))',gap:14,marginBottom:22}}>
              {[
                {label:'MTD Collected',val:fmt(mtdTotal),color:'#15803d',bg:'#f0fdf4'},
                {label:'YTD Collected',val:fmt(ytdTotal),color:'#2e6da4',bg:'#e8f2fb'},
                {label:'MTD Principal',val:fmt(mtdPrincipal),color:'#7c3aed',bg:'#f5f3ff'},
                {label:'MTD Interest',val:fmt(mtdInterest),color:'#b45309',bg:'#fffbeb'},
                {label:'YTD Principal',val:fmt(ytdPrincipal),color:'#7c3aed',bg:'#f5f3ff'},
                {label:'YTD Interest',val:fmt(ytdInterest),color:'#b45309',bg:'#fffbeb'},
                {label:'Paid This Month',val:paidCount,color:'#15803d',bg:'#f0fdf4'},
                {label:'Overdue',val:overdueCount,color:'#b91c1c',bg:'#fff5f5'},
                {label:'Total Escrow',val:fmt(totalEscrow),color:'#0891b2',bg:'#f0f9ff'},
              ].map((stat,i) => (
                <div key={i} style={{background:stat.bg,border:'1px solid #dce4ed',borderRadius:10,padding:'16px 18px',textAlign:'center'}}>
                  <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:6}}>{stat.label}</div>
                  <div style={{fontFamily:"'Playfair Display', serif",fontSize:24,fontWeight:700,color:stat.color}}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Entity breakdown */}
            {entityTotals.length > 0 && (
              <div style={{...s.card,marginBottom:22,overflow:'hidden',padding:0}}>
                <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',fontWeight:700,fontSize:15}}>MTD / YTD by Entity — Principal & Interest Breakdown</div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse'}}>
                    <thead><tr style={{background:'#f0f4f8'}}>
                      {['Entity','MTD Total','MTD Principal','MTD Interest','YTD Total','YTD Principal','YTD Interest'].map(h => (
                        <th key={h} style={{padding:'10px 14px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:h==='Entity'?'left':'right',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {entityTotals.map((e,i) => (
                        <tr key={i} style={{borderBottom:'1px solid #f0f4f8'}}>
                          <td style={{padding:'10px 14px',fontWeight:600,fontSize:13}}>{e.entity}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#15803d',fontWeight:600}}>{fmt(e.mtd)}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#7c3aed'}}>{fmt(e.mtdP)}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#b45309'}}>{fmt(e.mtdI)}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#2e6da4',fontWeight:600}}>{fmt(e.ytd)}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#7c3aed'}}>{fmt(e.ytdP)}</td>
                          <td style={{padding:'10px 14px',textAlign:'right',fontSize:13,color:'#b45309'}}>{fmt(e.ytdI)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Borrower list */}
            <div style={{...s.card,overflow:'hidden',padding:0}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:700,fontSize:15}}>All Loans — {MONTHS[month]} {year}</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f0f4f8'}}>
                    {[['due_day','Due'],['address','Property'],['entity','Entity'],['payment_amount','Payment'],['status','Status'],['','Action']].map(([col,label]) => (
                      col ? <th key={col} onClick={() => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc')} }} style={{padding:'10px 12px',fontSize:11,textTransform:'uppercase',color:sortCol===col?'#2e6da4':'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap',cursor:'pointer',background:sortCol===col?'#f0f7ff':'#f0f4f8'}}>{label} {sortCol===col?(sortDir==='asc'?'↑':'↓'):''}</th>
                      : <th key="action" style={{padding:'10px 12px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed'}}>Action</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredBorrowers.map(b => {
                      const { status, amount } = getPaymentStatus(b)
                      if (status === 'future') return null
                      return (
                        <tr key={b.id} style={{borderBottom:'1px solid #f0f4f8',background:status==='overdue'?'#fff9f9':'transparent'}}>
                          <td style={{padding:'10px 12px',fontSize:13,textAlign:'center',fontWeight:600,color:'#2e6da4'}}>{b.due_day.replace(/\D/g,'')}</td>
                          <td style={{padding:'10px 12px',fontWeight:600,fontSize:13,cursor:'pointer',color:'#1c2026',textDecoration:'underline'}} onClick={() => drillInto(b)}>{b.address.split(',')[0]}</td>
                          <td style={{padding:'10px 12px',fontSize:11,color:'#4a5568'}}>{b.entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA')}</td>
                          <td style={{padding:'10px 12px',fontWeight:600,fontSize:13}}>{b.payment_amount}</td>
                          <td style={{padding:'10px 12px'}}>
                            {status==='paid' ? <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f0fdf4',color:'#15803d'}}>✓ Paid{amount?' — $'+amount.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):''}</span>
                            : status==='overdue' ? <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#fff5f5',color:'#b91c1c'}}>⚠ Overdue</span>
                            : <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f7f9fc',color:'#4a5568'}}>• Unpaid</span>}
                          </td>
                          <td style={{padding:'10px 12px'}}>
                            <button onClick={() => { setModalBorrower(b); setModalAmount(b.payment_amount.replace(/[$,]/g,'')); setModalOpen(true); setModalMsg('') }} style={{background:'#2e6da4',color:'#fff',border:'none',padding:'6px 14px',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Post</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── PAYMENTS TAB ── */}
        {activeTab === 'payments' && (
          <div style={{...s.card,overflow:'hidden',padding:0}}>
            <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12}}>
              <span style={{fontWeight:700,fontSize:15}}>All Properties — {MONTHS[month]} {year}</span>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f0f4f8'}}>
                  {[['due_day','Due'],['address','Property'],['borrower_name','Borrower'],['entity','Entity'],['payment_amount','Payment'],['status','Status'],['','Action']].map(([col,label]) => (
                    col ? <th key={col} onClick={() => { if(sortCol===col) setSortDir(d=>d==='asc'?'desc':'asc'); else{setSortCol(col);setSortDir('asc')} }} style={{padding:'10px 12px',fontSize:11,textTransform:'uppercase',color:sortCol===col?'#2e6da4':'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap',cursor:'pointer',background:sortCol===col?'#f0f7ff':'#f0f4f8'}}>{label} {sortCol===col?(sortDir==='asc'?'↑':'↓'):''}</th>
                    : <th key="action" style={{padding:'10px 12px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed'}}>Action</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredBorrowers.map(b => {
                    const { status, amount } = getPaymentStatus(b)
                    if (status === 'future') return null
                    return (
                      <tr key={b.id} style={{borderBottom:'1px solid #f0f4f8',background:status==='overdue'?'#fff9f9':'transparent'}}>
                        <td style={{padding:'10px 12px',fontSize:13,textAlign:'center',fontWeight:600,color:'#2e6da4'}}>{b.due_day.replace(/\D/g,'')}</td>
                        <td style={{padding:'10px 12px',fontWeight:600,fontSize:13,cursor:'pointer',color:'#1c2026',textDecoration:'underline'}} onClick={() => drillInto(b)}>{b.address.split(',')[0]}</td>
                        <td style={{padding:'10px 12px',fontSize:12,color:'#4a5568'}}>{b.borrower_name.split(' ').slice(0,3).join(' ')}</td>
                        <td style={{padding:'10px 12px',fontSize:11,color:'#4a5568'}}>{b.entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA')}</td>
                        <td style={{padding:'10px 12px',fontWeight:600,fontSize:13}}>{b.payment_amount}</td>
                        <td style={{padding:'10px 12px'}}>
                          {status==='paid' ? <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f0fdf4',color:'#15803d'}}>✓ Paid</span>
                          : status==='overdue' ? <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#fff5f5',color:'#b91c1c'}}>⚠ Overdue</span>
                          : <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:12,fontSize:12,fontWeight:600,background:'#f7f9fc',color:'#4a5568'}}>• Unpaid</span>}
                        </td>
                        <td style={{padding:'10px 12px'}}>
                          {status === 'paid'
                            ? <button disabled style={{background:'#15803d',color:'#fff',border:'none',padding:'6px 14px',borderRadius:4,fontSize:12,fontWeight:600,opacity:.6,cursor:'default',fontFamily:"'DM Sans', sans-serif"}}>✓ Posted</button>
                            : <button onClick={() => { setModalBorrower(b); setModalAmount(b.payment_amount.replace(/[$,]/g,'')); setModalOpen(true); setModalMsg('') }} style={{background:'#2e6da4',color:'#fff',border:'none',padding:'6px 14px',borderRadius:4,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Post Payment</button>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── DRILL TAB ── */}
        {activeTab === 'drill' && selectedBorrower && (
          <div>
            <div style={{marginBottom:20,paddingBottom:16,borderBottom:'1px solid #dce4ed',display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
              <div>
                <h2 style={{fontFamily:"'Playfair Display', serif",fontSize:22,marginBottom:4}}>{selectedBorrower.address}</h2>
                <p style={{fontSize:13,color:'#4a5568',fontWeight:300}}>{selectedBorrower.borrower_name} · {selectedBorrower.entity}</p>
              </div>
              <button onClick={() => setActiveTab('payments')} style={{background:'none',border:'1px solid #dce4ed',padding:'7px 16px',borderRadius:5,fontSize:13,cursor:'pointer',color:'#4a5568',fontFamily:"'DM Sans', sans-serif"}}>← Back</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:14,marginBottom:20}}>
              {[
                {label:'Monthly Payment',val:selectedBorrower.payment_amount,color:'#2e6da4'},
                {label:'Due Day',val:selectedBorrower.due_day,color:'#1c2026'},
                {label:'Escrow',val:selectedBorrower.escrow === 'taxes_and_insurance' ? 'Yes' : selectedBorrower.escrow || 'No',color:'#15803d'},
                {label:'Current Balance',val:drillLoan ? fmt(drillLoan.current_balance) : '—',color:'#2e6da4'},
                {label:'Interest Rate',val:drillLoan ? (drillLoan.rate < 1 ? (drillLoan.rate*100).toFixed(2)+'%' : drillLoan.rate.toFixed(2)+'%') : '—',color:'#b45309'},
                {label:'Loan Term',val:drillLoan ? drillLoan.term_years+' yrs' : '—',color:'#1c2026'},
                {label:'Payments Made',val:drillLoan ? drillLoan.payments_made : '—',color:'#15803d'},
                {label:'Interest Paid',val:drillLoan ? fmt(drillLoan.total_interest_paid) : '—',color:'#b45309'},
                {label:'Insurance Expires',val:selectedBorrower.ins_expiry ? fmtDate(selectedBorrower.ins_expiry) : 'Unknown',color:selectedBorrower.ins_expiry && new Date(selectedBorrower.ins_expiry) < new Date() ? '#b91c1c' : '#15803d'},
              ].map((stat,i) => (
                <div key={i} style={{...s.card,textAlign:'center'}}>
                  <div style={{...s.label,marginBottom:6}}>{stat.label}</div>
                  <div style={{fontFamily:"'Playfair Display', serif",fontSize:20,fontWeight:700,color:stat.color}}>{stat.val}</div>
                </div>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20}}>
              <div style={s.card}>
                <div style={s.label}>Bank / Payment</div>
                <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{selectedBorrower.bank}</div>
                <div style={{fontSize:12,color:'#4a5568',marginBottom:8}}>{selectedBorrower.bank_address}</div>
                <div style={{background:'#e8f2fb',borderRadius:5,padding:'8px 12px',display:'inline-block',fontWeight:700,fontSize:15,letterSpacing:2}}>{selectedBorrower.account_number}</div>
              </div>
              <div style={s.card}>
                <div style={s.label}>Lien Holders</div>
                <div style={{fontWeight:600,fontSize:13,marginBottom:4}}>{selectedBorrower.entity}</div>
                <div style={{fontSize:12,color:'#4a5568',marginBottom:8}}>{selectedBorrower.entity_address}</div>
                {selectedBorrower.bank_lien && <><div style={{fontWeight:600,fontSize:13,marginBottom:2}}>{selectedBorrower.bank_lien.split(' — ')[0]}</div><div style={{fontSize:12,color:'#4a5568'}}>{selectedBorrower.bank_lien.split(' — ')[1]}</div></>}
              </div>
            </div>
            {selectedBorrower.ins_follow_up_notes && (
              <div style={{background:'#fffbeb',border:'1px solid #fcd34d',borderRadius:8,padding:'14px 18px',marginBottom:20}}>
                <div style={{fontSize:11,letterSpacing:1.5,textTransform:'uppercase',color:'#b45309',fontWeight:700,marginBottom:6}}>Insurance Follow-Up</div>
                <p style={{fontSize:13,color:'#78350f',margin:0}}>{selectedBorrower.ins_follow_up_notes}</p>
                {selectedBorrower.ins_follow_up_date && <div style={{fontSize:11,color:'#b45309',marginTop:6}}>Last contact: {fmtDate(selectedBorrower.ins_follow_up_date)}</div>}
              </div>
            )}
            <div style={{...s.card,overflow:'hidden',padding:0}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',fontWeight:700,fontSize:14}}>Payment History & Amortization Schedule</div>
              <DashAmortizationTable borrowerId={selectedBorrower.id} />
            </div>
          </div>
        )}

        {/* ── INSURANCE TAB ── */}
        {activeTab === 'insurance' && adminUser?.role === 'superadmin' && (
          <div>
            {/* Insurance stats */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:22}}>
              {[
                {label:'Expired',val:insData.filter(b=>b.insStatus==='expired').length,color:'#b91c1c',bg:'#fff5f5'},
                {label:'Critical (<30d)',val:insData.filter(b=>b.insStatus==='critical').length,color:'#b45309',bg:'#fffbeb'},
                {label:'Warning (<90d)',val:insData.filter(b=>b.insStatus==='warning').length,color:'#1d4ed8',bg:'#eff6ff'},
                {label:'OK',val:insData.filter(b=>b.insStatus==='ok').length,color:'#15803d',bg:'#f0fdf4'},
              ].map((stat,i) => (
                <div key={i} style={{background:stat.bg,border:'1px solid #dce4ed',borderRadius:10,padding:'14px 18px',textAlign:'center',cursor:'pointer'}} onClick={() => setInsStatusFilter(stat.label.split(' ')[0].toLowerCase())}>
                  <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:6}}>{stat.label}</div>
                  <div style={{fontFamily:"'Playfair Display', serif",fontSize:28,fontWeight:700,color:stat.color}}>{stat.val}</div>
                </div>
              ))}
            </div>

            {/* Filter bar */}
            <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
              <input value={insSearch} onChange={e => setInsSearch(e.target.value)} placeholder="Search property, borrower, entity..." style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 14px',fontSize:13,outline:'none',fontFamily:"'DM Sans', sans-serif",width:280}} />
              <select value={insStatusFilter} onChange={e => setInsStatusFilter(e.target.value)} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 12px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}>
                <option value="all">All Statuses</option>
                <option value="expired">Expired</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="ok">OK</option>
                <option value="unknown">Unknown</option>
              </select>
              <select value={entityFilter} onChange={e => setEntityFilter(e.target.value)} style={{border:'1px solid #dce4ed',borderRadius:5,padding:'7px 12px',fontSize:13,cursor:'pointer',outline:'none',fontFamily:"'DM Sans', sans-serif"}}>
                {ENTITIES.map(e => <option key={e}>{e}</option>)}
              </select>
              {insStatusFilter !== 'all' && <button onClick={() => setInsStatusFilter('all')} style={{background:'none',border:'1px solid #dce4ed',borderRadius:5,padding:'7px 14px',fontSize:13,cursor:'pointer',color:'#4a5568',fontFamily:"'DM Sans', sans-serif"}}>Clear Filter</button>}
            </div>

            <div style={{background:'#fff',border:'1px solid #dce4ed',borderRadius:10,overflow:'hidden'}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontWeight:700,fontSize:15}}>Insurance Expiration Tracker</span>
                <span style={{fontSize:12,color:'#4a5568'}}>From Note Tracking sheet · {filteredIns.length} properties shown</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f0f4f8'}}>
                    {[['address','Property'],['borrower_name','Borrower'],['entity','Entity'],['ins_expiry','Expires'],['daysLeft','Days Left'],['escrow','Escrow'],['insStatus','Status'],['follow_up','Follow-Up']].map(([col,label]) => (
                      <th key={col} onClick={() => { if(insSortCol===col) setInsSortDir(d=>d==='asc'?'desc':'asc'); else{setInsSortCol(col);setInsSortDir('asc')} }} style={{padding:'10px 14px',fontSize:11,textTransform:'uppercase',color:insSortCol===col?'#2e6da4':'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap',cursor:'pointer',background:insSortCol===col?'#f0f7ff':'#f0f4f8'}}>{label} {insSortCol===col?(insSortDir==='asc'?'↑':'↓'):''}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filteredIns.map((b,i) => {
                      const ss = insStatusStyle[b.insStatus] || insStatusStyle.ok
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #f0f4f8',background:ss.bg,cursor:'pointer'}} onClick={() => drillInto(b)}>
                          <td style={{padding:'9px 14px',fontWeight:600,fontSize:13}}>{b.address.split(',')[0]}</td>
                          <td style={{padding:'9px 14px',fontSize:12,color:'#4a5568'}}>{b.borrower_name.split(' ').slice(0,2).join(' ')}</td>
                          <td style={{padding:'9px 14px',fontSize:11,color:'#4a5568'}}>{b.entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA')}</td>
                          <td style={{padding:'9px 14px',fontSize:13,fontFamily:'monospace'}}>{b.ins_expiry ? fmtDate(b.ins_expiry) : 'Unknown'}</td>
                          <td style={{padding:'9px 14px',fontSize:13,textAlign:'center',fontWeight:700,color:ss.color}}>{b.daysLeft ?? '—'}</td>
                          <td style={{padding:'9px 14px',fontSize:11,textAlign:'center'}}>
                            <span style={{padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:600,background:b.escrow?.includes('YES')||b.escrow?.includes('yes')||b.escrow?.includes('taxes')?'#f0fdf4':'#f7f9fc',color:b.escrow?.includes('YES')||b.escrow?.includes('yes')||b.escrow?.includes('taxes')?'#15803d':'#4a5568'}}>{b.escrow?.includes('YES')||b.escrow?.includes('yes')||b.escrow?.includes('taxes')?'YES':'NO'}</span>
                          </td>
                          <td style={{padding:'9px 14px'}}>
                            <span style={{padding:'3px 10px',borderRadius:12,fontSize:11,fontWeight:700,background:ss.bg,color:ss.color,border:`1px solid ${ss.color}33`}}>{ss.label}</span>
                          </td>
                          <td style={{padding:'9px 14px',fontSize:11,color:'#4a5568'}}>
                            {b.ins_follow_up_date ? <span style={{color:'#b45309'}}>↻ {fmtDate(b.ins_follow_up_date)}</span> : '—'}
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
        {activeTab === 'escrow' && adminUser?.role === 'superadmin' && (
          <div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14,marginBottom:22}}>
              {Object.entries(escrowByEntity).map(([entity, bal],i) => (
                <div key={i} style={{...s.card,textAlign:'center'}}>
                  <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#4a5568',fontWeight:600,marginBottom:6}}>{entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA')}</div>
                  <div style={{fontFamily:"'Playfair Display', serif",fontSize:24,fontWeight:700,color:'#0891b2'}}>{fmt(bal)}</div>
                </div>
              ))}
              <div style={{...s.card,textAlign:'center',background:'#f0f9ff',border:'2px solid #bae6fd'}}>
                <div style={{fontSize:10,letterSpacing:1.5,textTransform:'uppercase',color:'#0891b2',fontWeight:700,marginBottom:6}}>Total All Escrow</div>
                <div style={{fontFamily:"'Playfair Display', serif",fontSize:28,fontWeight:700,color:'#0891b2'}}>{fmt(totalEscrow)}</div>
              </div>
            </div>
            <div style={{...s.card,overflow:'hidden',padding:0}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',fontWeight:700,fontSize:15}}>Escrow Balances by Property <span style={{fontSize:12,color:'#4a5568',fontWeight:400,marginLeft:8}}>As of {escrowAccounts[0]?.as_of_date ? fmtDate(escrowAccounts[0].as_of_date) : '—'}</span></div>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <thead><tr style={{background:'#f0f4f8'}}>
                  {['Property','Entity','Bank','Balance'].map(h => <th key={h} style={{padding:'10px 16px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:h==='Balance'?'right':'left',borderBottom:'1px solid #dce4ed'}}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {escrowAccounts.map((e,i) => (
                    <tr key={i} style={{borderBottom:'1px solid #f0f4f8'}}>
                      <td style={{padding:'10px 16px',fontWeight:600,fontSize:13}}>{e.address}</td>
                      <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568'}}>{e.entity.replace(', LLC','').replace('A Squared Property Investments','A Squared')}</td>
                      <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568'}}>{e.bank}</td>
                      <td style={{padding:'10px 16px',fontSize:13,fontWeight:700,color:'#0891b2',textAlign:'right'}}>{fmt(e.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TOOLS TAB ── */}
        {activeTab === 'tools' && adminUser?.role === 'superadmin' && (
          <div>
            <div style={{display:'flex',gap:2,marginBottom:20,borderBottom:'2px solid #dce4ed'}}>
              {[{id:'docorder',label:'Doc Order Form'},{id:'closingfees',label:'Closing Fees Calculator'},{id:'checklist',label:'New Deal Checklist'}].map(t => (
                <button key={t.id} onClick={() => setToolTab(t.id)} style={{padding:'10px 20px',fontSize:13,fontWeight:600,color:toolTab===t.id?'#2e6da4':'#4a5568',cursor:'pointer',background:'none',border:'none',borderBottom:toolTab===t.id?'2px solid #2e6da4':'2px solid transparent',marginBottom:-2,fontFamily:"'DM Sans', sans-serif",whiteSpace:'nowrap'}}>{t.label}</button>
              ))}
            </div>
            <div style={{background:'#fff',border:'1px solid #dce4ed',borderRadius:10,padding:'22px 26px'}}>
              {toolTab === 'docorder' && <DocOrderForm />}
              {toolTab === 'closingfees' && <ClosingFeesCalc />}
              {toolTab === 'checklist' && <NewDealChecklist />}
            </div>
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {activeTab === 'documents' && adminUser?.role === 'superadmin' && (
          <div>
            <div style={{...s.card,marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:700,color:'#2e6da4',textTransform:'uppercase',letterSpacing:1.5,marginBottom:16}}>Save Document</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:14}}>
                <div><label style={s.label}>Document Name</label><input style={s.input} value={docName} onChange={e => setDocName(e.target.value)} placeholder="e.g. 1601 Hillcrest Title Commitment" /></div>
                <div><label style={s.label}>Category</label>
                  <select style={s.input} value={docCategory} onChange={e => setDocCategory(e.target.value)}>
                    {['general','title','insurance','loan docs','closing','legal','tax','correspondence'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label style={s.label}>Linked Property (optional)</label>
                  <select style={s.input} value={docBorrowerId} onChange={e => setDocBorrowerId(e.target.value)}>
                    <option value="">— None —</option>
                    {borrowers.map(b => <option key={b.id} value={b.id}>{b.address.split(',')[0]}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:14}}><label style={s.label}>Notes (optional)</label><input style={s.input} value={docNotes} onChange={e => setDocNotes(e.target.value)} placeholder="Brief description..." /></div>
              <div style={{marginBottom:16}}>
                <label style={s.label}>File (optional)</label>
                <input type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{fontSize:13,fontFamily:"'DM Sans', sans-serif"}} />
              </div>
              {docMsg && <div style={{background:docMsg.startsWith('✓')?'#f0fdf4':'#fff5f5',color:docMsg.startsWith('✓')?'#15803d':'#b91c1c',border:`1px solid ${docMsg.startsWith('✓')?'#bbf7d0':'#fecaca'}`,borderRadius:5,padding:'8px 12px',fontSize:13,marginBottom:12}}>{docMsg}</div>}
              <button onClick={uploadDocument} disabled={docUploading} style={{background:'#2e6da4',color:'#fff',border:'none',padding:'11px 24px',borderRadius:6,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",opacity:docUploading ? 0.7 : 1}}>{docUploading?'Saving...':'Save Document'}</button>
            </div>
            <div style={{...s.card,overflow:'hidden',padding:0}}>
              <div style={{padding:'14px 20px',borderBottom:'1px solid #dce4ed',background:'#f7f9fc',fontWeight:700,fontSize:15}}>Document Archive ({documents.length})</div>
              {documents.length === 0 ? <div style={{padding:'32px',textAlign:'center',color:'#4a5568',fontStyle:'italic'}}>No documents saved yet.</div> : (
                <table style={{width:'100%',borderCollapse:'collapse'}}>
                  <thead><tr style={{background:'#f0f4f8'}}>
                    {['Name','Category','Property','Notes','Date','File'].map(h => <th key={h} style={{padding:'10px 16px',fontSize:11,textTransform:'uppercase',color:'#4a5568',fontWeight:600,textAlign:'left',borderBottom:'1px solid #dce4ed',whiteSpace:'nowrap'}}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {documents.map((d,i) => (
                      <tr key={i} style={{borderBottom:'1px solid #f0f4f8'}}>
                        <td style={{padding:'10px 16px',fontWeight:600,fontSize:13}}>{d.name}</td>
                        <td style={{padding:'10px 16px'}}><span style={{fontSize:11,background:'#f0f4f8',padding:'2px 8px',borderRadius:10,color:'#4a5568'}}>{d.category}</span></td>
                        <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568'}}>{d.borrower_id ? borrowers.find(b=>b.id===d.borrower_id)?.address.split(',')[0] || d.borrower_id : '—'}</td>
                        <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568'}}>{d.notes || '—'}</td>
                        <td style={{padding:'10px 16px',fontSize:12,color:'#4a5568',fontFamily:'monospace'}}>{fmtDate(d.created_at)}</td>
                        <td style={{padding:'10px 16px'}}>
                          {d.file_url ? <a href={d.file_url} target="_blank" rel="noreferrer" style={{color:'#2e6da4',fontSize:12,fontWeight:600,textDecoration:'none'}}>Download</a> : <span style={{fontSize:12,color:'#9ca3af'}}>No file</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── TO-DO TAB ── */}
        {activeTab === 'todo' && adminUser?.role === 'superadmin' && (
          <div>
            <div style={{display:'flex',gap:14,marginBottom:22,alignItems:'center',flexWrap:'wrap'}}>
              <div style={{fontFamily:"'Playfair Display', serif",fontSize:20}}>To-Do List</div>
              <div style={{fontSize:13,color:'#4a5568'}}>{totalDone} of {totalItems} complete</div>
              <div style={{flex:1,height:8,background:'#e2e8f0',borderRadius:4,overflow:'hidden',minWidth:200}}>
                <div style={{height:'100%',width:(totalItems>0?totalDone/totalItems*100:0)+'%',background:'linear-gradient(90deg,#2e6da4,#22c55e)',transition:'width .3s',borderRadius:4}} />
              </div>
            </div>
            {todoCategories.map(cat => {
              const done = cat.items.filter(i => i.done).length
              return (
                <div key={cat.id} style={{background:'#fff',border:'1px solid #dce4ed',borderLeft:`3px solid ${cat.accent}`,borderRadius:8,marginBottom:14,overflow:'hidden'}}>
                  <div style={{padding:'10px 16px',borderBottom:'1px solid #f0f4f8',display:'flex',justifyContent:'space-between',background:'#f7f9fc'}}>
                    <span style={{fontWeight:700,fontSize:13,color:cat.accent}}>{cat.label}</span>
                    <span style={{fontSize:11,color:'#8b949e',fontFamily:'monospace'}}>{done}/{cat.items.length}</span>
                  </div>
                  {cat.items.map(item => (
                    <div key={item.id} onClick={() => toggleTodo(item)} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 16px',cursor:'pointer',borderBottom:'1px solid #f9fafb',background:item.done?'#f0fdf4':'transparent'}}>
                      <div style={{width:18,height:18,borderRadius:3,border:`2px solid ${item.done?cat.accent:'#d1d5db'}`,background:item.done?cat.accent:'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {item.done && <span style={{color:'#fff',fontSize:11,fontWeight:900}}>✓</span>}
                      </div>
                      <span style={{fontSize:13,color:item.done?'#9ca3af':'#1c2026',textDecoration:item.done?'line-through':'none'}}>{item.text}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── POST PAYMENT MODAL ── */}
      {modalOpen && modalBorrower && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
          <div style={{background:'#fff',borderRadius:12,padding:'28px 32px',width:'100%',maxWidth:460,boxShadow:'0 20px 60px rgba(0,0,0,.2)'}}>
            <h3 style={{fontFamily:"'Playfair Display', serif",fontSize:18,marginBottom:4}}>Post Payment</h3>
            <p style={{fontSize:13,color:'#4a5568',marginBottom:20}}>{modalBorrower.borrower_name}<br/>{modalBorrower.address}</p>
            {modalMsg && <div style={{background:modalMsg.startsWith('✓')?'#f0fdf4':'#fff5f5',color:modalMsg.startsWith('✓')?'#15803d':'#b91c1c',border:`1px solid ${modalMsg.startsWith('✓')?'#bbf7d0':'#fecaca'}`,borderRadius:5,padding:'8px 12px',fontSize:13,marginBottom:14}}>{modalMsg}</div>}
            <div style={{marginBottom:12}}><label style={s.label}>Amount ($)</label><input style={s.input} type="number" step="0.01" value={modalAmount} onChange={e => setModalAmount(e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={s.label}>Date</label><input style={s.input} type="date" value={modalDate} onChange={e => setModalDate(e.target.value)}/></div>
            <div style={{marginBottom:12}}><label style={s.label}>Method</label><select style={s.input} value={modalMethod} onChange={e => setModalMethod(e.target.value)}><option>Bank Deposit</option><option>Drop Off</option><option>Online (Equity Trust)</option><option>Other</option></select></div>
            <div style={{marginBottom:16}}><label style={s.label}>Notes</label><textarea style={{...s.input,resize:'vertical',minHeight:60}} value={modalNotes} onChange={e => setModalNotes(e.target.value)} placeholder="Optional..."/></div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={() => setModalOpen(false)} style={{background:'none',border:'1px solid #dce4ed',color:'#4a5568',padding:'10px 18px',borderRadius:5,fontSize:13,cursor:'pointer',fontFamily:"'DM Sans', sans-serif"}}>Cancel</button>
              <button onClick={submitPayment} disabled={modalLoading} style={{flex:1,background:'#15803d',color:'#fff',border:'none',padding:'10px',borderRadius:5,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:"'DM Sans', sans-serif",opacity:modalLoading ? 0.7 : 1}}>{modalLoading ? 'Posting...' : '✓ Post & Notify Brad'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
