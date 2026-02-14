export type XUser = { username: string; id: string; name?: string }

export type XSignals = {
  tweetsCurrent: number
  tweetsPrevious: number
  pctChangeTweets: number
  perUserCurrent: { username: string; count: number }[]
}

const API = 'https://api.x.com/2'

function pctChange(prev: number, cur: number) {
  if (prev === 0) return cur === 0 ? 0 : 999
  return ((cur - prev) / prev) * 100
}

async function xFetch(path: string, bearer: string) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      Authorization: `Bearer ${bearer}`,
    },
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`X API ${res.status}: ${t.slice(0, 280)}`)
  }
  return (await res.json()) as any
}

export async function fetchXSignals(params: {
  usernames: string[]
  current: { from: Date; to: Date }
  previous: { from: Date; to: Date }
  perUserMax?: number
}): Promise<XSignals> {
  const bearerEnv = process.env.X_BEARER_TOKEN
  if (!bearerEnv) {
    return { tweetsCurrent: 0, tweetsPrevious: 0, pctChangeTweets: 0, perUserCurrent: [] }
  }
  const bearer: string = bearerEnv

  const uniq = Array.from(new Set(params.usernames.map((u) => u.replace('@', '').toLowerCase()))).slice(0, 20)
  if (uniq.length === 0) return { tweetsCurrent: 0, tweetsPrevious: 0, pctChangeTweets: 0, perUserCurrent: [] }

  // Resolve ids once
  const by = await xFetch(`/users/by?usernames=${encodeURIComponent(uniq.join(','))}`, bearer)
  const users: XUser[] = (by.data || []).map((u: any) => ({ id: u.id, username: u.username, name: u.name }))

  const startCur = params.current.from.toISOString()
  const endCur = params.current.to.toISOString()
  const startPrev = params.previous.from.toISOString()
  const endPrev = params.previous.to.toISOString()

  const perUserMax = params.perUserMax ?? 100

  async function countTweets(userId: string, start: string, end: string) {
    // v2 user tweets endpoint is capped; we keep it lightweight and explainable.
    const j = await xFetch(
      `/users/${userId}/tweets?max_results=100&exclude=retweets,replies&start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}`,
      bearer,
    )
    const data = (j.data || []) as any[]
    return Math.min(perUserMax, data.length)
  }

  const curCounts = await Promise.all(users.map((u) => countTweets(u.id, startCur, endCur).catch(() => 0)))
  const prevCounts = await Promise.all(users.map((u) => countTweets(u.id, startPrev, endPrev).catch(() => 0)))

  const tweetsCurrent = curCounts.reduce((a, b) => a + b, 0)
  const tweetsPrevious = prevCounts.reduce((a, b) => a + b, 0)

  const perUserCurrent = users
    .map((u, idx) => ({ username: u.username, count: curCounts[idx] || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  return {
    tweetsCurrent,
    tweetsPrevious,
    pctChangeTweets: Math.round(pctChange(tweetsPrevious, tweetsCurrent) * 10) / 10,
    perUserCurrent,
  }
}
