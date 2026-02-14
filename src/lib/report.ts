import type { NarrativeEvidence, RunPayload } from './types'

function fmtPct(p: number | null | undefined) {
  if (p === null) return 'new'
  if (typeof p === 'number') return `${Math.round(p * 10) / 10}%`
  return null
}

function whyNow(evidence: NarrativeEvidence[]) {
  const ranked = evidence
    .filter((e) => typeof e.delta === 'number' || e.pctChange === null || typeof e.pctChange === 'number')
    .map((e) => ({
      e,
      weight: Math.abs(typeof e.delta === 'number' ? e.delta : 0) + (e.pctChange === null ? 50 : Math.abs(typeof e.pctChange === 'number' ? e.pctChange : 0)),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ e }) => {
      const bits: string[] = [e.label]
      if (typeof e.delta === 'number') bits.push(`Δ ${e.delta}`)
      const p = fmtPct(e.pctChange)
      if (p) bits.push(`pct=${p}`)
      return bits.join(' · ')
    })

  return ranked.length ? ranked.join(' | ') : 'Signals increased vs the previous fortnight.'
}

export function renderBountyReport(run: RunPayload) {
  const lines: string[] = []
  const narratives = run.narratives.slice().sort((a, b) => (b.score || 0) - (a.score || 0))

  lines.push('# Solana Narrative Radar — Fortnight Report')
  lines.push('')
  lines.push(`Window: **${run.windowFrom} → ${run.windowTo}**`) 
  lines.push('')

  // Executive summary
  lines.push('## Executive summary (top narratives)')
  lines.push('')
  narratives.slice(0, 3).forEach((n, i) => {
    lines.push(`${i + 1}. **${n.title}** (score ${n.score}) — ${whyNow(n.evidence)}`)
  })
  lines.push('')

  lines.push('---')
  lines.push('## Detected narratives (ranked)')
  lines.push('')

  for (const n of narratives) {
    lines.push(`### ${n.title} (score ${n.score})`)
    lines.push('')
    lines.push(n.summary)
    lines.push('')
    lines.push('**Why now**')
    lines.push(`- ${whyNow(n.evidence)}`)
    lines.push('')
    lines.push('**Evidence (verifiable)**')

    for (const e of n.evidence.slice(0, 12)) {
      const parts: string[] = [`- ${e.label}`]
      const details: string[] = []
      if (typeof e.value === 'number') details.push(`cur=${e.value}`)
      if (typeof e.delta === 'number') details.push(`delta=${e.delta}`)
      const p = fmtPct(e.pctChange)
      if (p) details.push(`pct=${p}`)
      if (details.length) parts.push(`(${details.join(', ')})`)
      if (e.sourceUrl) parts.push(`— ${e.sourceUrl}`)
      if (e.notes) parts.push(`— ${e.notes}`)
      lines.push(parts.join(' '))
    }
    lines.push('')

    lines.push('**Build ideas (3–5)**')
    n.ideas.forEach((idea, idx) => lines.push(`${idx + 1}. ${idea}`))
    lines.push('')
  }

  lines.push('---')
  lines.push('## Data sources')
  lines.push('- **On-chain:** Solana RPC (Upgradeable Loader activity, sampled program upgrades, watchlist usage signatures).')
  lines.push('- **Developer:** GitHub REST (repo metrics, commits) + GitHub Search (issues/PR velocity when available).')
  lines.push('- **Discourse:** RSS feeds (Solana/Helius/Jito/Messari/etc.) with direct citations.')
  lines.push('- **Social:** Official X API supported; if credits are unavailable, we include curated KOL links for triangulation.')
  lines.push('')

  lines.push('## How signals are detected and ranked')
  lines.push('- Fortnight windows: current 14d vs previous 14d.')
  lines.push('- Score is a weighted sum of capped deltas (onchain + github + rss + social + bonus), with “new” when prev=0.')
  lines.push('- Each narrative includes citations and a “Why now” line derived from the strongest deltas.')
  lines.push('')

  lines.push('## Reproduce / run locally')
  lines.push('```bash')
  lines.push('cp .env.example .env   # or create .env with your keys')
  lines.push('npm install')
  lines.push('npm run dev')
  lines.push('```')
  lines.push('Open http://localhost:3000 and click **Run analysis**.')
  lines.push('')

  lines.push('---')
  lines.push('## Sources & methodology (raw)')
  lines.push('```json')
  lines.push(JSON.stringify(run.sources, null, 2))
  lines.push('```')

  return lines.join('\n')
}
