import type { ProgressDataPoint } from '@/types/models'
import { z } from 'zod/v4'

export type CompletedRepMeasurement = {
  completedRep: number
  progress: number
}

export type CompletedSetEvent = {
  completedSet: number
}

type ReadWirePayloadResult<T> = { ok: true; data: T } | { ok: false }

const RepEndWireSchema = z.object({
  previousRep: z.number(),
  progress: z.number(),
})

const SetEndWireSchema = z.object({
  previousSet: z.number().int().min(1),
})

/**
 * `subscribe()` already turned the headset's JSON text into an object, so the
 * payload arrives parsed and is only validated here. Parsing it a second time
 * would throw on `"[object Object]"` and drop the event.
 */
function readWirePayload<T>(
  payload: unknown,
  schema: z.ZodType<T>,
): ReadWirePayloadResult<T> {
  const validated = schema.safeParse(payload)

  if (!validated.success) {
    return { ok: false }
  }

  return { ok: true, data: validated.data }
}

export function normalizeRepEndPayload(
  payload: unknown,
): { ok: true; event: CompletedRepMeasurement } | { ok: false } {
  const parsed = readWirePayload(payload, RepEndWireSchema)

  if (!parsed.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    event: {
      completedRep: parsed.data.previousRep + 1,
      progress: parsed.data.progress,
    },
  }
}

export function normalizeSetEndPayload(
  payload: unknown,
): { ok: true; event: CompletedSetEvent } | { ok: false } {
  const parsed = readWirePayload(payload, SetEndWireSchema)

  if (!parsed.ok) {
    return { ok: false }
  }

  return {
    ok: true,
    event: {
      completedSet: parsed.data.previousSet,
    },
  }
}

export function applyCompletedRepToPlotData(
  plotData: ReadonlyArray<ProgressDataPoint>,
  input: {
    completedRep: number
    activeSet: number
    progressPercent: number
  },
): ProgressDataPoint[] {
  const index = input.completedRep - 1
  const setKey = `set_${input.activeSet}`
  const updated = [...plotData]

  updated[index] = {
    ...updated[index],
    rep: input.completedRep,
    [setKey]: input.progressPercent,
  }

  return updated
}
