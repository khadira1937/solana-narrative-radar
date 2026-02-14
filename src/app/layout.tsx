import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana Narrative Radar',
  description: 'Fortnightly, explainable signals → emerging narratives → actionable build ideas.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* simple top glow bar for a more "WP theme" vibe */}
        <div style={{ position: 'fixed', inset: '0 0 auto 0', height: 2, background: 'linear-gradient(90deg, rgba(55,197,179,0.75), rgba(97,61,255,0.75))', opacity: 0.6, zIndex: 50 }} />
        {children}
      </body>
    </html>
  )
}
