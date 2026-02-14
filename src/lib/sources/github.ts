import { z } from 'zod'

const RepoMetricSchema = z.object({
  fullName: z.string(),
  stars: z.number(),
  forks: z.number(),
  openIssues: z.number(),
  pushedAt: z.string(),
})

export type RepoMetric = z.infer<typeof RepoMetricSchema>

function ghHeaders() {
  const headers: Record<string, string> = {
    'User-Agent': 'solana-narrative-radar',
    Accept: 'application/vnd.github+json',
  }
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  return headers
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, init: RequestInit, tries = 4): Promise<Response> {
  let attempt = 0
  let lastErr: unknown = null
  while (attempt < tries) {
    try {
      const ac = new AbortController()
      const t = setTimeout(() => ac.abort(), 20000)
      const res = await fetch(url, { ...init, signal: ac.signal } as RequestInit)
      clearTimeout(t)

      // Handle GitHub rate limits / secondary limits
      if (res.status === 429 || res.status === 403) {
        const retryAfter = Number(res.headers.get('retry-after') || '')
        const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 800 + attempt * 900
        await sleep(Math.min(4000, wait))
        attempt++
        continue
      }

      return res
    } catch (e) {
      lastErr = e
      await sleep(Math.min(4000, 700 + attempt * 900))
      attempt++
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('fetchWithRetry failed')
}

export async function fetchRepoMetrics(repos: string[]): Promise<RepoMetric[]> {
  const out: RepoMetric[] = []
  for (const fullName of repos) {
    try {
      const res = await fetchWithRetry(`https://api.github.com/repos/${fullName}`, { headers: ghHeaders(), next: { revalidate: 0 } })
      if (!res.ok) continue
      const j = await res.json()
      const parsed = RepoMetricSchema.safeParse({
        fullName,
        stars: j.stargazers_count,
        forks: j.forks_count,
        openIssues: j.open_issues_count,
        pushedAt: j.pushed_at,
      })
      if (parsed.success) out.push(parsed.data)
    } catch {
      // degrade gracefully: partial results are fine for a demo
      continue
    }
  }
  return out
}

export async function fetchRepoCommitCountSince(fullName: string, sinceIso: string): Promise<number> {
  // GitHub paginates. We'll fetch up to 3 pages (300 commits) to keep it lightweight.
  let page = 1
  let count = 0
  while (page <= 3) {
    let res: Response
    try {
      res = await fetchWithRetry(
        `https://api.github.com/repos/${fullName}/commits?since=${encodeURIComponent(sinceIso)}&per_page=100&page=${page}`,
        { headers: ghHeaders(), next: { revalidate: 0 } },
      )
    } catch {
      return count
    }
    if (!res.ok) return count
    const j = (await res.json()) as unknown
    if (!Array.isArray(j)) return count
    count += j.length
    if (j.length < 100) break
    page += 1
  }
  return count
}

async function ghSearchCount(q: string): Promise<number> {
  try {
    const res = await fetchWithRetry(`https://api.github.com/search/issues?q=${encodeURIComponent(q)}&per_page=1`, {
      headers: { ...ghHeaders(), Accept: 'application/vnd.github+json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return 0
    const j = (await res.json()) as any
    return typeof j.total_count === 'number' ? j.total_count : 0
  } catch {
    return 0
  }
}

/**
 * Community/dev velocity proxy: opened issues + merged PRs in a time window.
 * Uses GitHub Search API (fast, returns total_count).
 */
export async function fetchRepoIssueAndPrCounts(params: {
  fullName: string
  fromIso: string
  toIso: string
}): Promise<{ openedIssues: number; mergedPrs: number }> {
  const repo = `repo:${params.fullName}`
  // created window
  const created = `created:${params.fromIso}..${params.toIso}`

  const [openedIssues, mergedPrs] = await Promise.all([
    ghSearchCount(`${repo} is:issue ${created}`),
    // merged PRs: we use merged: window for PRs
    ghSearchCount(`${repo} is:pr merged:${params.fromIso}..${params.toIso}`),
  ])

  return { openedIssues, mergedPrs }
}
