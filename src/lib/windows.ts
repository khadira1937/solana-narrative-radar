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

export function pctChange(prev: number, cur: number) {
  if (prev === 0) return cur === 0 ? 0 : 999
  return ((cur - prev) / prev) * 100
}
