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
