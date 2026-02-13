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

export async function fetchRepoMetrics(repos: string[]): Promise<RepoMetric[]> {
  const out: RepoMetric[] = []
  for (const fullName of repos) {
    const res = await fetch(`https://api.github.com/repos/${fullName}`, { headers: ghHeaders(), next: { revalidate: 0 } })
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
  }
  return out
}

export async function fetchRepoCommitCountSince(fullName: string, sinceIso: string): Promise<number> {
  // GitHub paginates. We'll fetch up to 3 pages (300 commits) to keep it lightweight.
  let page = 1
  let count = 0
  while (page <= 3) {
    const res = await fetch(
      `https://api.github.com/repos/${fullName}/commits?since=${encodeURIComponent(sinceIso)}&per_page=100&page=${page}`,
      { headers: ghHeaders(), next: { revalidate: 0 } }
    )
    if (!res.ok) return count
    const j = (await res.json()) as unknown
    if (!Array.isArray(j)) return count
    count += j.length
    if (j.length < 100) break
    page += 1
  }
  return count
}
