import { z } from "zod"

import {
  primitiveFrameStateSchema,
  type PrimitiveFrameState,
} from "@/entities/visualization/types"
import { executionTokenStyleSchema } from "@/entities/visualization/types"
import {
  serializableRecordSchema,
  type SerializableRecord,
} from "@/shared/lib/serializable"

export const visualChangeTypeSchema = z.enum([
  "move",
  "compare",
  "mutate",
  "result",
  "enter",
  "exit",
])

export type VisualChangeType = z.infer<typeof visualChangeTypeSchema>

export const narrationSegmentToneSchema = z.enum([
  "default",
  "active",
  "compare",
  "candidate",
  "done",
  "found",
  "error",
  "memo",
  "base",
  "dim",
])

export type NarrationSegmentTone = z.infer<typeof narrationSegmentToneSchema>

export const narrationSegmentSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  tone: narrationSegmentToneSchema.optional(),
  targetId: z.string().min(1).optional(),
  tokenId: z.string().min(1).optional(),
  tokenStyle: executionTokenStyleSchema.optional(),
})

export type NarrationSegment = z.infer<typeof narrationSegmentSchema>

export const narrationPayloadSchema = z.object({
  summary: z.string().min(1),
  segments: z.array(narrationSegmentSchema).default([]),
  sourceValues: serializableRecordSchema.default({}),
})

export type NarrationPayload = z.infer<typeof narrationPayloadSchema>

export const frameCheckStatusSchema = z.enum(["pass", "warn", "fail"])
export type FrameCheckStatus = z.infer<typeof frameCheckStatusSchema>

export const frameCheckKindSchema = z.enum([
  "code-line-sync",
  "one-visual-change",
  "state-continuity",
  "pointer-continuity",
  "pedagogical-integrity",
  "viewport",
  "custom",
])

export type FrameCheckKind = z.infer<typeof frameCheckKindSchema>

export const frameCheckSchema = z.object({
  id: z.string().min(1),
  kind: frameCheckKindSchema,
  status: frameCheckStatusSchema,
  message: z.string().min(1),
  meta: serializableRecordSchema.optional(),
})

export type FrameCheck = z.infer<typeof frameCheckSchema>

export interface Frame {
  id: string
  sourceEventId: string
  codeLine: string
  visualChangeType: VisualChangeType
  narration: NarrationPayload
  primitives: PrimitiveFrameState[]
  checks: FrameCheck[]
  meta?: SerializableRecord
}

export const frameSchema = z.object({
  id: z.string().min(1),
  sourceEventId: z.string().min(1),
  codeLine: z.string().min(1),
  visualChangeType: visualChangeTypeSchema,
  narration: narrationPayloadSchema,
  primitives: z.array(primitiveFrameStateSchema),
  checks: z.array(frameCheckSchema),
  meta: serializableRecordSchema.optional(),
})

export function defineFrame(frame: Frame): Frame {
  frameSchema.parse(frame)
  return frame
}
