import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'
import { getCachedRun, setCachedRun } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cached = getCachedRun()
  if (cached) return NextResponse.json({ ok: true, run: cached, cached: true })

  // If nothing cached yet (cold start), generate once.
  const run = await generateRun()
  setCachedRun(run)
  return NextResponse.json({ ok: true, run, cached: false })
}
