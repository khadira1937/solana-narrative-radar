export type TimeWindow = {
  from: Date
  to: Date
}

export function makeWindows(now = new Date()): { current: TimeWindow; previous: TimeWindow } {
  const to = now
  const from = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const prevTo = from
  const prevFrom = new Date(from.getTime() - 14 * 24 * 60 * 60 * 1000)
  return {
    current: { from, to },
    previous: { from: prevFrom, to: prevTo },
  }
}

export function inWindow(tsMs: number, w: TimeWindow) {
  return tsMs >= w.from.getTime() && tsMs < w.to.getTime()
}

export function pctChange(prev: number, cur: number): number | null {
  // Judge-friendly: when prev=0 and cur>0, “infinite growth” is not a useful %.
  // Return null and let the UI/report show a clear note instead of 999%.
  if (prev === 0) return cur === 0 ? 0 : null
  return ((cur - prev) / prev) * 100
}
