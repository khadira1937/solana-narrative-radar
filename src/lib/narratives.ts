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
      'Target: funds + fintech. MVP (1w): RWA dashboard w/ issuer docs + on-chain attestations. Why now: institutional RWA activity rising. Metric: DAU + reports exported.',
      'Target: traders. MVP (1w): tokenized asset discovery (new issuers/mints + liquidity venues) on Solana. Why now: new listings wave. Metric: watchlists created.',
      'Target: DeFi protocols. MVP (1w): accept RWAs as collateral with risk params + oracle provenance. Why now: RWA collateral is hot. Metric: collateral TVL.',
    ],
  },
  {
    id: 'stablecoins-payments',
    title: 'Stablecoins & payments UX improving',
    keywords: ['usdc', 'usdt', 'stablecoin', 'payments', 'solana pay', 'merchant', 'invoice', 'remittance'],
    ideaTemplates: [
      'Target: merchants. MVP (1w): Solana Pay invoices + refunds + webhooks + accounting export. Why now: payment discourse up. Metric: merchants onboarded.',
      'Target: wallets. MVP (1w): stablecoin routing that chooses rail/fee/latency and shows proof. Why now: stablecoin competition. Metric: conversion + success rate.',
      'Target: businesses. MVP (1w): payments health monitor (congestion, fails, fee spikes) + alerts. Why now: scaling pushes need reliability. Metric: reduced failed payments.',
    ],
  },
  {
    id: 'mev-performance',
    title: 'MEV, validators, and performance engineering',
    keywords: ['mev', 'jito', 'validator', 'firedancer', 'latency', 'throughput', 'network upgrades', 'tip', 'priority fee'],
    ideaTemplates: [
      'Target: validators + infra teams. MVP (1w): a “performance changelog” mapping upgrades → measurable UX metrics. Why now: performance discourse rising. Metric: weekly users + shared links.',
      'Target: operators. MVP (1w): explain MEV tips, leader schedule, and risk signals with plain-language tooltips. Why now: MEV infra is central narrative. Metric: retained dashboards.',
      'Target: dApp engineers. MVP (1w): tx simulator for latency/fees + recommendations (batching, CU, priority fees). Why now: shipping velocity up. Metric: % issues resolved.',
    ],
  },
  {
    id: 'devtooling',
    title: 'Developer tooling accelerating (Anchor/SDKs/indexing)',
    keywords: ['anchor', 'sdk', 'indexer', 'rpc', 'helius', 'typescript', 'rust', 'program', 'client', 'gateway'],
    ideaTemplates: [
      'Target: dev rel + builders. MVP (1w): DX scoreboard (commits + issues + PRs) with alerting. Why now: repo momentum rising. Metric: subscriptions + alert CTR.',
      'Target: hackathon teams. MVP (1w): scaffold generator (program + client + tests + CI) from an IDL template. Why now: shipping velocity up. Metric: generated projects shipped.',
      'Target: production teams. MVP (1w): debugging console (logs + compute + account diffs) timeline view. Why now: infra complexity rising. Metric: mean time to debug.',
    ],
  },
  {
    id: 'defi-primitives',
    title: 'DeFi primitives evolving (AMMs, perps, options)',
    keywords: ['amm', 'perp', 'perps', 'options', 'liquidity', 'volatility', 'vault', 'yield', 'trading'],
    ideaTemplates: [
      'Target: active traders. MVP (1w): trader journal tying execution quality to latency/fees regime. Why now: perps/DEX cadence rising. Metric: retention.',
      'Target: strategists. MVP (1w): strategy playground w/ explainable risk metrics + replay. Why now: new primitives. Metric: strategies saved/shared.',
      'Target: risk managers. MVP (1w): portfolio risk dashboard for perps/options/LP exposures in plain language. Why now: complexity rising. Metric: risk events caught.',
    ],
  },
  {
    id: 'token-extensions',
    title: 'Token Extensions (Token-2022) adoption accelerating',
    keywords: ['token-2022', 'token extensions', 'transfer hook', 'confidential transfer', 'memo transfer', 'permanent delegate'],
    ideaTemplates: [
      'Target: token issuers. MVP (1w): “extensions readiness” checklist + templates + explorers for a mint. Why now: issuers experimenting. Metric: mints analyzed.',
      'Target: wallets. MVP (1w): wallet compatibility scanner + safe transfer UX for extensions. Why now: UX breaks = opportunity. Metric: successful transfers.',
      'Target: exchanges. MVP (1w): compliance / restriction simulation for Transfer Hooks. Why now: token programmability rising. Metric: integration time saved.',
    ],
  },
  {
    id: 'compression',
    title: 'State compression & scalable identity data',
    keywords: ['compression', 'compressed nft', 'cNFT', 'state compression', 'merkle', 'bubblegum'],
    ideaTemplates: [
      'Target: consumer apps. MVP (1w): compressed asset minting pipeline + monitoring. Why now: scale narratives. Metric: assets minted.',
      'Target: infra teams. MVP (1w): “compression cost calculator” + failure diagnostics. Why now: teams need predictability. Metric: support tickets reduced.',
      'Target: analytics. MVP (1w): compressed asset explorer with provenance + updates. Why now: more compressed assets. Metric: searches/day.',
    ],
  },
  {
    id: 'actions-blinks',
    title: 'Actions/Blinks distribution channels emerging',
    keywords: ['blink', 'blinks', 'actions', 'action', 'dialect', 'shareable', 'link'],
    ideaTemplates: [
      'Target: growth teams. MVP (1w): Blink funnel analytics + A/B testing harness. Why now: new distribution channel. Metric: conversion lift.',
      'Target: builders. MVP (1w): “action generator” templates for swaps/mints/claims with safety checks. Why now: rapid experimentation. Metric: actions created.',
      'Target: security. MVP (1w): link risk scanner for actions/blinks. Why now: phishing risk. Metric: blocks prevented.',
    ],
  },
  {
    id: 'solana-mobile',
    title: 'Solana Mobile / device-native UX gaining momentum',
    keywords: ['solana mobile', 'saga', 'seeker', 'mobile', 'dapp store'],
    ideaTemplates: [
      'Target: mobile dApps. MVP (1w): mobile wallet QA harness (deep links, signing flows). Why now: device wave. Metric: crashes reduced.',
      'Target: app stores. MVP (1w): discoverability + ranking signals dashboard for Solana dApp store. Why now: competition rising. Metric: installs tracked.',
      'Target: consumer apps. MVP (1w): device-native onboarding (passkeys, social recovery) kit. Why now: conversion matters. Metric: activation rate.',
    ],
  },
  {
    id: 'lst-validator-econ',
    title: 'LSTs, restaking, and validator economics shifting',
    keywords: ['lst', 'liquid staking', 'restaking', 'stake', 'delegation', 'validator economics', 'tips'],
    ideaTemplates: [
      'Target: stakers. MVP (1w): “best delegation” recommender w/ transparency (MEV tips, uptime). Why now: incentive shifts. Metric: stake delegated.',
      'Target: protocols. MVP (1w): LST risk monitor (peg, liquidity, concentration). Why now: LST adoption. Metric: alerts triggered.',
      'Target: validators. MVP (1w): revenue decomposition dashboard (inflation vs tips vs MEV). Why now: economics change. Metric: operators onboarded.',
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
  rssPct: number | null
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
