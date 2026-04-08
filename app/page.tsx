'use client'
import { useState } from 'react'
import Link from 'next/link'

const faqs = [
  { q: 'What does LWAW Investments do?', a: 'LWAW Investments, LLC is a third-party loan servicer for seller-financed real estate notes in Amarillo, Texas. We process payments, manage escrow, monitor insurance, and handle borrower communications on behalf of note holders. LWAW is the servicer — notes are originated and held by separate lending entities.' },
  { q: 'Who is my lender?', a: 'Your lender is the entity listed on your promissory note. LWAW Investments services the loan on their behalf. Log in to the Borrower Portal to see your specific lending entity and lien holder information.' },
  { q: 'How do I make my monthly payment?', a: 'Payments are made by bank deposit to your designated account. Each loan has a specific bank and account number — log in to the Borrower Portal to see yours. After every deposit, text a photo of your deposit slip to 806-680-3556 so we can confirm receipt.' },
  { q: 'What if I cannot make my payment on time?', a: 'Contact us immediately at 806-680-3556 or lwawinv@gmail.com. The sooner you communicate, the more options we have. Loans 30+ days past due without communication are referred to attorneys.' },
  { q: 'Who is responsible for property taxes?', a: 'It depends on your loan. Some loans include tax escrow — we pay taxes on your behalf. Other loans require you to pay directly by January 31st each year. Log in to the Borrower Portal to see your escrow status.' },
  { q: 'What are my insurance requirements?', a: 'Active property insurance is required at all times. Your policy must list the correct lien holders. Log in to the Borrower Portal to see the exact lien holders for your property. Send policies to lwawinv@gmail.com.' },
  { q: 'What is escrow and do I have it?', a: 'Escrow means a portion of your monthly payment is reserved for property taxes and/or insurance. Not all loans include escrow. Log in to the Borrower Portal to see your escrow status.' },
  { q: 'How do I get a payoff quote?', a: 'Contact Brad at lwawinv@gmail.com or 806-680-3556. We will provide your current balance, accrued interest, and any applicable fees.' },
  { q: 'I am an insurance agent — what lien holder info do you need?', a: 'Email lwawinv@gmail.com with the property address and we will provide exact lien holder language. Certificates can be sent directly to lwawinv@gmail.com.' },
  { q: 'I am a title company — who do I contact?', a: 'Contact Brad at lwawinv@gmail.com or 806-680-3556 for payoff quotes, lien releases, title commitments, and closing coordination.' },
  { q: 'How do I get my Form 1098?', a: 'Form 1098 is issued annually by end of January. Contact lwawinv@gmail.com if you have not received it by mid-February.' },
  { q: 'What happens if property taxes go unpaid?', a: 'Unpaid taxes are a serious default event. The county can place a superior lien on the property. If your loan does not include tax escrow, pay by January 31st and send proof to LWAW.' },
]

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #dce4ed', padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70, position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 8px rgba(0,0,0,.06)' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 13, textDecoration: 'none' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none"><rect x="4" y="22" width="7" height="14" rx="1" fill="#1c2026"/><rect x="14" y="15" width="7" height="21" rx="1" fill="#1c2026"/><rect x="24" y="7" width="7" height="29" rx="1" fill="#1c2026"/><path d="M6 28 Q20 10 34 8" stroke="#2e6da4" strokeWidth="2.5" fill="none" strokeLinecap="round"/><polygon points="34,4 38,10 30,10" fill="#2e6da4"/></svg>
          <div><div style={{ fontFamily: "'Playfair Display', serif", fontSize: 17, color: '#1c2026', fontWeight: 700 }}>LWAW Investments</div><div style={{ fontSize: 10, color: '#2e6da4', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500 }}>LLC · Loan Servicer · Amarillo, TX</div></div>
        </a>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          <a href="#faq" style={{ textDecoration: 'none', color: '#4a5568', fontSize: 14, fontWeight: 500 }}>FAQ</a>
          <a href="#about" style={{ textDecoration: 'none', color: '#4a5568', fontSize: 14, fontWeight: 500 }}>About</a>
          <a href="#contact" style={{ textDecoration: 'none', color: '#4a5568', fontSize: 14, fontWeight: 500 }}>Contact</a>
          <Link href="/portal" style={{ background: '#2e6da4', color: '#fff', padding: '8px 20px', borderRadius: 4, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>Borrower Login</Link>
        </div>
      </nav>
      <div style={{ background: 'linear-gradient(150deg,#0d1218 0%,#152030 55%,#0e1f35 100%)', color: '#fff', padding: '90px 48px 100px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'rgba(110,180,240,.14)', border: '1px solid rgba(110,180,240,.28)', color: '#b8d8f4', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 18px', borderRadius: 20, marginBottom: 26 }}>Amarillo, Texas · Seller Finance Loan Servicing</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(30px,5vw,52px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 18, color: '#f4f8ff' }}>Professional Loan Servicing<br/>for <span style={{ color: '#7dc4f0' }}>Seller-Finance Notes</span></h1>
        <p style={{ fontSize: 17, color: '#c4d6e8', maxWidth: 530, margin: '0 auto 40px', fontWeight: 300 }}>LWAW Investments, LLC provides third-party loan servicing for seller-financed real estate transactions across the Texas Panhandle.</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/portal" style={{ background: '#2e6da4', color: '#fff', padding: '13px 30px', borderRadius: 5, textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>Borrower Login Portal</Link>
          <a href="#faq" style={{ background: 'transparent', color: '#f4f8ff', padding: '13px 30px', borderRadius: 5, textDecoration: 'none', fontWeight: 500, fontSize: 15, border: '2px solid rgba(255,255,255,.32)' }}>Common Questions</a>
        </div>
      </div>
      <div style={{ background: '#111820', padding: '52px 48px' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 36 }}>
          {[{title:'We Are the Servicer',body:'LWAW Investments is the loan servicer, not the lender. Your note is held by a separate lending entity.'},{title:'Investment Properties Only',body:'All loans serviced by LWAW are on non-owner-occupied investment properties.'},{title:'Borrower Portal',body:'Active borrowers can log in to access payment instructions, account numbers, lien holder details, escrow status, and payment history.'}].map((t,i)=>(
            <div key={i}><div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7dc4f0', marginBottom: 10, fontWeight: 600 }}>{t.title}</div><p style={{ fontSize: 14, color: '#c4d6e8', fontWeight: 300, lineHeight: 1.75 }}>{t.body}</p></div>
          ))}
        </div>
      </div>
      <section id="faq" style={{ padding: '72px 48px', background: '#f7f9fc' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 10 }}>Frequently Asked Questions</div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3vw,36px)', marginBottom: 14 }}>Common Questions</h2>
          <p style={{ color: '#4a5568', fontSize: 16, maxWidth: 580, marginBottom: 40, fontWeight: 300 }}>Answers for borrowers, insurance agents, title companies, and note holders.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {faqs.map((faq, i) => (
              <div key={i} onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ background: '#fff', border: '1px solid #dce4ed', borderRadius: 8, padding: '22px 26px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1c2026', display: 'flex', justifyContent: 'space-between', gap: 12, userSelect: 'none' }}>{faq.q}<span style={{ color: '#2e6da4', fontSize: 18, flexShrink: 0, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform .25s' }}>+</span></div>
                {openFaq === i && <p style={{ fontSize: 13.5, color: '#4a5568', lineHeight: 1.75, marginTop: 12, fontWeight: 300 }}>{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="about" style={{ padding: '72px 48px', background: '#fff' }}>
        <div style={{ maxWidth: 1020, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div style={{ background: 'linear-gradient(135deg,#0d1a28,#173352)', borderRadius: 12, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="90" height="90" viewBox="0 0 80 80" fill="none" style={{ opacity: .8 }}><rect x="8" y="44" width="14" height="28" rx="2" fill="white"/><rect x="28" y="30" width="14" height="42" rx="2" fill="white"/><rect x="48" y="14" width="14" height="58" rx="2" fill="white"/><path d="M12 56 Q40 20 68 12" stroke="#7dc4f0" strokeWidth="4" fill="none" strokeLinecap="round"/><polygon points="68,6 76,18 60,18" fill="#7dc4f0"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: '#2e6da4', fontWeight: 600, marginBottom: 12 }}>About LWAW</div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px,3vw,36px)', marginBottom: 14 }}>Experienced. Local. Responsive.</h2>
            <p style={{ color: '#4a5568', fontSize: 15, marginBottom: 16, fontWeight: 300 }}>LWAW Investments, LLC is a privately held loan servicing company based in Amarillo, Texas, specializing in third-party servicing of seller-financed notes on non-owner-occupied investment properties.</p>
            <p style={{ color: '#4a5568', fontSize: 15, fontWeight: 300 }}>Bilingual (English/Spanish) support, responsive communication, and deep local market knowledge.</p>
            <div style={{ display: 'flex', gap: 32, marginTop: 28 }}>
              <div><strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#2e6da4', display: 'block' }}>EN/ES</strong><span style={{ fontSize: 13, color: '#4a5568' }}>Bilingual support</span></div>
              <div><strong style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, color: '#2e6da4', display: 'block' }}>TX</strong><span style={{ fontSize: 13, color: '#4a5568' }}>Panhandle focused</span></div>
            </div>
          </div>
        </div>
      </section>
      <div id="contact" style={{ background: '#131d2a', color: '#fff', padding: '60px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: '#f4f8ff', marginBottom: 10, fontSize: 32 }}>Get in Touch</h2>
        <p style={{ color: '#a8c0d6', marginBottom: 32, fontWeight: 300, fontSize: 16 }}>Questions about a loan we service? Reach out directly.</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{icon:'📞',text:'806-680-3556',href:'tel:8066803556'},{icon:'📧',text:'lwawinv@gmail.com',href:'mailto:lwawinv@gmail.com'},{icon:'🔐',text:'Borrower Portal',href:'/portal'}].map((p,i)=>(
            <a key={i} href={p.href} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.16)', padding: '12px 22px', borderRadius: 6, color: '#e8f2ff', textDecoration: 'none', fontSize: 15 }}><span style={{ fontSize: 18 }}>{p.icon}</span>{p.text}</a>
          ))}
        </div>
      </div>
      <footer style={{ background: '#0a0f18', color: '#3e5066', padding: '36px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, fontSize: 13 }}>
        <span>© 2026 LWAW Investments, LLC · Amarillo, Texas</span>
        <div style={{ display: 'flex', gap: 24 }}><a href="#faq" style={{ color: '#3e5066', textDecoration: 'none' }}>FAQ</a><Link href="/portal" style={{ color: '#3e5066', textDecoration: 'none' }}>Borrower Login</Link><a href="mailto:lwawinv@gmail.com" style={{ color: '#3e5066', textDecoration: 'none' }}>Contact</a></div>
        <span>LWAW Investments, LLC is a loan servicer — not a lender or licensed mortgage company.</span>
      </footer>
    </div>
  )
}
