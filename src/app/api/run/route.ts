import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'
import { saveLatestRun } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function POST() {
  const run = await generateRun()
  await saveLatestRun(run)
  return NextResponse.json({ ok: true })
}
