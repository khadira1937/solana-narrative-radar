import Link from 'next/link'

type LatestResponse = { ok: boolean; latest: null | { windowFrom: string; windowTo: string; narratives: unknown; sources?: unknown } }

async function getLatest(): Promise<LatestResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/latest`, { cache: 'no-store' })
  try {
    return (await res.json()) as LatestResponse
  } catch {
    return { ok: true, latest: null }
  }
}

export default async function Home() {
  const data = await getLatest()
  const latest = data.latest
  type NarrativeView = {
    id: string
    title: string
    score: number
    summary: string
    evidence?: { label: string; notes?: string; value?: string | number; sourceUrl?: string }[]
    ideas?: string[]
  }

  const rawNarratives: unknown = (latest as unknown as { narratives?: unknown })?.narratives
  const narratives: NarrativeView[] = Array.isArray(rawNarratives) ? (rawNarratives as NarrativeView[]) : []

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Solana Narrative Radar</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Fortnightly, explainable signals → emerging narratives → actionable build ideas.
          </p>
        </div>
        <form action="/api/run" method="post">
          <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
            Run analysis
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-lg border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-medium">Latest run:</span>{' '}
            {latest ? new Date(latest.windowTo).toLocaleString() : 'No runs yet.'}
          </div>
          {latest && (
            <div className="text-xs text-zinc-600">
              Window: {new Date(latest.windowFrom).toLocaleDateString()} → {new Date(latest.windowTo).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {narratives.length === 0 ? (
          <div className="rounded-lg border bg-white p-6 text-sm text-zinc-700">
            Click <span className="font-medium">Run analysis</span> to generate the first fortnightly report.
          </div>
        ) : (
          narratives
            .slice()
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((n) => (
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
                      {(n.evidence || []).slice(0, 4).map((e: { label: string; notes?: string; value?: string | number; sourceUrl?: string }, idx: number) => (
                        <li key={idx}>
                          <div className="font-medium">{e.label}</div>
                          <div className="text-xs text-zinc-600">{e.notes || e.value}</div>
                          {e.sourceUrl && (
                            <Link href={e.sourceUrl} className="text-xs text-blue-600 hover:underline" target="_blank">
                              Source
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md bg-zinc-50 p-4">
                    <div className="text-sm font-medium">Build ideas (3–5)</div>
                    <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-zinc-700">
                      {(n.ideas || []).map((idea: string, idx: number) => (
                        <li key={idx}>{idea}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>

      {latest?.sources && (
        <div className="mt-10 rounded-lg border bg-white p-6">
          <h3 className="text-base font-semibold">Sources & methodology (prototype)</h3>
          <pre className="mt-3 overflow-auto rounded-md bg-zinc-950 p-4 text-xs text-zinc-100">
            {JSON.stringify(latest.sources, null, 2)}
          </pre>
        </div>
      )}

      <footer className="mt-10 text-xs text-zinc-500">
        Built for the Superteam Earn agent bounty. Prioritizes explainability + reproducibility over volume.
      </footer>
    </main>
  )
}
