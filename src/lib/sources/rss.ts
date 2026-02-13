import Parser from 'rss-parser'

export type RssItem = {
  title: string
  link?: string
  pubDate?: string
  source: string
}

const parser = new Parser()

export async function fetchRss(urls: { name: string; url: string }[], takePerFeed = 10): Promise<RssItem[]> {
  const items: RssItem[] = []
  for (const f of urls) {
    try {
      const feed = await parser.parseURL(f.url)
      for (const it of (feed.items || []).slice(0, takePerFeed)) {
        const isoDate = (it as { isoDate?: string }).isoDate
        items.push({
          title: it.title || '(untitled)',
          link: it.link,
          pubDate: isoDate || it.pubDate,
          source: f.name,
        })
      }
    } catch {
      // ignore broken feeds
    }
  }
  return items
}

export function countRssInWindow(items: RssItem[], window: { from: Date; to: Date }) {
  return items.filter((i) => {
    const d = i.pubDate ? new Date(i.pubDate).getTime() : NaN
    if (!Number.isFinite(d)) return false
    return d >= window.from.getTime() && d < window.to.getTime()
  }).length
}
