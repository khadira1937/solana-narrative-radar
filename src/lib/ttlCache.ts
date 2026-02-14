type Entry<T> = { v: T; exp: number }

const KEY = '__SNR_TTL_CACHE__'

function store(): Map<string, Entry<any>> {
  const g = globalThis as any
  if (!g[KEY]) g[KEY] = new Map()
  return g[KEY]
}

export async function ttl<T>(key: string, ms: number, fn: () => Promise<T>): Promise<T> {
  const s = store()
  const now = Date.now()
  const hit = s.get(key)
  if (hit && hit.exp > now) return hit.v as T
  const v = await fn()
  s.set(key, { v, exp: now + ms })
  return v
}
