import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Removed. Use /api/run to generate a fresh run.' })
}
