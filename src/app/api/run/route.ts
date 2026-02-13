import { NextResponse } from 'next/server'
import { generateRun } from '@/lib/analysis'

export const dynamic = 'force-dynamic'

export async function GET() {
  const run = await generateRun()
  return NextResponse.json({ ok: true, run })
}

export async function POST() {
  const run = await generateRun()
  return NextResponse.json({ ok: true, run })
}
