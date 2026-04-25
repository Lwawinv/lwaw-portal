'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

type Borrower = {
  id: string; last_name: string; zip: string; address: string;
  borrower_name: string; entity: string; entity_address: string;
  bank: string; bank_address: string; account_number: string;
  payment_amount: string; due_day: string; escrow: string;
  tax_county: string; bank_lien: string | null; payment_method: string;
  ins_expiry: string | null;
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
type EscrowAccount = { borrower_id: string; address: string; entity: string; bank: string; balance: number; as_of_date: string }

const fmt = (n: number | null) => n ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
const fmtDate = (d: string) => { if (!d) return '—'; const p = d.split('T')[0].split('-'); return p[1] + '/' + p[2] + '/' + p[0] }
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

// 1098 entity→PDF mapping (Supabase storage paths)
const ENTITY_1098: Record<string, { '2024': string; '2025': string }> = {
  'A2DSTX, LLC':                              { '2024': 'A2DSTX_LLC__2024_1098s.pdf',                          '2025': 'A2DSTX__2025_1098s.pdf' },
  'A2PI, LLC':                                { '2024': 'A2PI_LLC__2024_1098s.pdf',                            '2025': 'A2PI__2025_1098s.pdf' },
  'A2AF2, LLC':                               { '2024': 'A2AF2_LLC__2024_1098s.pdf',                           '2025': 'A2AF2__2025_1098s.pdf' },
  'A2BH, LLC':                                { '2024': 'A2BH_LLC__2024_1098s.pdf',                            '2025': 'A2BH__2025_1098s.pdf' },
  'A2BA Finance, LLC':                        { '2024': 'A2BH_LLC__2024_1098s.pdf',                            '2025': 'A2BA__2025_1098s.pdf' },
  'A Squared Property Investments, LLC':      { '2024': 'A_Squared_Property_Investments_LLC__2024_1098s.pdf',  '2025': 'A_Squared_Property_Investments_LLC__2025_1098s.pdf' },
  'Equity Trust Company Custodian FBO Arick Wray IRA': { '2024': 'A2PI_LLC__2024_1098s.pdf',                  '2025': 'A2PI__2025_1098s.pdf' },
}
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
function get1098Url(entity: string, year: string): string {
  const map = ENTITY_1098[entity]
  if (!map) return ''
  const file = (map as any)[year]
  if (!file) return ''
  return `${SUPABASE_URL}/storage/v1/object/public/1098s/${file}`
}

const s = {
  card: { background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, padding: '22px 26px' } as React.CSSProperties,
  label: { fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 8 },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#1c2026', background: '#fff', outline: 'none' },
  btnBlue: { background: '#2e6da4', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 5, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", width: '100%' } as React.CSSProperties,
  errMsg: { background: '#fff5f5', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
  okMsg: { background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 5, padding: '10px 14px', fontSize: 13, marginBottom: 16 },
}

function AmortizationTable({ borrowerId }: { borrowerId: string }) {
  const [schedule, setSchedule] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showProjected, setShowProjected] = React.useState(false)
  React.useEffect(() => {
    if (!borrowerId) return
    setLoading(true)
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.from('amortization_schedule').select('*').eq('borrower_id', borrowerId).order('payment_num')
        .then(({ data }) => { if (data) setSchedule(data); setLoading(false) })
    })
  }, [borrowerId])
  if (loading) return <div style={{ fontSize: 13, color: '#4a5568', padding: '20px 0' }}>Loading schedule...</div>
  if (schedule.length === 0) return <div style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic', padding: '16px 0' }}>Schedule not yet loaded. Contact lwawinv@gmail.com.</div>
  const f2 = (n: number | null) => n != null ? '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'
  const confirmed = schedule.filter((r: any) => r.is_confirmed)
  const projected = schedule.filter((r: any) => !r.is_confirmed)
  const displayed = showProjected ? schedule : confirmed
  return (
    <div>
      <div style={{ overflowX: 'auto', maxHeight: 480, overflowY: 'auto' }}>
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
              const bg = isConf ? '#f0fdf4' : isSumm ? '#ecfdf5' : '#fafafa'
              const textColor = isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af'
              return (
                <tr key={row.payment_num} style={{ borderBottom: '1px solid #f0f4f8', background: bg }}>
                  <td style={{ padding: '6px 10px', textAlign: 'center', color: '#2e6da4', fontWeight: 600 }}>{row.payment_num}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'monospace', color: textColor }}>{row.payment_date ? row.payment_date.substring(0, 10) : '—'}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: row.is_confirmed ? 600 : 400, color: textColor }}>{f2(row.total_payment)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: textColor }}>{f2(row.principal)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', color: textColor }}>{f2(row.interest)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: row.is_confirmed ? 700 : 400, color: isConf ? '#15803d' : isSumm ? '#065f46' : '#9ca3af' }}>{f2(row.ending_balance)}</td>
                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: textColor }}>{isConf ? '✓ Confirmed' : isSumm ? '✓ Summary' : 'Projected'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid #f0f4f8', display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={() => setShowProjected(!showProjected)} style={{ background: 'none', border: '1px solid #dce4ed', borderRadius: 5, padding: '7px 16px', fontSize: 12, cursor: 'pointer', color: '#2e6da4', fontFamily: "'DM Sans', sans-serif" }}>
          {showProjected ? `Hide Projected (showing ${confirmed.length} confirmed)` : `Show Full Schedule (${projected.length} projected remaining)`}
        </button>
        <span style={{ fontSize: 12, color: '#4a5568' }}>{confirmed.length} payments confirmed · {projected.length} projected</span>
      </div>
    </div>
  )
}

function PayoffCalculator({ borrower, loanDetail }: { borrower: any, loanDetail: any }) {
  const [payoffDate, setPayoffDate] = React.useState(new Date().toISOString().split('T')[0])
  const [result, setResult] = React.useState<null | { payoff: number; perDiem: number; interestToDate: number; daysRemaining: number }>(null)
  function calculate() {
    if (!loanDetail) return
    const balance = loanDetail.current_balance || loanDetail.loan_amount
    const rate = loanDetail.rate < 1 ? loanDetail.rate : loanDetail.rate / 100
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
      <div style={{ ...s.card, marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 16 }}>Payoff Quote Calculator</div>
        <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 20 }}>Estimate your payoff amount as of a specific date. Contact LWAW for an official payoff letter.</p>
        {!loanDetail ? <p style={{ fontSize: 13, color: '#4a5568', fontStyle: 'italic' }}>Loan detail not available. Contact lwawinv@gmail.com.</p> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#f7f9fc', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Current Balance</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1c2026', fontFamily: "'Playfair Display', serif" }}>{fmtMoney(loanDetail.current_balance || loanDetail.loan_amount)}</div>
              </div>
              <div style={{ background: '#f7f9fc', borderRadius: 8, padding: '14px 18px' }}>
                <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 6 }}>Interest Rate</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#1c2026', fontFamily: "'Playfair Display', serif" }}>
                  {loanDetail.rate < 1 ? (loanDetail.rate * 100).toFixed(2) : loanDetail.rate.toFixed(2)}%
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' as const, color: '#4a5568', fontWeight: 600, marginBottom: 8, display: 'block' }}>Select Payoff Date</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input type="date" value={payoffDate} onChange={e => setPayoffDate(e.target.value)} style={{ padding: '10px 14px', border: '1px solid #dce4ed', borderRadius: 5, fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                <button onClick={calculate} style={{ background: '#2e6da4', color: '#fff', border: 'none', padding: '11px 24px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Calculate</button>
              </div>
            </div>
            {result && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#15803d', marginBottom: 16 }}>Estimated Payoff — {new Date(payoffDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {[
                    { label: 'Payoff Amount', val: fmtMoney(result.payoff), h: true },
                    { label: 'Per Diem Interest', val: fmtMoney(result.perDiem) + '/day', h: false },
                    { label: 'Interest to Payoff Date', val: fmtMoney(result.interestToDate), h: false },
                    { label: 'Days Until Payoff', val: result.daysRemaining + ' days', h: false },
                  ].map((item, i) => (
                    <div key={i} style={{ background: item.h ? '#dcfce7' : '#fff', borderRadius: 6, padding: '12px 16px', border: '1px solid ' + (item.h ? '#86efac' : '#dce4ed') }}>
                      <div style={{ fontSize: 11, color: '#4a5568', textTransform: 'uppercase' as const, letterSpacing: 1, fontWeight: 600, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: item.h ? 22 : 16, fontWeight: 700, color: item.h ? '#15803d' : '#1c2026', fontFamily: item.h ? "'Playfair Display', serif" : 'inherit' }}>{item.val}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#4a5568', margin: '12px 0 0', fontStyle: 'italic' }}>* Estimate only. Contact LWAW at lwawinv@gmail.com or 806-680-3556 for an official payoff letter.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── BILINGUAL CONTENT ──────────────────────────────────────────────────────────
const content = {
  en: {
    tagline: 'Amarillo, Texas · Seller Finance Loan Servicing',
    hero: 'Professional Loan Servicing for',
    heroSpan: 'Seller-Finance Notes',
    heroSub: 'LWAW Investments, LLC provides third-party loan servicing for seller-financed real estate transactions across the Texas Panhandle.',
    borrowerBtn: 'Borrower Login Portal',
    questionsBtn: 'Common Questions',
    tiles: [
      { title: 'We Are the Servicer', body: 'LWAW Investments is the loan servicer — not the lender. Your note is held by a separate lending entity. LWAW collects payments, manages escrow, and coordinates communications on the note holder\'s behalf.' },
      { title: 'Investment Properties Only', body: 'All loans serviced by LWAW are on non-owner-occupied investment properties. Borrowers are real estate investors managing properties under individual or entity ownership.' },
      { title: 'Borrower Portal', body: 'Active borrowers log in to access their payment instructions, account number, lien holder details, escrow status, loan details, and payment history — all specific to their loan.' },
    ],
    faqTitle: 'Frequently Asked Questions',
    faqSub: 'Common Questions',
    faqDesc: 'Answers for borrowers, insurance agents, title companies, and note holders.',
    aboutTag: 'About LWAW',
    aboutTitle: 'Experienced. Local. Responsive.',
    aboutP1: 'LWAW Investments, LLC is a privately held loan servicing company based in Amarillo, Texas, specializing in third-party servicing of seller-financed notes on non-owner-occupied investment properties across the Texas Panhandle.',
    aboutP3: 'Bilingual (English/Spanish) support, responsive communication, and deep local market knowledge.',
    bilingualLabel: 'Bilingual support',
    panhandleLabel: 'Panhandle focused',
    contactTitle: 'Get in Touch',
    contactSub: 'Questions about a loan we service? Reach out directly — we respond quickly.',
    footerDisclaimer: 'LWAW Investments, LLC is a loan servicer — not a lender or licensed mortgage company.',
    faqs: [
      { q: 'What does LWAW Investments do?', a: 'LWAW Investments, LLC is a third-party loan servicer for seller-financed real estate notes in Amarillo, Texas. We process payments, manage escrow, monitor insurance, and handle borrower communications on behalf of note holders. LWAW is the servicer — notes are originated and held by separate lending entities.' },
      { q: 'Who is my lender?', a: 'Your lender is the entity listed on your promissory note. LWAW Investments services the loan on their behalf. Log in to the Borrower Portal to see your specific lending entity and lien holder information.' },
      { q: 'How do I make my monthly payment?', a: 'Payments are made by bank deposit to your designated account. Each loan has a specific bank and account number — log in to the Borrower Portal to see yours. After every deposit, text a photo of your deposit slip to 806-680-3556.' },
      { q: 'What if I cannot make my payment on time?', a: 'Contact us immediately at 806-680-3556 or lwawinv@gmail.com. The sooner you communicate, the more options we have. Loans 30+ days past due without communication are referred to attorneys.' },
      { q: 'Who is responsible for property taxes?', a: 'It depends on your loan. Some loans include tax escrow — we pay taxes on your behalf. Other loans require you to pay directly by January 31st each year. Log in to the Borrower Portal to see your escrow status.' },
      { q: 'What happens if I do not pay my property taxes?', a: 'Unpaid property taxes are a default of your loan agreement. Failure to pay by January 31st can result in late penalties, collection action by the county, and ultimately foreclosure. Do not ignore this — contact us immediately if you cannot pay.' },
      { q: 'What are my insurance requirements?', a: 'Active property insurance is required at all times. Your policy must list the correct lien holders. Log in to the Borrower Portal to see the exact lien holders for your property. Send policies to lwawinv@gmail.com.' },
      { q: 'What is escrow and do I have it?', a: 'Escrow means a portion of your monthly payment is reserved for property taxes and/or insurance. Not all loans include escrow. Log in to the Borrower Portal to see your escrow status.' },
      { q: 'How do I get a payoff quote?', a: 'Contact Brad at lwawinv@gmail.com or 806-680-3556. We will provide your current balance, accrued interest, and any applicable fees.' },
      { q: 'I am an insurance agent — what lien holder info do you need?', a: 'Email lwawinv@gmail.com with the property address and we will provide exact lien holder language. Certificates can be sent directly to lwawinv@gmail.com.' },
      { q: 'I am a title company — who do I contact?', a: 'Contact Brad at lwawinv@gmail.com or 806-680-3556 for payoff quotes, lien releases, title commitments, and closing coordination.' },
      { q: 'How do I get my Form 1098?', a: 'Form 1098 is issued annually by end of January. Log in to the Borrower Portal to download your form. Contact lwawinv@gmail.com if you have questions.' },
    ],
  },
  es: {
    tagline: 'Amarillo, Texas · Servicio de Prestamos',
    hero: 'Servicio Profesional de Prestamos para',
    heroSpan: 'Notas de Venta Financiada',
    heroSub: 'LWAW Investments, LLC ofrece servicio de prestamos de terceros para transacciones inmobiliarias de venta financiada en el Panhandle de Texas.',
    borrowerBtn: 'Portal del Prestatario',
    questionsBtn: 'Preguntas Frecuentes',
    tiles: [
      { title: 'Somos el Administrador', body: 'LWAW Investments es el administrador del prestamo, no el prestamista. Su nota esta en manos de una entidad crediticia separada. LWAW recauda pagos, administra el deposito en garantia y coordina las comunicaciones.' },
      { title: 'Solo Propiedades de Inversion', body: 'Todos los prestamos administrados por LWAW son sobre propiedades de inversion no ocupadas por el propietario. Los prestatarios son inversores inmobiliarios.' },
      { title: 'Portal del Prestatario', body: 'Los prestatarios activos pueden iniciar sesion para acceder a instrucciones de pago, numero de cuenta, titulares de gravamenes, estado de deposito en garantia e historial de pagos.' },
    ],
    faqTitle: 'Preguntas Frecuentes',
    faqSub: 'Preguntas Comunes',
    faqDesc: 'Respuestas para prestatarios, agentes de seguros, companias de titulo y titulares de notas.',
    aboutTag: 'Acerca de LWAW',
    aboutTitle: 'Experiencia. Local. Respuesta Rapida.',
    aboutP1: 'LWAW Investments, LLC es una empresa privada de administracion de prestamos con sede en Amarillo, Texas, especializada en el servicio de terceros de notas de venta financiada en el Panhandle de Texas.',
    aboutP3: 'Soporte bilingue (ingles/espanol), comunicacion receptiva y profundo conocimiento del mercado local.',
    bilingualLabel: 'Soporte bilingue',
    panhandleLabel: 'Enfocado en Panhandle',
    contactTitle: 'Contactenos',
    contactSub: 'Preguntas sobre un prestamo que administramos? Comuniquese directamente — respondemos rapidamente.',
    footerDisclaimer: 'LWAW Investments, LLC es un administrador de prestamos — no es un prestamista ni una empresa hipotecaria con licencia.',
    faqs: [
      { q: 'Que hace LWAW Investments?', a: 'LWAW Investments, LLC es un administrador de prestamos de terceros para notas inmobiliarias de venta financiada en Amarillo, Texas. Procesamos pagos, administramos depositos en garantia, monitoreamos seguros y manejamos comunicaciones con prestatarios en nombre de los titulares de notas.' },
      { q: 'Quien es mi prestamista?', a: 'Su prestamista es la entidad indicada en su pagare. LWAW Investments administra el prestamo en su nombre. Inicie sesion en el Portal del Prestatario para ver su entidad crediticia especifica.' },
      { q: 'Como hago mi pago mensual?', a: 'Los pagos se realizan mediante deposito bancario en su cuenta designada. Cada prestamo tiene un banco y numero de cuenta especificos. Inicie sesion en el Portal para ver los suyos. Despues de cada deposito, envienos una foto del comprobante al 806-680-3556.' },
      { q: 'Que pasa si no puedo pagar a tiempo?', a: 'Contactenos de inmediato al 806-680-3556 o lwawinv@gmail.com. Cuanto antes se comunique, mas opciones tenemos disponibles.' },
      { q: 'Quien es responsable de los impuestos sobre la propiedad?', a: 'Depende de su prestamo. Algunos prestamos incluyen deposito en garantia para impuestos — nosotros los pagamos en su nombre. Otros requieren que usted pague directamente antes del 31 de enero. Inicie sesion en el Portal para ver su estado.' },
      { q: 'Que pasa si no pago los impuestos de la propiedad?', a: 'Los impuestos de propiedad no pagados son un incumplimiento de su contrato de prestamo. La falta de pago antes del 31 de enero puede resultar en multas, accion de cobro por parte del condado y, en ultima instancia, ejecucion hipotecaria. No ignore esto — contactenos de inmediato si no puede pagar.' },
      { q: 'Cuales son mis requisitos de seguro?', a: 'Se requiere seguro de propiedad activo en todo momento. Su poliza debe incluir a los titulares de gravamenes correctos. Inicie sesion en el Portal del Prestatario para ver los titulares de gravamenes de su propiedad. Envie las polizas a lwawinv@gmail.com.' },
      { q: 'Que es el deposito en garantia y lo tengo?', a: 'El deposito en garantia significa que una parte de su pago mensual se reserva para impuestos sobre la propiedad y/o seguro. No todos los prestamos incluyen deposito en garantia. Inicie sesion en el Portal para ver su estado.' },
      { q: 'Como obtengo una cotizacion de pago total?', a: 'Contacte a Brad en lwawinv@gmail.com o al 806-680-3556. Le proporcionaremos su saldo actual, intereses acumulados y cualquier tarifa aplicable.' },
      { q: 'Soy agente de seguros — que informacion de titular de gravamen necesita?', a: 'Envie un correo a lwawinv@gmail.com con la direccion de la propiedad y le proporcionaremos el lenguaje exacto del titular del gravamen. Los certificados pueden enviarse directamente a lwawinv@gmail.com.' },
      { q: 'Soy una compania de titulos — a quien contacto?', a: 'Contacte a Brad en lwawinv@gmail.com o al 806-680-3556 para cotizaciones de pago total, liberaciones de gravamenes, compromisos de titulos y coordinacion de cierre.' },
      { q: 'Como obtengo mi Formulario 1098?', a: 'El Formulario 1098 se emite anualmente antes de fin de enero. Inicie sesion en el Portal del Prestatario para descargarlo. Contactenos en lwawinv@gmail.com si tiene preguntas.' },
    ],
  }
}

export default function PortalPage() {
  const [screen, setScreen] = useState<'home'|'login'|'select'|'dash'|'admin'>('home')
  const [lang, setLang] = useState<'en'|'es'>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('payments')
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const [loading, setLoading] = useState(false)

  const [borrowers, setBorrowers] = useState<Borrower[]>([])
  const [selectedBorrower, setSelectedBorrower] = useState<Borrower | null>(null)
  const [loanDetail, setLoanDetail] = useState<LoanDetail | null>(null)
  const [escrowAccount, setEscrowAccount] = useState<EscrowAccount | null>(null)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [allBorrowers, setAllBorrowers] = useState<Borrower[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [principalPaid, setPrincipalPaid] = useState(0)
  const [pct, setPct] = useState(0)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

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

  const t = content[lang]

  async function handleBorrowerLogin() {
    setErr(''); setOk(''); setLoading(true)
    try {
      const res = await fetch('/api/portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password })
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Authentication failed'); return }
      const list: Borrower[] = data.borrowers || []
      setBorrowers(list)
      if (list.length === 1) { setSelectedBorrower(list[0]); loadBorrowerData(list[0]); setScreen('dash') }
      else if (list.length > 1) setScreen('select')
      else setErr('No active loans found for your account.')
    } catch { setErr('Connection error. Please try again.') }
    finally { setLoading(false) }
  }

  async function loadBorrowerData(b: Borrower) {
    const { supabase } = await import('@/lib/supabase')
    const [{ data: ld }, { data: pmts }, { data: esc }] = await Promise.all([
      supabase.from('loan_details').select('*').eq('borrower_id', b.id).single(),
      supabase.from('payment_history').select('*').eq('borrower_id', b.id).order('payment_date', { ascending: false }).limit(100),
      supabase.from('escrow_accounts').select('*').eq('borrower_id', b.id).single(),
    ])
    if (ld) {
      setLoanDetail(ld)
      const pp = (ld.loan_amount - ld.current_balance)
      setPrincipalPaid(Math.max(0, pp))
      setPct(Math.min(100, Math.round(Math.max(0, pp) / ld.loan_amount * 100)))
    }
    if (pmts) setPayments(pmts)
    if (esc) setEscrowAccount(esc)
  }

  async function loadAdminData() {
    const { supabase } = await import('@/lib/supabase')
    const { data } = await supabase.from('borrowers').select('*').eq('active', true).order('address')
    if (data) setAllBorrowers(data)
  }

  function logout() { setBorrowers([]); setSelectedBorrower(null); setLoanDetail(null); setEscrowAccount(null); setPayments([]); setAdminUser(null); setScreen('home'); setActiveTab('payments'); setErr(''); setOk('') }

  const hasEscrow = selectedBorrower?.escrow === 'taxes_and_insurance' || selectedBorrower?.escrow === 'yes' || selectedBorrower?.escrow?.toLowerCase().includes('yes')

  // Admin payment status helper
  function getPaymentStatus(b: Borrower & { allPayments?: any[] }) {
    const monthStart = new Date(adminYear, adminMonth, 1).toISOString().split('T')[0]
    const monthEnd = new Date(adminYear, adminMonth + 1, 0).toISOString().split('T')[0]
    const found = (b as any).payments?.find((p: any) => p.payment_date >= monthStart && p.payment_date <= monthEnd)
    if (found) return { status: 'paid', amount: found.total_paid }
    const dueNum = parseInt(b.due_day)
    const now = new Date()
    const isPast = now.getFullYear() > adminYear || (now.getFullYear() === adminYear && now.getMonth() > adminMonth) ||
      (now.getFullYear() === adminYear && now.getMonth() === adminMonth && now.getDate() > dueNum + 5)
    return { status: isPast ? 'overdue' : 'unpaid', amount: null }
  }
  const paidCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'paid').length
  const overdueCount = allBorrowers.filter(b => getPaymentStatus(b).status === 'overdue').length

  function openPaymentModal(b: Borrower) {
    setModalBorrower(b); setModalAmount(b.payment_amount.replace(/[$,]/g, '')); setModalOpen(true); setModalMsg('')
  }

  async function submitPayment() {
    if (!modalBorrower) return
    setModalLoading(true); setModalMsg('')
    try {
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ borrower_id: modalBorrower.id, amount: parseFloat(modalAmount), payment_date: modalDate, method: modalMethod, notes: modalNotes, posted_by: adminUser?.full_name || 'Arick' }) })
      const data = await res.json()
      if (!res.ok) { setModalMsg('Error: ' + (data.error || 'Failed')); return }
      setModalMsg('✓ Payment posted!')
      setTimeout(() => { setModalOpen(false); loadAdminData() }, 1500)
    } catch { setModalMsg('Connection error.') }
    finally { setModalLoading(false) }
  }

  // ── PUBLIC HOMEPAGE (screen === 'home') ──────────────────────────────────
  if (screen === 'home') return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div>
            <div style={{ fontSize: 9, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500 }}>LLC · Loan Servicer · Amarillo, TX</div>
          </div>
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { setLang(l => l === 'en' ? 'es' : 'en'); setOpenFaq(null) }} style={{ background: '#f0f4f8', border: '1px solid #dce4ed', padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#1c2026', whiteSpace: 'nowrap' }}>{lang === 'en' ? 'ES' : 'EN'}</button>
          <a href="#contact" style={{ textDecoration: 'none', color: '#4a5568', fontSize: 13, fontWeight: 500 }}>Contact</a>
          <button onClick={() => setScreen('login')} style={{ background: '#2e6da4', color: '#fff', padding: '8px 14px', borderRadius: 5, border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>{t.borrowerBtn}</button>
        </div>
      </nav>
      <div style={{ background: 'linear-gradient(150deg,#0d1218 0%,#152030 55%,#0e1f35 100%)', color: '#fff', padding: 'clamp(48px,8vw,90px) 5vw clamp(56px,9vw,100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(110,180,240,.14)', border: '1px solid rgba(110,180,240,.28)', color: '#b8d8f4', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 18px', borderRadius: 20, marginBottom: 22 }}>{t.tagline}</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, color: '#f4f8ff' }}>{t.hero}<br/><span style={{ color: '#7dc4f0' }}>{t.heroSpan}</span></h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#c4d6e8', maxWidth: 540, margin: '0 auto 36px', fontWeight: 300 }}>{t.heroSub}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setScreen('login')} style={{ background: '#2e6da4', color: '#fff', padding: 'clamp(12px,2vw,15px) clamp(22px,4vw,34px)', borderRadius: 6, border: '2px solid #4a8fc4', fontWeight: 700, fontSize: 'clamp(14px,2vw,17px)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", boxShadow: '0 4px 20px rgba(46,109,164,.4)' }}>🔐 {t.borrowerBtn}</button>
          <a href="#faq" style={{ background: 'transparent', color: '#f4f8ff', padding: 'clamp(12px,2vw,15px) clamp(22px,4vw,34px)', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: 'clamp(14px,2vw,17px)', border: '2px solid rgba(255,255,255,.3)' }}>{t.questionsBtn}</a>
        </div>
      </div>
      <div style={{ background: '#111820', padding: 'clamp(36px,5vw,52px) 5vw' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {t.tiles.map((tile, i) => (
            <div key={i}><div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7dc4f0', marginBottom: 8, fontWeight: 600 }}>{tile.title}</div><p style={{ fontSize: 14, color: '#c4d6e8', fontWeight: 300, lineHeight: 1.75 }}>{tile.body}</p></div>
          ))}
        </div>
      </div>
      <section id="faq" style={{ padding: 'clamp(48px,6vw,72px) 5vw', background: '#f7f9fc' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 8 }}>{t.faqTitle}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,3vw,36px)', marginBottom: 10 }}>{t.faqSub}</h2>
          <p style={{ color: '#4a5568', fontSize: 15, maxWidth: 580, marginBottom: 32, fontWeight: 300 }}>{t.faqDesc}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {t.faqs.map((faq, i) => (
              <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '18px 20px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1c2026', display: 'flex', justifyContent: 'space-between', gap: 10, userSelect: 'none', lineHeight: 1.4 }}>
                  {faq.q}
                  <span style={{ color: '#2e6da4', fontSize: 18, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .25s' }}>+</span>
                </div>
                {openFaq === i && <p style={{ fontSize: 13, color: '#4a5568', lineHeight: 1.75, marginTop: 10, fontWeight: 300 }}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="about" style={{ padding: 'clamp(48px,6vw,72px) 5vw', background: '#fff' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,#0d1a28,#173352)', borderRadius: 12, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity: .8 }}><rect x="8" y="44" width="14" height="28" rx="2" fill="white"/><rect x="28" y="30" width="14" height="42" rx="2" fill="white"/><rect x="48" y="14" width="14" height="58" rx="2" fill="white"/><path d="M12 56 Q40 20 68 12" stroke="#7dc4f0" strokeWidth="4" fill="none" strokeLinecap="round"/><polygon points="68,6 76,18 60,18" fill="#7dc4f0"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 10 }}>{t.aboutTag}</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(20px,3vw,34px)', marginBottom: 12 }}>{t.aboutTitle}</h2>
            <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 12, fontWeight: 300 }}>{t.aboutP1}</p>
            <p style={{ color: '#4a5568', fontSize: 14, fontWeight: 300 }}>{t.aboutP3}</p>
            <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
              <div><strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#2e6da4', display: 'block' }}>EN/ES</strong><span style={{ fontSize: 12, color: '#4a5568' }}>{t.bilingualLabel}</span></div>
              <div><strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: '#2e6da4', display: 'block' }}>TX</strong><span style={{ fontSize: 12, color: '#4a5568' }}>{t.panhandleLabel}</span></div>
            </div>
          </div>
        </div>
      </section>
      <div id="contact" style={{ background: '#131d2a', color: '#fff', padding: 'clamp(40px,6vw,60px) 5vw', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f4f8ff', marginBottom: 8, fontSize: 'clamp(20px,3vw,32px)' }}>{t.contactTitle}</h2>
        <p style={{ color: '#a8c0d6', marginBottom: 28, fontWeight: 300, fontSize: 15 }}>{t.contactSub}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{icon:'📞',text:'806-680-3556',href:'tel:8066803556'},{icon:'📧',text:'lwawinv@gmail.com',href:'mailto:lwawinv@gmail.com'},{icon:'🔐',text:t.borrowerBtn,href:'#login',onClick:()=>setScreen('login')}].map((pill,i) => (
            <a key={i} href={pill.href} onClick={pill.onClick ? (e)=>{e.preventDefault();pill.onClick!()} : undefined} style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.07)',border:'1px solid rgba(255,255,255,.16)',padding:'10px 18px',borderRadius:6,color:'#e8f2ff',textDecoration:'none',fontSize:14,cursor:'pointer' }}>
              <span>{pill.icon}</span>{pill.text}
            </a>
          ))}
        </div>
      </div>
      <footer style={{ background: '#0a0f18', color: '#3e5066', padding: '24px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
        <span>© 2026 LWAW Investments, LLC · Amarillo, Texas</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#faq" style={{ color: '#3e5066', textDecoration: 'none' }}>FAQ</a>
          <button onClick={() => setScreen('login')} style={{ color: '#3e5066', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>Borrower Login</button>
          <a href="mailto:lwawinv@gmail.com" style={{ color: '#3e5066', textDecoration: 'none' }}>Contact</a>
        </div>
        <span style={{ maxWidth: 380 }}>{t.footerDisclaimer}</span>
      </footer>
    </div>
  )

  // ── SHARED NAV for portal screens ─────────────────────────────────────────
  const PortalNav = () => (
    <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
      <button onClick={() => setScreen('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer' }}>
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 13, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div>
          <div style={{ fontSize: 10, color: '#2e6da4', fontWeight: 600 }}>Borrower Portal</div>
        </div>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {adminUser && <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, background: '#f5f3ff', padding: '4px 12px', borderRadius: 20, border: '1px solid #ddd6fe' }}>🔐 {adminUser.full_name}</span>}
        <button onClick={() => setScreen('home')} style={{ color: '#4a5568', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>← Public Site</button>
        {(selectedBorrower || adminUser) && <button onClick={logout} style={{ background: 'none', border: '1px solid #dce4ed', padding: '6px 14px', borderRadius: 4, fontSize: 13, cursor: 'pointer', color: '#4a5568', fontFamily: "'DM Sans', sans-serif" }}>Log Out</button>}
      </div>
    </nav>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fc', fontFamily: "'DM Sans', sans-serif" }}>
      <PortalNav />

      {/* ═══ LOGIN ═══ */}
      {screen === 'login' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '32px 18px' }}>
          <div style={{ ...s.card, width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 6 }}>Portal Login</h2>
            <p style={{ fontSize: 14, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>Sign in with the username and password provided to you by LWAW Investments.</p>
            {err && <div style={s.errMsg}>{err}</div>}
            {ok && <div style={s.okMsg}>{ok}</div>}
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Username</label>
              <input style={s.input} value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. firstname-1234" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}/>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={s.label}>Password</label>
              <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" onKeyDown={e => e.key === 'Enter' && handleBorrowerLogin()} autoCapitalize="off" autoCorrect="off" spellCheck={false}/>
            </div>
            <button onClick={() => handleBorrowerLogin()} disabled={loading} style={{ ...s.btnBlue, marginTop: 4, opacity: loading ? .7 : 1 }}>{loading ? 'Signing in...' : 'Sign In'}</button>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: '#4a5568' }}>
              Don&rsquo;t have credentials? Contact LWAW at <a href="mailto:lwawinv@gmail.com" style={{ color: '#2e6da4' }}>lwawinv@gmail.com</a> or <a href="tel:8066803556" style={{ color: '#2e6da4' }}>806-680-3556</a>.
            </div>
          </div>
        </div>
      )}

      {/* ═══ PROPERTY SELECT ═══ */}
      {screen === 'select' && (
        <div style={{ padding: '40px 36px', maxWidth: 640, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 8 }}>Select Your Property</h2>
          <p style={{ color: '#4a5568', fontSize: 14, marginBottom: 24, fontWeight: 300 }}>Multiple loans are associated with your account.</p>
          {borrowers.map(b => (
            <button key={b.id} onClick={() => { setSelectedBorrower(b); loadBorrowerData(b); setScreen('dash'); setActiveTab('payments') }} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '18px 22px', marginBottom: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <strong style={{ display: 'block', fontSize: 15, color: '#1c2026', marginBottom: 3 }}>{b.address}</strong>
              <span style={{ fontSize: 13, color: '#4a5568' }}>{b.entity} · Due {b.due_day} · {b.payment_amount}/mo</span>
            </button>
          ))}
        </div>
      )}

      {/* ═══ BORROWER DASHBOARD ═══ */}
      {screen === 'dash' && selectedBorrower && (
        <div style={{ padding: '32px 36px 72px', maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #dce4ed' }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, marginBottom: 3 }}>{selectedBorrower.borrower_name}</h1>
            <div style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, marginBottom: 8 }}>Loan serviced by LWAW Investments, LLC on behalf of <strong>{selectedBorrower.entity}</strong></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#e8f2fb', color: '#2e6da4', fontSize: 13, fontWeight: 600, padding: '6px 14px', borderRadius: 20 }}>📍 {selectedBorrower.address}</span>
              {borrowers.length > 1 && <a onClick={() => setScreen('select')} style={{ fontSize: 13, color: '#2e6da4', cursor: 'pointer', textDecoration: 'underline' }}>← Switch Property</a>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #dce4ed', flexWrap: 'wrap' }}>
            {[['payments','Payments'],['details','Loan Details'],['history','Payment History & Schedule'],['1098s','1098 Tax Docs'],['payoff','Payoff Quote'],['insurance','Insurance & Tax'],['contact','Contact']].map(([id,label]) => (
              <button key={id} onClick={() => setActiveTab(id)} style={{ padding: '10px 20px', fontSize: 14, fontWeight: 600, color: activeTab===id?'#2e6da4':'#4a5568', cursor: 'pointer', borderBottom: activeTab===id?'2px solid #2e6da4':'2px solid transparent', marginBottom: -2, background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab===id?'#2e6da4':'transparent', fontFamily: "'DM Sans', sans-serif" }}>{label}</button>
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
                  {hasEscrow
                    ? <><span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600, background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', marginBottom: 8 }}>✓ Taxes & Insurance Escrowed</span>
                      {escrowAccount && <div style={{ marginTop: 8, background: '#f0f9ff', borderRadius: 6, padding: '10px 14px', display: 'inline-block' }}><div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#0891b2', fontWeight: 600, marginBottom: 2 }}>Escrow Balance</div><div style={{ fontSize: 20, fontWeight: 700, color: '#0891b2' }}>{fmt(escrowAccount.balance)}</div><div style={{ fontSize: 11, color: '#4a5568', marginTop: 2 }}>As of {fmtDate(escrowAccount.as_of_date)} · {escrowAccount.bank}</div></div>}</>
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
                  { label: 'Interest Rate', val: (loanDetail.rate < 1 ? (loanDetail.rate * 100).toFixed(2) : loanDetail.rate.toFixed(2)) + '%', color: '#1c2026' },
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
                  <div style={{ height: '100%', width: pct + '%', background: 'linear-gradient(90deg,#2e6da4,#22c55e)', borderRadius: 5 }}/>
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

          {/* PAYMENT HISTORY & AMORTIZATION (combined) */}
          {activeTab === 'history' && (
            <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '16px 22px', borderBottom: '1px solid #dce4ed', background: '#f7f9fc' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>Payment History and Amortization Schedule</div>
                <div style={{ fontSize: 12, color: '#4a5568' }}>Confirmed payments shown first — click to expand full projected schedule</div>
              </div>
              <AmortizationTable borrowerId={selectedBorrower.id} />
            </div>
          )}

          {/* 1098 TAB */}
          {activeTab === '1098s' && (
            <div>
              <div style={{ ...s.card, marginBottom: 20 }}>
                <div style={s.label}>Form 1098 — Mortgage Interest Statements</div>
                <p style={{ fontSize: 13, color: '#4a5568', margin: '8px 0 20px' }}>Your Form 1098 shows the mortgage interest paid during the year. Use this when filing your federal tax return.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {(['2025', '2024'] as const).map(yr => {
                    const url = get1098Url(selectedBorrower.entity, yr)
                    return (
                      <div key={yr} style={{ background: '#f7f9fc', border: '1px solid #dce4ed', borderRadius: 8, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{yr} Form 1098 ({yr === '2025' ? 'Current Year' : 'Prior Year'})</div>
                          <div style={{ fontSize: 12, color: '#4a5568' }}>Tax Year {yr} · {selectedBorrower.entity.replace(', LLC','').replace('A Squared Property Investments','A Squared').replace('Equity Trust Company Custodian FBO Arick Wray IRA','IRA (Arick)')}</div>
                        </div>
                        {url
                          ? <a href={url} target="_blank" rel="noreferrer" style={{ background: '#2e6da4', color: '#fff', padding: '8px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Download PDF</a>
                          : <a href={`mailto:lwawinv@gmail.com?subject=1098 Request - ${selectedBorrower.address} - ${yr}&body=Hi Brad, please send me my ${yr} Form 1098. Thank you.`} style={{ background: '#6b7280', color: '#fff', padding: '8px 14px', borderRadius: 5, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>Request via Email</a>
                        }
                      </div>
                    )
                  })}
                </div>
              </div>
              <div style={s.card}>
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

          {activeTab === 'payoff' && <PayoffCalculator borrower={selectedBorrower} loanDetail={loanDetail} />}

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
                {selectedBorrower.ins_expiry && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: new Date(selectedBorrower.ins_expiry) < new Date() ? '#fff5f5' : '#f0fdf4', borderRadius: 6, border: `1px solid ${new Date(selectedBorrower.ins_expiry) < new Date() ? '#fecaca' : '#bbf7d0'}` }}>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600, marginBottom: 2, color: new Date(selectedBorrower.ins_expiry) < new Date() ? '#b91c1c' : '#15803d' }}>Policy Expires</div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: new Date(selectedBorrower.ins_expiry) < new Date() ? '#b91c1c' : '#15803d' }}>{fmtDate(selectedBorrower.ins_expiry)}</div>
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#4a5568', marginTop: 12, paddingTop: 12, borderTop: '1px solid #dce4ed' }}>Send policy to: <strong>lwawinv@gmail.com</strong></div>
              </div>
              <div style={s.card}>
                <div style={s.label}>Property Tax</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 6 }}>{selectedBorrower.tax_county === 'potter' ? 'Potter County' : 'Randall County'}</div>
                <p style={{ fontSize: 13.5, color: '#4a5568', fontWeight: 300, marginBottom: 4 }}>Taxes due <strong>January 31st</strong> each year.</p>
                {!hasEscrow
                  ? <a href={selectedBorrower.tax_county === 'potter' ? 'https://www.pottercountytax.com/search' : 'https://randallcounty.propertytaxpayments.net/search'} target="_blank" rel="noreferrer" style={{ display: 'inline-block', background: '#1c2026', color: '#fff', padding: '9px 20px', borderRadius: 5, textDecoration: 'none', fontSize: 13, fontWeight: 600, marginTop: 12 }}>Pay Property Taxes →</a>
                  : <p style={{ fontSize: 12, color: '#4a5568', marginTop: 8, fontStyle: 'italic' }}>Taxes are escrowed — LWAW pays on your behalf.</p>
                }
              </div>
            </div>
          )}

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

      {/* ═══ ADMIN DASHBOARD (Arick) ═══ */}
      {screen === 'admin' && adminUser && (
        <div style={{ padding: '32px 36px 72px', maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26 }}>Payment Manager</h1>
              <p style={{ fontSize: 13, color: '#4a5568', fontWeight: 300, marginTop: 3 }}>All active loans — post payments, track status, flag overdue accounts</p>
            </div>
          </div>
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
          <div style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #dce4ed', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>All Properties — {monthNames[adminMonth]} {adminYear}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#4a5568' }}>
                <label>Month:</label>
                <select value={adminMonth} onChange={e => setAdminMonth(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '6px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}>{monthNames.map((m, i) => <option key={i} value={i}>{m}</option>)}</select>
                <select value={adminYear} onChange={e => setAdminYear(parseInt(e.target.value))} style={{ border: '1px solid #dce4ed', borderRadius: 5, padding: '6px 10px', fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', outline: 'none' }}><option value={2025}>2025</option><option value={2026}>2026</option></select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f0f4f8' }}>
                  {['Property Address','Borrower','Monthly Pmt','Current Balance','Due Day','Status','Action'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, letterSpacing: .5, textTransform: 'uppercase', color: '#4a5568', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid #dce4ed', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {allBorrowers.map(b => {
                    const { status, amount } = getPaymentStatus(b)
                    return (
                      <tr key={b.id} style={{ borderBottom: '1px solid #f0f4f8', background: status === 'overdue' ? '#fff9f9' : 'transparent' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{b.address}</td>
                        <td style={{ padding: '10px 16px', fontSize: 12, color: '#4a5568' }}>{b.borrower_name}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: 13 }}>{b.payment_amount}</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, color: '#2e6da4' }}>—</td>
                        <td style={{ padding: '10px 16px', fontSize: 13, textAlign: 'center' }}>{b.due_day.replace(/\D/g,'')}</td>
                        <td style={{ padding: '10px 16px' }}>
                          {status === 'paid' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#f0fdf4', color: '#15803d' }}>✓ Paid</span>
                          : status === 'overdue' ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#fff5f5', color: '#b91c1c' }}>⚠ Overdue</span>
                          : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: '#f7f9fc', color: '#4a5568' }}>• Unpaid</span>}
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

      {modalOpen && modalBorrower && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '32px 36px', width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)' }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, marginBottom: 4 }}>Post Payment</h3>
            <p style={{ fontSize: 13, color: '#4a5568', marginBottom: 24, fontWeight: 300 }}>Recording payment for <strong>{modalBorrower.borrower_name}</strong><br/>{modalBorrower.address}</p>
            {modalMsg && <div style={modalMsg.startsWith('✓') ? s.okMsg : s.errMsg}>{modalMsg}</div>}
            <div style={{ marginBottom: 16 }}><label style={s.label}>Payment Amount ($)</label><input style={s.input} type="number" step="0.01" value={modalAmount} onChange={e => setModalAmount(e.target.value)}/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Payment Date</label><input style={s.input} type="date" value={modalDate} onChange={e => setModalDate(e.target.value)}/></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Payment Method</label><select style={s.input} value={modalMethod} onChange={e => setModalMethod(e.target.value)}><option>Bank Deposit</option><option>Drop Off</option><option>Online (Equity Trust)</option><option>Other</option></select></div>
            <div style={{ marginBottom: 16 }}><label style={s.label}>Notes (optional)</label><textarea style={{ ...s.input, resize: 'vertical', minHeight: 70 }} value={modalNotes} onChange={e => setModalNotes(e.target.value)} placeholder="e.g. partial payment, late fee included..."/></div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: '1px solid #dce4ed', color: '#4a5568', padding: '11px 20px', borderRadius: 5, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              <button onClick={submitPayment} disabled={modalLoading} style={{ flex: 1, background: '#15803d', color: '#fff', border: 'none', padding: '11px', borderRadius: 5, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: modalLoading ? .7 : 1 }}>{modalLoading ? 'Posting...' : '✓ Post Payment & Notify Brad'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
