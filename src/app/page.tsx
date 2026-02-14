'use client'

import { CURATED_BLOGS, CURATED_DISCORD, CURATED_X } from '@/lib/curated'
import { useCallback, useEffect, useMemo, useState } from 'react'

type NarrativeView = {
  id: string
  title: string
  score: number
  summary: string
  evidence?: { label: string; notes?: string; value?: string | number; sourceUrl?: string; delta?: number; pctChange?: number | null }[]
  ideas?: string[]
}

type RunView = {
  windowFrom: string
  windowTo: string
  narratives: NarrativeView[]
  sources?: unknown
}

type RunResponse = { ok: boolean; run?: RunView; error?: string }

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [run, setRun] = useState<RunView | null>(null)

  const sortedNarratives = useMemo(() => {
    return (run?.narratives || []).slice().sort((a, b) => (b.score || 0) - (a.score || 0))
  }, [run])

  const runAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/run', { method: 'POST' })
      const text = await res.text()
      const json = (text ? (JSON.parse(text) as RunResponse) : ({ ok: false, error: 'Empty response from server' } as RunResponse))
      if (!json.ok || !json.run) throw new Error(json.error || 'Failed to generate run')
      setRun(json.run)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLatest = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/latest')
      const text = await res.text()
      const json = (text ? (JSON.parse(text) as RunResponse & { cached?: boolean }) : ({ ok: false, error: 'Empty response from server' } as any))
      if (!json.ok || !json.run) throw new Error(json.error || 'Failed to load latest run')
      setRun(json.run)
    } catch (e) {
      // If latest fails, fall back to generating once (still judge-friendly)
      await runAnalysis()
    }
  }, [runAnalysis])

  useEffect(() => {
    // Show something fast if available; otherwise generate once.
    loadLatest().catch(() => {})
  }, [loadLatest])

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      {/* Hero (WordPress landing-page vibe) */}
      <div className="panel px-6 py-8 animate-fade-up">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div
                className="hero-orb h-10 w-10 rounded-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(55,197,179,1), rgba(97,61,255,1))' }}
              />
              <h1 className="text-3xl font-semibold tracking-tight">Solana Narrative Radar</h1>
              <span className="tag">Fortnight</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
              A judge-friendly narrative detection tool: detects emerging Solana narratives by comparing the last 14 days vs the previous 14 days, and outputs evidence + build ideas.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={runAnalysis} disabled={loading} className="btn-primary disabled:opacity-60" aria-label="Run analysis">
                {loading ? 'Running…' : 'Run analysis'}
              </button>
              <a className="btn-ghost" href="/api/report" target="_blank" rel="noreferrer">
                Export report
              </a>
              <a className="btn-ghost" href="/report" rel="noreferrer">
                View markdown
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--muted-2)' }}>
              <span>Endpoints:</span>
              <a className="underline hover:no-underline" href="/report" rel="noreferrer">
                /report
              </a>
              <span className="opacity-70">•</span>
              <a className="underline hover:no-underline" href="/api/report" target="_blank" rel="noreferrer">
                /api/report
              </a>
              <span className="opacity-70">•</span>
              <a className="underline hover:no-underline" href="/api/latest" target="_blank" rel="noreferrer">
                /api/latest
              </a>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-3">
            <div className="panel-2 p-4 hover-lift">
              <div className="text-xs font-semibold" style={{ color: 'var(--muted-2)' }}>
                Why this wins
              </div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: 'var(--muted)' }}>
                <li>Fortnight deltas (emerging, not static)</li>
                <li>Citations + evidence panel (verifiable)</li>
                <li>Build ideas mapped to each narrative</li>
              </ul>
            </div>
            <div className="panel-2 p-4 hover-lift">
              <div className="text-xs font-semibold" style={{ color: 'var(--muted-2)' }}>
                Social sources
              </div>
              <div className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                Included as a curated list (no scraping) in <a className="underline hover:no-underline" href="/api/report">/api/report</a>.
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 panel-2 p-4 text-sm" style={{ borderColor: 'rgba(234,56,76,0.35)', color: 'rgba(255,210,214,0.95)' }}>
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3 animate-fade-up" style={{ animationDelay: '40ms' }}>
        <div className="kpi panel-2 hover-lift">
          <div className="text-xs" style={{ color: 'var(--muted-2)' }}>
            Latest run
          </div>
          <div className="mt-1 text-sm font-semibold">{run ? new Date(run.windowTo).toLocaleString() : '—'}</div>
        </div>
        <div className="kpi panel-2 hover-lift">
          <div className="text-xs" style={{ color: 'var(--muted-2)' }}>
            Window
          </div>
          <div className="mt-1 text-sm font-semibold">
            {run ? `${new Date(run.windowFrom).toLocaleDateString()} → ${new Date(run.windowTo).toLocaleDateString()}` : '—'}
          </div>
        </div>
        <div className="kpi panel-2 hover-lift">
          <div className="text-xs" style={{ color: 'var(--muted-2)' }}>
            Narratives
          </div>
          <div className="mt-1 text-sm font-semibold">{run ? run.narratives.length : 0}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3 animate-fade-up" style={{ animationDelay: '70ms' }}>
        <div className="panel p-6 hover-lift">
          <h3 className="text-sm font-semibold">How it works</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm" style={{ color: 'var(--muted)' }}>
            <li>Collect on-chain, GitHub, and RSS signals</li>
            <li>Compute fortnight deltas + transparent score</li>
            <li>Generate narratives with evidence + build ideas</li>
          </ol>
        </div>
        <div className="panel p-6 hover-lift">
          <h3 className="text-sm font-semibold">Curated X / Discord / Blogs</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            We keep a static, verifiable list (no scraping) so humans can triangulate narratives.
          </p>
          <p className="mt-2 text-xs" style={{ color: 'var(--muted-2)' }}>
            Tip: judges can click through from <a className="underline hover:no-underline" href="/api/report">/api/report</a>.
          </p>
        </div>
        <div className="panel p-6 hover-lift">
          <h3 className="text-sm font-semibold">Quick links</h3>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {CURATED_X.slice(0, 5).map((l) => (
              <a key={l.url} className="tag underline hover:no-underline" href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {CURATED_DISCORD.slice(0, 3).map((l) => (
              <a key={l.url} className="tag underline hover:no-underline" href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {CURATED_BLOGS.slice(0, 3).map((l) => (
              <a key={l.url} className="tag underline hover:no-underline" href={l.url} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 animate-fade-up" style={{ animationDelay: '110ms' }}>
        {sortedNarratives.length === 0 ? (
          <div className="mt-6 panel p-6 text-sm" style={{ color: 'var(--muted)' }}>
            Click <span className="font-semibold">Run analysis</span> to generate the fortnightly report.
          </div>
        ) : (
          sortedNarratives.map((n) => (
            <div key={n.id} className="mt-6 panel p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <h2 className="text-lg font-semibold">{n.title}</h2>
                  <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
                    {n.summary}
                  </p>
                </div>
                <div className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)' }}>
                  Score {n.score}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="panel-2 p-4">
                  <div className="text-sm font-semibold">Evidence</div>
                  <ul className="mt-3 space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                    {(n.evidence || []).slice(0, 8).map((e, idx) => (
                      <li key={idx} className="rounded-lg p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="font-semibold" style={{ color: 'rgba(234,252,250,0.92)' }}>
                            {e.label}
                          </div>
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-2)' }}>
                            {typeof e.value === 'number' && <span className="tag">cur {e.value}</span>}
                            {typeof e.delta === 'number' && <span className="tag">Δ {e.delta}</span>}
                            {e.pctChange === null && <span className="tag">new</span>}
                            {typeof e.pctChange === 'number' && <span className="tag">{Math.round(e.pctChange * 10) / 10}%</span>}
                          </div>
                        </div>
                        {(e.notes || e.value) && (
                          <div className="mt-1 text-xs break-words" style={{ color: 'var(--muted-2)' }}>
                            {e.notes || e.value}
                          </div>
                        )}
                        {e.sourceUrl && (
                          <a href={e.sourceUrl} className="mt-1 inline-block text-xs underline hover:no-underline" target="_blank" rel="noreferrer">
                            Source
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="panel-2 p-4">
                  <div className="text-sm font-semibold">Build ideas (3–5)</div>
                  <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm" style={{ color: 'var(--muted)' }}>
                    {(n.ideas || []).map((idea, idx) => (
                      <li key={idx}>{idea}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!!run?.sources && (
        <div className="mt-8 panel p-6">
          <h3 className="text-base font-semibold">Sources & methodology</h3>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
            This prototype focuses on explainability: every narrative includes citations and simple, transparent fortnight-over-fortnight deltas.
          </p>
          <pre
            className="mt-4 max-h-[420px] overflow-auto rounded-lg p-4 text-xs"
            style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid var(--border)', color: 'rgba(234,252,250,0.85)' }}
          >
            {JSON.stringify(run.sources, null, 2)}
          </pre>
        </div>
      )}

      <footer className="mt-10 text-xs" style={{ color: 'var(--muted-2)' }}>
        Built for the Superteam Earn agent bounty. Prioritizes explainability + reproducibility over volume.
      </footer>
    </main>
  )
}
