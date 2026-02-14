import type { RunPayload } from './types'

const KEY = '__SNR_LATEST_RUN__'

export function getCachedRun(): RunPayload | null {
  const g = globalThis as unknown as Record<string, unknown>
  return (g[KEY] as RunPayload | undefined) || null
}

export function setCachedRun(run: RunPayload) {
  const g = globalThis as unknown as Record<string, unknown>
  g[KEY] = run
}
