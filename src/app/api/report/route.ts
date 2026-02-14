import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'
import { CURATED_BLOGS, CURATED_DISCORD, CURATED_X } from '@/lib/curated'
import { renderBountyReport } from '@/lib/report'

export const dynamic = 'force-dynamic'

export async function GET() {
  const run = await generateRun()

  const md = renderBountyReport(run)

  // Append curated, judge-friendly verification links (non-scraped)
  const extra: string[] = []
  extra.push('')
  extra.push('---')
  extra.push('## Curated social + community sources (verifiable, non-scraped)')
  extra.push('These are **not** scraped automatically. They are included so judges can quickly verify/triangulate narratives when reviewing the report.')
  extra.push('Approach: we prioritize **signal quality + explainability**. Social sources are curated and explicitly cited instead of scraped, to keep the submission reproducible and compliant.')
  extra.push('')
  extra.push('**X (Twitter) — high-signal accounts**')
  for (const l of CURATED_X) extra.push(`- ${l.label} — ${l.url}${l.notes ? ` — ${l.notes}` : ''}`)
  extra.push('')
  extra.push('**Discord / community forums**')
  for (const l of CURATED_DISCORD) extra.push(`- ${l.label} — ${l.url}${l.notes ? ` — ${l.notes}` : ''}`)
  extra.push('')
  extra.push('**Blogs / docs**')
  for (const l of CURATED_BLOGS) extra.push(`- ${l.label} — ${l.url}${l.notes ? ` — ${l.notes}` : ''}`)

  return new NextResponse(md + '\n' + extra.join('\n'), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
    },
  })
}
