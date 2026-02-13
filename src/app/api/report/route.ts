import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const run = await generateRun()
  const lines: string[] = []

  lines.push(`# Solana Narrative Radar — Fortnight Report`)
  lines.push('')
  lines.push(`Window: **${run.windowFrom} → ${run.windowTo}**`)
  lines.push('')

  const narratives = run.narratives.slice().sort((a, b) => (b.score || 0) - (a.score || 0))
  for (const n of narratives) {
    lines.push(`## ${n.title} (score ${n.score})`)
    lines.push('')
    lines.push(n.summary)
    lines.push('')
    lines.push('**Evidence**')
    for (const e of n.evidence.slice(0, 10)) {
      const parts: string[] = [`- ${e.label}`]
      const details: string[] = []
      if (typeof e.value === 'number') details.push(`value=${e.value}`)
      if (typeof e.delta === 'number') details.push(`delta=${e.delta}`)
      if (typeof e.pctChange === 'number') details.push(`pct=${e.pctChange}%`)
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
  lines.push('### Sources & methodology')
  lines.push('```json')
  lines.push(JSON.stringify(run.sources, null, 2))
  lines.push('```')

  return new NextResponse(lines.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
