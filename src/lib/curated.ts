export type CuratedLink = { label: string; url: string; notes?: string }

/**
 * Curated, judge-friendly sources.
 *
 * Why static?
 * - The bounty asks for social signals (X/Discord/etc.) but scraping is brittle and often non-compliant.
 * - We keep a transparent, cited list that humans can verify.
 */

export const CURATED_X: CuratedLink[] = [
  { label: 'mert', url: 'https://x.com/mert', notes: 'Solana ecosystem commentary; often surfaces early builder chatter.' },
  { label: 'toly', url: 'https://x.com/toly', notes: 'Anatoly Yakovenko (Solana co-founder). High-signal macro takes.' },
  { label: 'aeyakovenko', url: 'https://x.com/aeyakovenko', notes: 'Toly handle (often used for technical threads).' },
  { label: 'solana', url: 'https://x.com/solana', notes: 'Official announcements + ecosystem updates.' },
  { label: 'solana_devs', url: 'https://x.com/solana_devs', notes: 'Developer-focused updates.' },
  { label: 'superteam', url: 'https://x.com/superteam', notes: 'Bounties, programs, ecosystem signals.' },
  { label: 'heliuslabs', url: 'https://x.com/heliuslabs', notes: 'Infra/indexing provider; frequent technical updates.' },
  { label: 'jito_sol', url: 'https://x.com/jito_sol', notes: 'MEV + validator infra; important performance narrative.' },
  { label: 'jupiterexchange', url: 'https://x.com/jupiterexchange', notes: 'DEX aggregator; strong distribution + product narrative.' },

  // Product + research KOLs (as referenced in the bounty prompt)
  { label: '0xakshayy', url: 'https://x.com/0xakshayy', notes: 'Akshay: product/operator; good for early product narratives.' },

  // DeFi / consumer anchors (useful for triangulation)
  { label: 'driftprotocol', url: 'https://x.com/driftprotocol', notes: 'Perps + DeFi primitives on Solana.' },
  { label: 'orca_so', url: 'https://x.com/orca_so', notes: 'AMM; DeFi liquidity signals.' },
  { label: 'kamino_finance', url: 'https://x.com/kamino_finance', notes: 'Lending/Leverage; DeFi risk narratives.' },
  { label: 'marinadefinance', url: 'https://x.com/marinadefinance', notes: 'Liquid staking; stake/validator narratives.' },
  { label: 'metaplex', url: 'https://x.com/metaplex', notes: 'NFT/standards; token metadata narratives.' },

  // Core engineering
  { label: 'solanalabs', url: 'https://x.com/solanalabs', notes: 'Core engineering updates.' },
]

export const CURATED_DISCORD: CuratedLink[] = [
  { label: 'Solana Tech (official community)', url: 'https://discord.com/invite/solana', notes: 'Primary Solana dev + ecosystem Discord.' },
  { label: 'Superteam (builders + bounties)', url: 'https://superteam.fun/', notes: 'Entry point; Discord invites/regions are managed there.' },
  { label: 'Helius', url: 'https://discord.gg/helius', notes: 'Infra discussions; indexer patterns, RPC, webhooks.' },
  { label: 'Jito', url: 'https://discord.gg/jito', notes: 'Validator/MEV discussions.' },
  { label: 'Metaplex', url: 'https://discord.gg/metaplex', notes: 'NFT + token metadata standards.' },
  { label: 'Anchor (Coral)', url: 'https://discord.gg/anchor', notes: 'Anchor framework support + patterns.' },
]

export const CURATED_BLOGS: CuratedLink[] = [
  { label: 'Solana Blog', url: 'https://solana.com/news', notes: 'Official ecosystem narrative source.' },
  { label: 'Solana Developer Docs', url: 'https://solana.com/docs', notes: 'Canonical technical reference.' },
  { label: 'Helius Blog', url: 'https://www.helius.dev/blog', notes: 'High-signal technical posts; often includes code.' },
  { label: 'Jito Blog', url: 'https://www.jito.network/blog', notes: 'MEV / validator infra deep-dives.' },
  { label: 'Solana Compass', url: 'https://solanacompass.com/', notes: 'Community research + explainers.' },

  // Market / research outlets mentioned by the bounty prompt
  { label: 'Messari Research', url: 'https://messari.io/research', notes: 'Market reports and ecosystem narratives.' },
  { label: 'Electric Capital (reports)', url: 'https://www.electriccapital.com/reports', notes: 'Developer report; macro narrative context.' },

  { label: 'Jupiter Docs', url: 'https://station.jup.ag/docs', notes: 'Product + integration narrative.' },
  { label: 'Metaplex Docs', url: 'https://developers.metaplex.com/', notes: 'Standards/integration signals.' },
]
