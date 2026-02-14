import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'
import { getCachedRun, setCachedRun } from '@/lib/cache'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // For verifiability, we generate a fresh run on GET.
    // (But we also cache it so /api/latest can return something fast.)
    const run = await generateRun()
    setCachedRun(run)
    return NextResponse.json({ ok: true, run })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

export async function POST() {
  try {
    // Explicit run trigger from UI.
    const run = await generateRun()
    setCachedRun(run)
    return NextResponse.json({ ok: true, run })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: msg }, { status: 200 })
  }
}

// Convenience for the UI to quickly show something without re-running.
export async function HEAD() {
  const cached = getCachedRun()
  return new NextResponse(null, { status: cached ? 200 : 404 })
}
