import type { Narrative, RunPayload } from './types'
import { clusterByTopics, narrativeFromCluster } from './narratives'
import { makeWindows, pctChange } from './windows'
import { fetchRepoCommitCountSince, fetchRepoIssueAndPrCounts, fetchRepoMetrics } from './sources/github'
import { countRssInWindow, fetchRss } from './sources/rss'
import { fetchOnchainSignals } from './sources/solana'
import { fetchXSignals } from './sources/x'
import { CURATED_BLOGS, CURATED_DISCORD, CURATED_X } from './curated'
import { ttl } from './ttlCache'

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
  socialPct?: number
  bonus?: number
}) {
  const a = Math.min(35, Math.max(0, (signals.onchainPct || 0) / 5))
  const b = Math.min(30, Math.max(0, (signals.githubPct || 0) / 5))
  const c = Math.min(15, Math.max(0, (signals.rssPct || 0) / 10))
  const s = Math.min(15, Math.max(0, (signals.socialPct || 0) / 10))
  const d = Math.min(5, Math.max(0, signals.bonus || 0))
  return Math.round((a + b + c + s + d) * 10) / 10
}

export async function generateRun(): Promise<RunPayload> {
  const now = new Date()
  const windows = makeWindows(now)

  const CACHE_MS = Number(process.env.SIGNALS_CACHE_MS || 10 * 60 * 1000) // 10 minutes

  const [repos, feeds, onchain, xSignals] = await Promise.all([
    ttl(`gh:metrics:${DEFAULT_REPOS.join(',')}`, CACHE_MS, () => fetchRepoMetrics(DEFAULT_REPOS)),
    ttl(`rss:${DEFAULT_FEEDS.map((f) => f.url).join('|')}`, CACHE_MS, () => fetchRss(DEFAULT_FEEDS, 30)),
    ttl(`sol:loader:${windows.current.from.toISOString()}:${windows.current.to.toISOString()}`, CACHE_MS, () =>
      fetchOnchainSignals({ current: windows.current, previous: windows.previous, limit: 300 }),
    ),
    ttl(`x:signals:${windows.current.from.toISOString()}:${windows.current.to.toISOString()}`, CACHE_MS, () =>
      fetchXSignals({ usernames: CURATED_X.map((l) => l.label), current: windows.current, previous: windows.previous }),
    ),
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

  // GitHub community/dev velocity: opened issues + merged PRs (Search API)
  const curFrom = windows.current.from.toISOString()
  const curTo = windows.current.to.toISOString()
  const prevFrom = windows.previous.from.toISOString()
  const prevTo = windows.previous.to.toISOString()

  const ghWindowCountsCur = await Promise.all(
    DEFAULT_REPOS.map((r) => fetchRepoIssueAndPrCounts({ fullName: r, fromIso: curFrom, toIso: curTo })),
  )
  const ghWindowCountsPrev = await Promise.all(
    DEFAULT_REPOS.map((r) => fetchRepoIssueAndPrCounts({ fullName: r, fromIso: prevFrom, toIso: prevTo })),
  )

  const openedIssuesCur = ghWindowCountsCur.reduce((a, b) => a + b.openedIssues, 0)
  const openedIssuesPrev = ghWindowCountsPrev.reduce((a, b) => a + b.openedIssues, 0)
  const mergedPrsCur = ghWindowCountsCur.reduce((a, b) => a + b.mergedPrs, 0)
  const mergedPrsPrev = ghWindowCountsPrev.reduce((a, b) => a + b.mergedPrs, 0)

  const issuesPct = pctChange(openedIssuesPrev, openedIssuesCur)
  const prsPct = pctChange(mergedPrsPrev, mergedPrsCur)
  const githubCommunityPct =
    issuesPct === null && prsPct === null
      ? 0
      : Math.round((((issuesPct ?? 0) + (prsPct ?? 0)) / 2) * 10) / 10

  const baseNarratives: Narrative[] = [
    {
      id: 'onchain-program-velocity',
      title: 'On-chain shipping velocity is accelerating (deploy/upgrade + wallet participation)',
      score: scoreFromSignals({
        onchainPct: onchain.pctChangeUpgradeableLoader ?? 0,
        githubPct: ((commitsPct ?? 0) + githubCommunityPct) / 2,
        rssPct: rssPct ?? 0,
        socialPct: xSignals.pctChangeTweets ?? 0,
        bonus: 2,
      }),
      summary:
        'We approximate Solana “shipping velocity” by counting BPF Upgradeable Loader activity and adding lightweight wallet-participation and failure-rate proxies. Spikes can indicate launch waves, rapid iteration, or infra churn.',
      evidence: [
        {
          label: 'Upgradeable Loader tx (current 14d vs previous 14d)',
          value: onchain.upgradeableLoaderTxCountCurrent,
          delta: onchain.upgradeableLoaderTxCountCurrent - onchain.upgradeableLoaderTxCountPrevious,
          pctChange: onchain.pctChangeUpgradeableLoader,
          notes: `Current=${onchain.upgradeableLoaderTxCountCurrent}, Prev=${onchain.upgradeableLoaderTxCountPrevious}${onchain.upgradeableLoaderTxCountPrevious === 0 && onchain.upgradeableLoaderTxCountCurrent > 0 ? ' (new activity; prev was 0)' : ''}. Sample sigs: ${onchain.sampleSignatures.slice(0, 3).join(', ')}…`,
        },
        ...(onchain.topUpgradedProgramsCurrent.length
          ? [
              {
                label: 'Top upgraded programs (sampled from current window)',
                notes: onchain.topUpgradedProgramsCurrent
                  .map((p) => `${p.programId} (x${p.upgrades}) — https://solscan.io/account/${p.programId}`)
                  .join(' | '),
              },
              ...(onchain.newlySeenUpgradedPrograms.length
                ? [
                    {
                      label: 'Newly-seen upgraded programs (launch proxy; sampled)',
                      notes: onchain.newlySeenUpgradedPrograms
                        .map((p) => `${p.programId} (x${p.upgrades}) — https://solscan.io/account/${p.programId}`)
                        .join(' | '),
                    },
                  ]
                : []),
            ]
          : []),
        {
          label: 'Unique fee payers in loader tx sample (wallet participation proxy)',
          value: process.env.ONCHAIN_HYDRATE === '0' ? 'disabled' : onchain.uniqueFeePayersCurrent,
          delta: process.env.ONCHAIN_HYDRATE === '0' ? undefined : onchain.uniqueFeePayersCurrent - onchain.uniqueFeePayersPrevious,
          pctChange: process.env.ONCHAIN_HYDRATE === '0' ? null : onchain.pctChangeUniqueFeePayers,
          notes:
            process.env.ONCHAIN_HYDRATE === '0'
              ? 'Disabled to avoid RPC rate limits. Set ONCHAIN_HYDRATE=1 to compute from a small sample.'
              : 'Computed from a small, reproducible sample of loader transactions (fast + explainable).',
        },
        {
          label: 'Failure rate in loader tx sample (stress proxy)',
          value: process.env.ONCHAIN_HYDRATE === '0' ? 'disabled' : `${onchain.failureRateCurrentPct}%`,
          notes:
            process.env.ONCHAIN_HYDRATE === '0'
              ? 'Disabled to avoid RPC rate limits. Set ONCHAIN_HYDRATE=1 to compute from a small sample.'
              : `Current=${onchain.failureRateCurrentPct}%, Prev=${onchain.failureRatePreviousPct}%`,
        },
      ],
      ideas: [
        'Target: protocol teams + analysts. MVP (1w): Program Launch Radar (top upgraded + newly-seen program IDs + Solscan links). Why now: loader activity is new/rising. Metric: report exports + clicks to explorers.',
        'Target: infra leads. MVP (1w): release-cadence tracker (upgrade frequency + anomaly alerts + changelog reminders). Why now: shipping velocity accelerating. Metric: alert CTR + subscriptions.',
        'Target: builders/users. MVP (1w): Program health page generator (activity + risks + citations) for any program ID. Why now: more programs upgrading. Metric: pages generated + shared.',
      ],
    },
    {
      id: 'dev-activity-fortnight',
      title: 'Developer activity is rising (commit momentum across core repos)',
      score: scoreFromSignals({ githubPct: ((commitsPct ?? 0) + githubCommunityPct) / 2, rssPct: rssPct ?? 0, onchainPct: onchain.pctChangeUpgradeableLoader ?? 0, socialPct: xSignals.pctChangeTweets ?? 0, bonus: 1 }),
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
        {
          label: 'Opened issues across curated repos (current 14d vs previous 14d)',
          value: openedIssuesCur,
          delta: openedIssuesCur - openedIssuesPrev,
          pctChange: issuesPct,
          notes:
            openedIssuesCur === 0 && openedIssuesPrev === 0
              ? 'No data returned (likely rate limited) or genuinely zero for this window.'
              : 'GitHub Search API (issues created in window). A community/dev demand proxy.',
        },
        {
          label: 'Merged PRs across curated repos (current 14d vs previous 14d)',
          value: mergedPrsCur,
          delta: mergedPrsCur - mergedPrsPrev,
          pctChange: prsPct,
          notes:
            mergedPrsCur === 0 && mergedPrsPrev === 0
              ? 'No data returned (likely rate limited) or genuinely zero for this window.'
              : 'GitHub Search API (PRs merged in window). A shipping-throughput proxy.',
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
      score: scoreFromSignals({ rssPct: rssPct ?? 0, githubPct: ((commitsPct ?? 0) + githubCommunityPct) / 2, socialPct: xSignals.pctChangeTweets ?? 0, bonus: 1 }),
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
        {
          label: 'X KOL tweet velocity (cur vs prev, curated list; no scraping)',
          value: xSignals.tweetsCurrent,
          delta: xSignals.tweetsCurrent - xSignals.tweetsPrevious,
          pctChange: xSignals.pctChangeTweets,
          notes: xSignals.ok
            ? `Top posters: ${xSignals.perUserCurrent
                .slice(0, 5)
                .map((u) => `${u.username}(${u.count})`)
                .join(', ')}`
            : `X disabled/unavailable: ${xSignals.error || 'unknown error'}`,
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
        rssPct: pct ?? 0,
        githubPct: commitsPct ?? 0,
        onchainPct: onchain.pctChangeUpgradeableLoader ?? 0,
        socialPct: xSignals.pctChangeTweets ?? 0,
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
        method: 'repos/{full_name} + commits?since=... (capped to 3 pages)',
      },
      x: {
        enabled: Boolean(process.env.X_BEARER_TOKEN),
        curatedUsernames: CURATED_X.map((l) => l.label),
        method: 'GET /2/users/by + /2/users/:id/tweets (exclude replies/retweets) with window bounds',
        notes: 'Uses official X API only. If disabled, social signals remain as curated links in the report.',
      },
      rss: { feeds: DEFAULT_FEEDS },
      scoring:
        'score = clamp(onchain_pct/5,0..35)+clamp(github_pct/5,0..30)+clamp(rss_pct/10,0..15)+clamp(social_pct/10,0..15)+bonus(0..5). Deltas are fortnight-over-fortnight.',
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
