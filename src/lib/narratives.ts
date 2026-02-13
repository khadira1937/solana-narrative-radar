import type { Narrative, NarrativeEvidence } from './types'

export type Topic = {
  id: string
  title: string
  keywords: string[]
  ideaTemplates: string[]
}

export const TOPICS: Topic[] = [
  {
    id: 'rwa-tokenization',
    title: 'RWAs & tokenized assets expanding on Solana',
    keywords: ['tokenized', 'rwa', 'stocks', 'etf', 'gold', 'treasury', 'institutional', 'wisdomtree', 'ondo', 'fireblocks'],
    ideaTemplates: [
      'A compliance-aware RWA portfolio dashboard with on-chain attestations and issuer docs in one place.',
      'A “tokenized asset discovery” engine that tracks new issuers, mints, and liquidity venues on Solana.',
      'A product that lets protocols accept RWAs as collateral with transparent risk parameters and oracle provenance.',
    ],
  },
  {
    id: 'stablecoins-payments',
    title: 'Stablecoins & payments UX improving',
    keywords: ['usdc', 'usdt', 'stablecoin', 'payments', 'solana pay', 'merchant', 'invoice', 'remittance'],
    ideaTemplates: [
      'A merchant-ready Solana Pay toolkit: invoices, receipts, refunds, webhooks, and accounting exports.',
      'A stablecoin routing layer that picks the best rail (fees/latency) and shows settlement proofs.',
      'A “payments health monitor” for businesses with alerts for congestion, failed tx, and fee spikes.',
    ],
  },
  {
    id: 'mev-performance',
    title: 'MEV, validators, and performance engineering',
    keywords: ['mev', 'jito', 'validator', 'firedancer', 'latency', 'throughput', 'network upgrades', 'compression'],
    ideaTemplates: [
      'A public “performance changelog” that maps network upgrades to measurable UX improvements (fees, latency).',
      'A validator/operator dashboard that explains MEV tips, leader schedule, and risk signals simply.',
      'A developer tool that simulates worst-case latency/fees and suggests tx batching/priority fee strategies.',
    ],
  },
  {
    id: 'devtooling',
    title: 'Developer tooling accelerating (Anchor/SDKs/indexing)',
    keywords: ['anchor', 'sdk', 'indexer', 'rpc', 'helius', 'typescript', 'rust', 'program', 'client'],
    ideaTemplates: [
      'A “Solana DX scoreboard” ranking repos by releases, commits, and issue velocity (with alerts).',
      'A codegen tool that produces program + client + tests + CI from an IDL and narrative goal.',
      'A debugging console that correlates transaction logs, compute, and account diffs into a timeline.',
    ],
  },
  {
    id: 'defi-primitives',
    title: 'DeFi primitives evolving (AMMs, perps, options)',
    keywords: ['amm', 'perp', 'perps', 'options', 'liquidity', 'volatility', 'vault', 'yield', 'trading'],
    ideaTemplates: [
      'A trader journal + analytics tool that ties execution quality to fee/latency/market regime on Solana.',
      'A “strategy playground” that backtests simple DeFi strategies with explainable risk metrics.',
      'A portfolio risk dashboard that explains exposures across perps/options/LP positions in plain language.',
    ],
  },
]

export type RssHit = { title: string; link?: string; source: string; pubDate?: string }

export function clusterByTopics(items: RssHit[]) {
  const clusters: Record<string, { topic: Topic; hits: RssHit[] }> = {}
  for (const t of TOPICS) clusters[t.id] = { topic: t, hits: [] }

  for (const it of items) {
    const text = it.title.toLowerCase()
    for (const t of TOPICS) {
      if (t.keywords.some((k) => text.includes(k))) {
        clusters[t.id].hits.push(it)
      }
    }
  }

  return Object.values(clusters).filter((c) => c.hits.length > 0)
}

export function narrativeFromCluster(params: {
  topic: Topic
  hits: RssHit[]
  score: number
  rssCur: number
  rssPrev: number
  rssPct: number
}): Narrative {
  const evidence: NarrativeEvidence[] = [
    {
      label: 'Discourse mentions in current fortnight (RSS topic hits)',
      value: params.rssCur,
      delta: params.rssCur - params.rssPrev,
      pctChange: params.rssPct,
      notes: `Topic: ${params.topic.title}`,
    },
    ...params.hits.slice(0, 6).map((h) => ({
      label: `RSS: ${h.source}`,
      notes: h.title,
      sourceUrl: h.link,
    })),
  ]

  const ideas = params.topic.ideaTemplates.slice(0, 3)

  return {
    id: params.topic.id,
    title: params.topic.title,
    score: Math.round(params.score * 10) / 10,
    summary:
      'Clustered narrative inferred from recurring off-chain discourse signals (RSS). Use citations below to verify the trend and ideas to translate it into build directions.',
    evidence,
    ideas,
  }
}
