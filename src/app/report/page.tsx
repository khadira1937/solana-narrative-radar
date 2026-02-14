'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type Inline = { kind: 'text' | 'bold' | 'code' | 'link'; text: string; href?: string }

type Block =
  | { kind: 'h1' | 'h2' | 'h3'; text: string; id: string }
  | { kind: 'p'; inlines: Inline[] }
  | { kind: 'ul' | 'ol'; items: Inline[][] }
  | { kind: 'hr' }
  | { kind: 'code'; code: string }

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 64)
}

function parseInlines(line: string): Inline[] {
  // Minimal markdown inline parsing: **bold**, `code`, and URLs.
  const out: Inline[] = []
  let i = 0
  while (i < line.length) {
    if (line.startsWith('**', i)) {
      const j = line.indexOf('**', i + 2)
      if (j !== -1) {
        out.push({ kind: 'bold', text: line.slice(i + 2, j) })
        i = j + 2
        continue
      }
    }
    if (line.startsWith('`', i)) {
      const j = line.indexOf('`', i + 1)
      if (j !== -1) {
        out.push({ kind: 'code', text: line.slice(i + 1, j) })
        i = j + 1
        continue
      }
    }

    const urlMatch = line.slice(i).match(/https?:\/\/[^\s)]+/)
    if (urlMatch && urlMatch.index === 0) {
      const url = urlMatch[0]
      out.push({ kind: 'link', text: url, href: url })
      i += url.length
      continue
    }

    // Consume plain text until next token
    const next = Math.min(
      ...[
        line.indexOf('**', i + 1),
        line.indexOf('`', i + 1),
        (() => {
          const m = line.slice(i + 1).match(/https?:\/\//)
          return m ? i + 1 + (m.index ?? 0) : -1
        })(),
      ].filter((n) => n >= 0),
    )
    const end = Number.isFinite(next) ? next : line.length
    out.push({ kind: 'text', text: line.slice(i, end) })
    i = end
  }
  return out.filter((x) => x.text.length > 0)
}

function parseMarkdown(md: string): { blocks: Block[]; toc: { id: string; text: string; level: 2 | 3 }[] } {
  const lines = md.split(/\r?\n/)
  const blocks: Block[] = []
  const toc: { id: string; text: string; level: 2 | 3 }[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // code fence
    if (line.startsWith('```')) {
      const fence = line.trim()
      let j = i + 1
      const buf: string[] = []
      while (j < lines.length && !lines[j].startsWith('```')) {
        buf.push(lines[j])
        j++
      }
      blocks.push({ kind: 'code', code: buf.join('\n') })
      i = j + 1
      continue
    }

    if (line.trim() === '---') {
      blocks.push({ kind: 'hr' })
      i++
      continue
    }

    const h = line.match(/^(#{1,3})\s+(.*)$/)
    if (h) {
      const level = h[1].length
      const text = h[2].trim()
      const id = slug(text)
      if (level === 1) blocks.push({ kind: 'h1', text, id })
      if (level === 2) {
        blocks.push({ kind: 'h2', text, id })
        toc.push({ id, text, level: 2 })
      }
      if (level === 3) {
        blocks.push({ kind: 'h3', text, id })
        toc.push({ id, text, level: 3 })
      }
      i++
      continue
    }

    // unordered list
    if (line.startsWith('- ')) {
      const items: Inline[][] = []
      let j = i
      while (j < lines.length && lines[j].startsWith('- ')) {
        items.push(parseInlines(lines[j].slice(2)))
        j++
      }
      blocks.push({ kind: 'ul', items })
      i = j
      continue
    }

    // ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: Inline[][] = []
      let j = i
      while (j < lines.length && /^\d+\.\s+/.test(lines[j])) {
        items.push(parseInlines(lines[j].replace(/^\d+\.\s+/, '')))
        j++
      }
      blocks.push({ kind: 'ol', items })
      i = j
      continue
    }

    // paragraph
    if (line.trim().length) {
      const buf: string[] = [line]
      let j = i + 1
      while (j < lines.length && lines[j].trim().length && !lines[j].startsWith('#') && !lines[j].startsWith('- ') && !/^\d+\.\s+/.test(lines[j]) && !lines[j].startsWith('```') && lines[j].trim() !== '---') {
        buf.push(lines[j])
        j++
      }
      blocks.push({ kind: 'p', inlines: parseInlines(buf.join(' ')) })
      i = j
      continue
    }

    i++
  }

  return { blocks, toc }
}

function InlineRun({ inlines }: { inlines: Inline[] }) {
  return (
    <>
      {inlines.map((x, idx) => {
        if (x.kind === 'bold') return <strong key={idx}>{x.text}</strong>
        if (x.kind === 'code') return <code key={idx}>{x.text}</code>
        if (x.kind === 'link')
          return (
            <a key={idx} href={x.href} target="_blank" rel="noreferrer">
              {x.text}
            </a>
          )
        return <span key={idx}>{x.text}</span>
      })}
    </>
  )
}

export default function ReportPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [md, setMd] = useState<string>('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/report')
        if (!res.ok) throw new Error(`Failed to load report: ${res.status}`)
        const text = await res.text()
        setMd(text)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const parsed = useMemo(() => parseMarkdown(md), [md])

  async function copy() {
    await navigator.clipboard.writeText(md)
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="panel px-6 py-5 animate-fade-up">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="section-title">Judge artifact</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Fortnight Report</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--muted)' }}>
              Styled, readable report view. For raw markdown, use <a className="underline" href="/api/report" target="_blank" rel="noreferrer">/api/report</a>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-ghost" onClick={copy} disabled={!md}>
              Copy markdown
            </button>
            <a className="btn-ghost" href="/api/report" target="_blank" rel="noreferrer">
              Open raw
            </a>
            <Link className="btn-ghost" href="/">
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-6 panel p-6 text-sm" style={{ color: 'var(--muted)' }}>
          Loading…
        </div>
      )}
      {error && (
        <div className="mt-6 panel-2 p-6 text-sm" style={{ color: 'rgba(255,210,214,0.95)' }}>
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start">
          <aside
            className="panel-2 hover-lift md:sticky md:top-6"
            style={{ height: 'fit-content', width: '100%', maxWidth: 360 }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-title">Navigation</div>
                  <div className="mt-1 text-sm font-semibold">Contents</div>
                </div>
                <a
                  className="text-xs underline hover:no-underline"
                  style={{ color: 'var(--muted-2)' }}
                  href="#top"
                >
                  Top
                </a>
              </div>

              <div
                className="mt-4 pr-1"
                style={{ color: 'var(--muted)', maxHeight: 'calc(85vh - 140px)', overflow: 'auto' }}
              >
                <div className="space-y-1 text-sm">
                  {parsed.toc.slice(0, 40).map((t) => (
                    <a
                      key={t.id}
                      href={`#${t.id}`}
                      className="block rounded-md px-2 py-1 hover:underline"
                      style={{ paddingLeft: t.level === 3 ? 18 : 10, textUnderlineOffset: 4 }}
                    >
                      {t.text}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <article className="panel prose" style={{ width: '100%' }}>
            <div id="top" className="p-6 md:p-7">
            {parsed.blocks.map((b, idx) => {
              if (b.kind === 'hr') return <hr key={idx} />
              if (b.kind === 'code')
                return (
                  <pre key={idx}>
                    <code>{b.code}</code>
                  </pre>
                )
              if (b.kind === 'h1') return <h1 key={idx} id={b.id}>{b.text}</h1>
              if (b.kind === 'h2') return <h2 key={idx} id={b.id}>{b.text}</h2>
              if (b.kind === 'h3') return <h3 key={idx} id={b.id}>{b.text}</h3>
              if (b.kind === 'p') return <p key={idx}><InlineRun inlines={b.inlines} /></p>
              if (b.kind === 'ul')
                return (
                  <ul key={idx}>
                    {b.items.map((it, j) => (
                      <li key={j}>
                        <InlineRun inlines={it} />
                      </li>
                    ))}
                  </ul>
                )
              if (b.kind === 'ol')
                return (
                  <ol key={idx}>
                    {b.items.map((it, j) => (
                      <li key={j}>
                        <InlineRun inlines={it} />
                      </li>
                    ))}
                  </ol>
                )
              return null
            })}
            </div>
          </article>
        </div>
      )}
    </main>
  )
}
