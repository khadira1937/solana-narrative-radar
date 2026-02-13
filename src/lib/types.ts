import { z } from 'zod'

export const NarrativeEvidenceSchema = z.object({
  label: z.string(),
  value: z.number().optional(),
  delta: z.number().optional(),
  pctChange: z.number().optional(),
  sourceUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

export const NarrativeSchema = z.object({
  id: z.string(),
  title: z.string(),
  score: z.number(),
  summary: z.string(),
  evidence: z.array(NarrativeEvidenceSchema),
  ideas: z.array(z.string()).min(3).max(5),
})

export const RunPayloadSchema = z.object({
  windowFrom: z.string(), // ISO
  windowTo: z.string(),
  narratives: z.array(NarrativeSchema),
  sources: z.record(z.any()),
})

export type Narrative = z.infer<typeof NarrativeSchema>
export type RunPayload = z.infer<typeof RunPayloadSchema>
