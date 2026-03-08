import { z } from "zod"

import {
  serializableRecordSchema,
  type SerializableRecord,
} from "@/shared/lib/serializable"

export const traceEventTypeSchema = z.enum([
  "start",
  "enter-scope",
  "exit-scope",
  "read",
  "compare",
  "mutate",
  "pointer-update",
  "call",
  "return",
  "memo-hit",
  "base-case",
  "result",
  "complete",
  "custom",
])

export type TraceEventType = z.infer<typeof traceEventTypeSchema>

export const variableSnapshotSchema = serializableRecordSchema
export type VariableSnapshot = SerializableRecord

export interface TraceEvent {
  id: string
  type: TraceEventType
  codeLine: string
  scopeId?: string
  payload: SerializableRecord
  snapshot: VariableSnapshot
  tags?: string[]
}

export const traceEventSchema = z.object({
  id: z.string().min(1),
  type: traceEventTypeSchema,
  codeLine: z.string().min(1),
  scopeId: z.string().min(1).optional(),
  payload: serializableRecordSchema,
  snapshot: variableSnapshotSchema,
  tags: z.array(z.string().min(1)).optional(),
})

export type Trace = TraceEvent[]

export function defineTraceEvent(event: TraceEvent): TraceEvent {
  traceEventSchema.parse(event)
  return event
}
