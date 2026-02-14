import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'
import { getCachedRun, setCachedRun } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  // For verifiability, we generate a fresh run on GET.
  // (But we also cache it so /api/latest can return something fast.)
  const run = await generateRun()
  setCachedRun(run)
  return NextResponse.json({ ok: true, run })
}

export async function POST() {
  // Explicit run trigger from UI.
  const run = await generateRun()
  setCachedRun(run)
  return NextResponse.json({ ok: true, run })
}

// Convenience for the UI to quickly show something without re-running.
export async function HEAD() {
  const cached = getCachedRun()
  return new NextResponse(null, { status: cached ? 200 : 404 })
}
