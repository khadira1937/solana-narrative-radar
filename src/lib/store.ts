import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { RunPayload } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const LATEST_PATH = path.join(DATA_DIR, 'latest.json')

export async function saveLatestRun(run: RunPayload) {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(LATEST_PATH, JSON.stringify(run, null, 2), 'utf8')
}

export async function loadLatestRun(): Promise<RunPayload | null> {
  try {
    const raw = await fs.readFile(LATEST_PATH, 'utf8')
    const obj = JSON.parse(raw) as RunPayload
    if (!obj || typeof obj.windowFrom !== 'string' || typeof obj.windowTo !== 'string' || !Array.isArray((obj as any).narratives)) return null
    return obj
  } catch {
    return null
  }
}
