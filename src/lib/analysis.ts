import type { Narrative, RunPayload } from './types'
import { clusterByTopics, narrativeFromCluster } from './narratives'
import { makeWindows, pctChange } from './windows'
import { fetchRepoCommitCountSince, fetchRepoMetrics } from './sources/github'
import { countRssInWindow, fetchRss } from './sources/rss'
import { fetchOnchainSignals } from './sources/solana'
import { CURATED_BLOGS, CURATED_DISCORD, CURATED_X } from './curated'

// Curated repo list (small on purpose; reproducible without rate-limit pain)
const DEFAULT_REPOS = [
  'solana-labs/solana',
  'coral-xyz/anchor',
  'metaplex-foundation/mpl-token-metadata',
  'jito-foundation/jito-solana',
  'helius-labs/helius-sdk',
]

const DEFAULT_FEEDS = [
  { name: 'Solana Blog', url: 'https://solana.com/rss.xml' },
  { name: 'Helius Blog', url: 'https://www.helius.dev/blog/rss.xml' },
  { name: 'Solana Compass', url: 'https://solanacompass.com/rss' },
  // More ecosystem discourse sources (public + reproducible)
  { name: 'Solana Foundation Medium', url: 'https://medium.com/feed/solana-foundation' },
  { name: 'Jito Blog', url: 'https://www.jito.network/blog/rss.xml' },
  // These may occasionally break; fetchRss() safely ignores broken feeds.
  { name: 'Metaplex (news)', url: 'https://www.metaplex.com/rss.xml' },
  // If station RSS breaks, it will be ignored safely.
  { name: 'Jupiter (station)', url: 'https://station.jup.ag/rss.xml' },
  { name: 'Messari (Solana tag)', url: 'https://messari.io/rss?tags=solana' },
  // Some outlets don’t offer stable RSS; we keep them as curated links in /api/report.
]


// This is intentionally simple + transparent.
// In 48h, explainability > fancy ML.
function scoreFromSignals(signals: {
  onchainPct?: number
  githubPct?: number
  rssPct?: number
  bonus?: number
}) {
  const a = Math.min(40, Math.max(0, (signals.onchainPct || 0) / 5))
  const b = Math.min(35, Math.max(0, (signals.githubPct || 0) / 5))
  const c = Math.min(20, Math.max(0, (signals.rssPct || 0) / 10))
  const d = Math.min(5, Math.max(0, signals.bonus || 0))
  return Math.round((a + b + c + d) * 10) / 10
}

export async function generateRun(): Promise<RunPayload> {
  const now = new Date()
  const windows = makeWindows(now)

  const [repos, feeds, onchain] = await Promise.all([
    fetchRepoMetrics(DEFAULT_REPOS),
    fetchRss(DEFAULT_FEEDS, 30),
    fetchOnchainSignals({ current: windows.current, previous: windows.previous, limit: 1000 }),
  ])

  const rssCur = countRssInWindow(feeds, windows.current)
  const rssPrev = countRssInWindow(feeds, windows.previous)
  const rssPct = pctChange(rssPrev, rssCur)

  // Commit activity across curated repos
  const sinceCur = windows.current.from.toISOString()
  const sincePrev = windows.previous.from.toISOString()
  // We'll approximate: commits in last 14d vs commits in last 28d, then infer previous 14d.
  const commitCounts28d = await Promise.all(DEFAULT_REPOS.map((r) => fetchRepoCommitCountSince(r, sincePrev)))
  const commitCounts14d = await Promise.all(DEFAULT_REPOS.map((r) => fetchRepoCommitCountSince(r, sinceCur)))
  const commits28d = commitCounts28d.reduce((a, b) => a + b, 0)
  const commits14d = commitCounts14d.reduce((a, b) => a + b, 0)
  const commitsPrev14d = Math.max(0, commits28d - commits14d)
  const commitsPct = pctChange(commitsPrev14d, commits14d)

  const baseNarratives: Narrative[] = [
    {
      id: 'onchain-program-velocity',
      title: 'On-chain shipping velocity is accelerating (program upgrades/deploys)',
      score: scoreFromSignals({ onchainPct: onchain.pctChangeUpgradeableLoader, githubPct: commitsPct, rssPct: rssPct, bonus: 2 }),
      summary:
        'We approximate Solana “shipping velocity” by counting recent BPF Upgradeable Loader transactions and comparing fortnight-over-fortnight. Spikes can indicate launch waves or rapid iteration by teams.',
      evidence: [
        {
          label: 'Upgradeable Loader tx (current 14d vs previous 14d)',
          value: onchain.upgradeableLoaderTxCountCurrent,
          delta: onchain.upgradeableLoaderTxCountCurrent - onchain.upgradeableLoaderTxCountPrevious,
          pctChange: onchain.pctChangeUpgradeableLoader,
          notes: `Current=${onchain.upgradeableLoaderTxCountCurrent}, Prev=${onchain.upgradeableLoaderTxCountPrevious}. Sample sigs: ${onchain.sampleSignatures.slice(0, 3).join(', ')}…`,
        },
      ],
      ideas: [
        'A “Program Launch Radar” that highlights newly-upgraded programs + first-user growth hints.',
        'A release-cadence tracker for protocol teams (upgrade frequency, deploy anomalies, changelog reminders).',
        'A “Program health page” generator (explainers + usage + risk flags) for any program id.',
      ],
    },
    {
      id: 'dev-activity-fortnight',
      title: 'Developer activity is rising (commit momentum across core repos)',
      score: scoreFromSignals({ githubPct: commitsPct, rssPct: rssPct, onchainPct: onchain.pctChangeUpgradeableLoader, bonus: 1 }),
      summary:
        'We track commit counts on a curated set of Solana core repos and compare the last fortnight against the prior fortnight. This helps surface early infra/tooling narratives.',
      evidence: [
        {
          label: 'Commits across curated repos (current 14d vs previous 14d)',
          value: commits14d,
          delta: commits14d - commitsPrev14d,
          pctChange: commitsPct,
          notes: `Curated repos: ${DEFAULT_REPOS.join(', ')}`,
        },
        ...repos.slice(0, 5).map((r) => ({
          label: `GitHub repo snapshot: ${r.fullName}`,
          notes: `stars=${r.stars}, forks=${r.forks}, openIssues=${r.openIssues}, pushedAt=${r.pushedAt}`,
          sourceUrl: `https://github.com/${r.fullName}`,
        })),
      ],
      ideas: [
        'A Solana “DX Momentum” dashboard ranking repos by releases + commits + issue velocity.',
        'An automated PR reviewer specialized for Solana program safety (account constraints, signer checks).',
        'A production-ready dApp scaffold generator (program + indexer + UI + tests) keyed by narrative.',
      ],
    },
    {
      id: 'discourse-signal',
      title: 'Ecosystem discourse is picking up (research/blog cadence)',
      score: scoreFromSignals({ rssPct: rssPct, githubPct: commitsPct, bonus: 1 }),
      summary:
        'We treat research/blog cadence as a weak-but-useful leading signal: when publishing volume rises, it often precedes new build waves. We count RSS items per fortnight and show citations.',
      evidence: [
        {
          label: 'RSS items (current 14d vs previous 14d)',
          value: rssCur,
          delta: rssCur - rssPrev,
          pctChange: rssPct,
          notes: `Feeds: ${DEFAULT_FEEDS.map((f) => f.name).join(', ')}`,
        },
        ...feeds.slice(0, 10).map((it) => ({
          label: `RSS: ${it.source}`,
          notes: it.title,
          sourceUrl: it.link,
        })),
      ],
      ideas: [
        'A fortnightly narrative memo generator with citations + on-chain supporting charts.',
        'A “build ideas board” that maps narratives to user pain points + existing competitors.',
        'A “signal-to-spec” tool that turns a narrative into a PRD + milestones + UX wireframes.',
      ],
    },
  ]

  // Topic clustering from RSS headlines to increase narrative originality (8–12 narratives)
  const rssClusters = clusterByTopics(feeds)
  const topicNarratives = rssClusters
    .map((c) => {
      const inWin = (d: string | undefined, from: Date, to: Date) => {
        if (!d) return false
        const t = new Date(d).getTime()
        return Number.isFinite(t) && t >= from.getTime() && t < to.getTime()
      }

      const curHits = c.hits.filter((h) => inWin(h.pubDate, windows.current.from, windows.current.to))
      const prevHits = c.hits.filter((h) => inWin(h.pubDate, windows.previous.from, windows.previous.to))
      const cur = curHits.length
      const prev = prevHits.length
      const pct = pctChange(prev, cur)

      // If a topic has zero mentions this fortnight, it isn't an "emerging" narrative right now.
      if (cur === 0) return null

      const score = scoreFromSignals({
        rssPct: pct,
        githubPct: commitsPct,
        onchainPct: onchain.pctChangeUpgradeableLoader,
        bonus: Math.min(3, cur / 3),
      })

      return narrativeFromCluster({
        topic: c.topic,
        hits: curHits,
        score,
        rssCur: cur,
        rssPrev: prev,
        rssPct: pct,
      })
    })
    .filter(Boolean) as Narrative[]

  const narratives: Narrative[] = [...baseNarratives, ...topicNarratives].slice(0, 12)

  const payload: RunPayload = {
    windowFrom: windows.current.from.toISOString(),
    windowTo: windows.current.to.toISOString(),
    narratives,
    sources: {
      windows: {
        current: { from: windows.current.from.toISOString(), to: windows.current.to.toISOString() },
        previous: { from: windows.previous.from.toISOString(), to: windows.previous.to.toISOString() },
      },
      solana: {
        rpc: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
        method: 'getSignaturesForAddress(BPFLoaderUpgradeable)',
        limit: 1000,
      },
      github: {
        repos: DEFAULT_REPOS,
        tokenUsed: Boolean(process.env.GITHUB_TOKEN),
        method: 'repos/{full_name} + commits?since=... (capped to 3 pages)'
      },
      rss: { feeds: DEFAULT_FEEDS },
      scoring:
        'score = clamp(onchain_pct/5,0..40)+clamp(github_pct/5,0..35)+clamp(rss_pct/10,0..20)+bonus(0..5). Deltas are fortnight-over-fortnight.',
      notes:
        'Prototype: prioritizes explainability and reproducibility. Extend with richer on-chain metrics (unique wallets, program-level usage spikes) and additional discourse sources.',
      curated: {
        x: CURATED_X,
        discord: CURATED_DISCORD,
        blogs: CURATED_BLOGS,
      },
    },
  }

  return payload
}
