import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'LWAW Investments — Loan Portal',
  description: 'Borrower portal for LWAW Investments, LLC — Amarillo, TX',
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>)
}