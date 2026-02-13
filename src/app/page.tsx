'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type NarrativeView = {
  id: string
  title: string
  score: number
  summary: string
  evidence?: { label: string; notes?: string; value?: string | number; sourceUrl?: string }[]
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
      const json = (await res.json()) as RunResponse
      if (!json.ok || !json.run) throw new Error(json.error || 'Failed to generate run')
      setRun(json.run)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // auto-run once for a nice hosted demo
    runAnalysis().catch(() => {})
  }, [runAnalysis])

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Solana Narrative Radar</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Fortnightly, explainable signals → emerging narratives → actionable build ideas.
          </p>
        </div>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? 'Running…' : 'Run analysis'}
        </button>
      </div>

      {error && <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      <div className="mt-8 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">Latest run:</span>{' '}
            {run ? new Date(run.windowTo).toLocaleString() : 'No runs yet.'}
          </div>
          {run && (
            <div className="text-xs text-zinc-600">
              Window: {new Date(run.windowFrom).toLocaleDateString()} → {new Date(run.windowTo).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {sortedNarratives.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-zinc-700">
            Click <span className="font-medium">Run analysis</span> to generate the fortnightly report.
          </div>
        ) : (
          sortedNarratives.map((n) => (
            <div key={n.id} className="rounded-lg border bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{n.title}</h2>
                  <p className="mt-2 text-sm text-zinc-700">{n.summary}</p>
                </div>
                <div className="shrink-0 rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold">Score {n.score}</div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-md bg-zinc-50 p-4">
                  <div className="text-sm font-medium">Evidence</div>
                  <ul className="mt-2 space-y-2 text-sm text-zinc-700">
                    {(n.evidence || []).slice(0, 6).map((e, idx) => (
                      <li key={idx}>
                        <div className="font-medium">{e.label}</div>
                        <div className="text-xs text-zinc-600">{e.notes || e.value}</div>
                        {e.sourceUrl && (
                          <a href={e.sourceUrl} className="text-xs text-blue-600 hover:underline" target="_blank" rel="noreferrer">
                            Source
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md bg-zinc-50 p-4">
                  <div className="text-sm font-medium">Build ideas (3–5)</div>
                  <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
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

      {run?.sources && (
        <div className="mt-10 rounded-lg border bg-white p-6">
          <h3 className="text-base font-semibold">Sources & methodology (prototype)</h3>
          <pre className="mt-3 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
            {JSON.stringify(run.sources, null, 2)}
          </pre>
        </div>
      )}

      <footer className="mt-10 text-xs text-zinc-500">
        Built for the Superteam Earn agent bounty. Prioritizes explainability + reproducibility over volume.
      </footer>
    </main>
  )
}
