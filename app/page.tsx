'use client'
import { useState } from 'react'
import Link from 'next/link'

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
    aboutP2: 'We serve note holders by managing payment collection, escrow administration, insurance compliance monitoring, and borrower communications.',
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
      { q: 'How do I get my Form 1098?', a: 'Form 1098 is issued annually by end of January. Contact lwawinv@gmail.com if you have not received it by mid-February. We need your SSN or Tax ID on file.' },
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
    aboutP2: 'Servimos a los titulares de notas administrando la recaudacion de pagos, la administracion del deposito en garantia, el monitoreo de cumplimiento de seguros y las comunicaciones con los prestatarios.',
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
      { q: 'Que pasa si no pago los impuestos de la propiedad?', a: 'Los impuestos de propiedad no pagados son un incumplimiento de su contrato de prestamo. La falta de pago antes del 31 de enero puede resultar en multas, accion de cobro por parte del condado y, en ultima instancia, ejecucion hipotecaria. No ignore esto — contactenos de inmediato si no puede pagar.' },
      { q: 'Cuales son mis requisitos de seguro?', a: 'Se requiere seguro de propiedad activo en todo momento. Su poliza debe incluir a los titulares de gravamenes correctos. Inicie sesion en el Portal del Prestatario para ver los titulares de gravamenes de su propiedad. Envie las polizas a lwawinv@gmail.com.' },
      { q: 'Como obtengo mi Formulario 1098?', a: 'El Formulario 1098 se emite anualmente antes de fin de enero. Contactenos en lwawinv@gmail.com si no lo ha recibido para mediados de febrero.' },
    ],
  }
}

export default function HomePage() {
  const [lang, setLang] = useState<'en'|'es'>('en')
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const t = content[lang]

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>

      {/* NAV */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 5vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <svg width="30" height="30" viewBox="0 0 40 40" fill="none">
            <rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/>
            <path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/>
          </svg>
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div>
            <div style={{ fontSize: 9, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500 }}>LLC · Loan Servicer · Amarillo, TX</div>
          </div>
        </a>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => { setLang(l => l === 'en' ? 'es' : 'en'); setOpenFaq(null) }} style={{ background: '#f0f4f8', border: '1px solid #dce4ed', padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: '#1c2026', whiteSpace: 'nowrap' }}>
            {lang === 'en' ? 'ES' : 'EN'}
          </button>
          <a href="#contact" style={{ textDecoration: 'none', color: '#4a5568', fontSize: 13, fontWeight: 500 }}>Contact</a>
          <Link href="/portal" style={{ background: '#2e6da4', color: '#fff', padding: '8px 14px', borderRadius: 5, textDecoration: 'none', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>{t.borrowerBtn}</Link>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(150deg,#0d1218 0%,#152030 55%,#0e1f35 100%)', color: '#fff', padding: 'clamp(48px,8vw,90px) 5vw clamp(56px,9vw,100px)', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(110,180,240,.14)', border: '1px solid rgba(110,180,240,.28)', color: '#b8d8f4', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 18px', borderRadius: 20, marginBottom: 22 }}>
          {t.tagline}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(26px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, color: '#f4f8ff' }}>
          {t.hero}<br/><span style={{ color: '#7dc4f0' }}>{t.heroSpan}</span>
        </h1>
        <p style={{ fontSize: 'clamp(14px,2vw,17px)', color: '#c4d6e8', maxWidth: 540, margin: '0 auto 36px', fontWeight: 300 }}>
          {t.heroSub}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/portal" style={{ background: '#2e6da4', color: '#fff', padding: 'clamp(12px,2vw,15px) clamp(22px,4vw,34px)', borderRadius: 6, textDecoration: 'none', fontWeight: 700, fontSize: 'clamp(14px,2vw,17px)', border: '2px solid #4a8fc4', boxShadow: '0 4px 20px rgba(46,109,164,.4)' }}>
            {lang === 'en' ? '🔐 ' : '🔐 '}{t.borrowerBtn}
          </Link>
          <a href="#faq" style={{ background: 'transparent', color: '#f4f8ff', padding: 'clamp(12px,2vw,15px) clamp(22px,4vw,34px)', borderRadius: 6, textDecoration: 'none', fontWeight: 500, fontSize: 'clamp(14px,2vw,17px)', border: '2px solid rgba(255,255,255,.3)' }}>
            {t.questionsBtn}
          </a>
        </div>
      </div>

      {/* INFO STRIP */}
      <div style={{ background: '#111820', padding: 'clamp(36px,5vw,52px) 5vw' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 32 }}>
          {t.tiles.map((tile, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7dc4f0', marginBottom: 8, fontWeight: 600 }}>{tile.title}</div>
              <p style={{ fontSize: 14, color: '#c4d6e8', fontWeight: 300, lineHeight: 1.75 }}>{tile.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" style={{ padding: 'clamp(48px,6vw,72px) 5vw', background: '#f7f9fc' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 8 }}>{t.faqTitle}</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(22px,3vw,36px)', marginBottom: 10 }}>{t.faqSub}</h2>
          <p style={{ color: '#4a5568', fontSize: 15, maxWidth: 580, marginBottom: 32, fontWeight: 300 }}>{t.faqDesc}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            {t.faqs.map((faq, i) => (
              <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '18px 20px', cursor: 'pointer' }}>
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

      {/* ABOUT */}
      <section id="about" style={{ padding: 'clamp(48px,6vw,72px) 5vw', background: '#fff' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,#0d1a28,#173352)', borderRadius: 12, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity: .8 }}>
              <rect x="8" y="44" width="14" height="28" rx="2" fill="white"/><rect x="28" y="30" width="14" height="42" rx="2" fill="white"/><rect x="48" y="14" width="14" height="58" rx="2" fill="white"/>
              <path d="M12 56 Q40 20 68 12" stroke="#7dc4f0" strokeWidth="4" fill="none" strokeLinecap="round"/><polygon points="68,6 76,18 60,18" fill="#7dc4f0"/>
            </svg>
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

      {/* CONTACT */}
      <div id="contact" style={{ background: '#131d2a', color: '#fff', padding: 'clamp(40px,6vw,60px) 5vw', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f4f8ff', marginBottom: 8, fontSize: 'clamp(20px,3vw,32px)' }}>{t.contactTitle}</h2>
        <p style={{ color: '#a8c0d6', marginBottom: 28, fontWeight: 300, fontSize: 15 }}>{t.contactSub}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[
            { icon: '📞', text: '806-680-3556', href: 'tel:8066803556' },
            { icon: '📧', text: 'lwawinv@gmail.com', href: 'mailto:lwawinv@gmail.com' },
            { icon: '🔐', text: t.borrowerBtn, href: '/portal' },
          ].map((pill, i) => (
            <a key={i} href={pill.href} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.16)', padding: '10px 18px', borderRadius: 6, color: '#e8f2ff', textDecoration: 'none', fontSize: 14 }}>
              <span>{pill.icon}</span>{pill.text}
            </a>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ background: '#0a0f18', color: '#3e5066', padding: '24px 5vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12 }}>
        <span>© 2026 LWAW Investments, LLC · Amarillo, Texas</span>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="#faq" style={{ color: '#3e5066', textDecoration: 'none' }}>FAQ</a>
          <Link href="/portal" style={{ color: '#3e5066', textDecoration: 'none' }}>Borrower Login</Link>
          <a href="mailto:lwawinv@gmail.com" style={{ color: '#3e5066', textDecoration: 'none' }}>Contact</a>
        </div>
        <span style={{ maxWidth: 380 }}>{t.footerDisclaimer}</span>
      </footer>
    </div>
  )
}
