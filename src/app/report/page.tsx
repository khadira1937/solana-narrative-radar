'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [md, setMd] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/report')
        if (!res.ok) throw new Error(`Failed to load report: ${res.status}`)
        const text = await res.text()
        setMd(text)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="panel px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Fortnight Report</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Judge-friendly markdown export of narratives, evidence, and build ideas.
            </p>
          </div>
          <Link className="btn-ghost" href="/">
            Back to dashboard
          </Link>
        </div>
      </div>

      {loading && <div className="mt-6 panel p-6 text-sm" style={{ color: 'var(--muted)' }}>Loading…</div>}
      {error && <div className="mt-6 panel-2 p-6 text-sm" style={{ color: 'rgba(255,210,214,0.95)' }}>{error}</div>}

      {!loading && !error && (
        <pre
          className="mt-6 whitespace-pre-wrap break-words rounded-xl p-6 text-sm"
          style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', color: 'rgba(234,252,250,0.88)' }}
        >
          {md}
        </pre>
      )}
    </main>
  )
}
