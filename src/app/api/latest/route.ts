import { NextResponse } from 'next/server'
import { loadLatestRun } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET() {
  const latest = await loadLatestRun()
  return NextResponse.json({ ok: true, latest })
}
