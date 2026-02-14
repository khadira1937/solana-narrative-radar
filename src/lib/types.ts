export type NarrativeEvidence = {
  label: string
  value?: number | string
  delta?: number
  pctChange?: number
  sourceUrl?: string
  notes?: string
}

export type Narrative = {
  id: string
  title: string
  score: number
  summary: string
  evidence: NarrativeEvidence[]
  ideas: string[] // 3–5
}

export type RunPayload = {
  windowFrom: string // ISO
  windowTo: string // ISO
  narratives: Narrative[]
  sources: Record<string, unknown>
}
