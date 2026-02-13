import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Solana Narrative Radar',
  description: 'Fortnightly, explainable signals → emerging narratives → actionable build ideas.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased bg-zinc-50 text-zinc-900">{children}</body>
    </html>
  )
}
