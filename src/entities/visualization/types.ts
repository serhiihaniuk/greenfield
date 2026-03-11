import { z } from "zod"

import {
  serializableRecordSchema,
  type SerializableRecord,
} from "@/shared/lib/serializable"

export const primitiveKindSchema = z.enum([
  "array",
  "sequence",
  "stack",
  "queue",
  "hash-map",
  "tree",
  "call-tree",
  "graph",
  "grid",
  "code-trace",
  "state",
  "narration",
])

export type PrimitiveKind = z.infer<typeof primitiveKindSchema>

export const pointerToneSchema = z.enum([
  "primary",
  "secondary",
  "compare",
  "success",
  "error",
  "done",
  "special",
])

export type PointerTone = z.infer<typeof pointerToneSchema>

export const executionTokenStyleSchema = z.enum([
  "accent-1",
  "accent-2",
  "accent-3",
  "accent-4",
  "success",
  "warning",
  "error",
  "muted",
])

export type ExecutionTokenStyle = z.infer<typeof executionTokenStyleSchema>

export const pointerPlacementSchema = z.enum([
  "top",
  "top-start",
  "top-end",
  "right",
  "right-start",
  "right-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
  "inline",
])

export type PointerPlacement = z.infer<typeof pointerPlacementSchema>

export const highlightToneSchema = z.enum([
  "default",
  "active",
  "compare",
  "candidate",
  "done",
  "found",
  "error",
  "memo",
  "base",
  "mutated",
  "dim",
])

export type HighlightTone = z.infer<typeof highlightToneSchema>

export const emphasisSchema = z.enum(["soft", "normal", "strong"])
export type Emphasis = z.infer<typeof emphasisSchema>

export const annotationKindSchema = z.enum([
  "badge",
  "subtext",
  "footnote",
  "inline-label",
])

export type AnnotationKind = z.infer<typeof annotationKindSchema>

export const annotationToneSchema = z.enum([
  "default",
  "muted",
  "active",
  "success",
  "warning",
  "error",
  "memo",
  "special",
])

export type AnnotationTone = z.infer<typeof annotationToneSchema>

export const edgeToneSchema = z.enum([
  "default",
  "active",
  "compare",
  "candidate",
  "done",
  "found",
  "error",
  "memo",
  "dim",
])

export type EdgeTone = z.infer<typeof edgeToneSchema>

export const densityModeSchema = z.enum(["comfortable", "compact", "micro"])
export type DensityMode = z.infer<typeof densityModeSchema>

export const primitiveViewportRoleSchema = z.enum([
  "primary",
  "co-primary",
  "context",
  "support",
  "secondary",
  "tertiary",
])

export type PrimitiveViewportRole = z.infer<typeof primitiveViewportRoleSchema>

export const layoutDirectionSchema = z.enum([
  "horizontal",
  "vertical",
  "freeform",
])

export type LayoutDirection = z.infer<typeof layoutDirectionSchema>

export const layoutKindSchema = z.enum([
  "manual",
  "grid",
  "flex",
  "tree",
  "graph",
  "stack",
  "queue",
  "table",
])

export type LayoutKind = z.infer<typeof layoutKindSchema>

export const pointerSpecSchema = z.object({
  id: z.string().min(1),
  targetId: z.string().min(1),
  label: z.string().min(1),
  tone: pointerToneSchema,
  placement: pointerPlacementSchema.optional(),
  priority: z.number().int().optional(),
  status: z.enum(["active", "waiting", "done"]).optional(),
})

export type PointerSpec = z.infer<typeof pointerSpecSchema>

export const highlightSpecSchema = z.object({
  targetId: z.string().min(1),
  tone: highlightToneSchema,
  emphasis: emphasisSchema.optional(),
})

export type HighlightSpec = z.infer<typeof highlightSpecSchema>

export const annotationSpecSchema = z.object({
  id: z.string().min(1),
  targetId: z.string().min(1),
  kind: annotationKindSchema,
  text: z.string().min(1),
  tone: annotationToneSchema.optional(),
})

export type AnnotationSpec = z.infer<typeof annotationSpecSchema>

export const edgeHighlightSpecSchema = z.object({
  id: z.string().min(1),
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  tone: edgeToneSchema,
  emphasis: emphasisSchema.optional(),
})

export type EdgeHighlightSpec = z.infer<typeof edgeHighlightSpecSchema>

export const layoutSpecSchema = z.object({
  kind: layoutKindSchema,
  density: densityModeSchema.optional(),
  direction: layoutDirectionSchema.optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
})

export type LayoutSpec = z.infer<typeof layoutSpecSchema>

export const primitiveViewportSpecSchema = z.object({
  role: primitiveViewportRoleSchema.optional(),
  minWidth: z.number().positive().optional(),
  minHeight: z.number().positive().optional(),
  preferredWidth: z.number().positive().optional(),
  preferredHeight: z.number().positive().optional(),
  maxHeight: z.number().positive().optional(),
})

export type PrimitiveViewportSpec = z.infer<
  typeof primitiveViewportSpecSchema
>

export interface PrimitiveFrameState<TData = unknown> {
  id: string
  kind: PrimitiveKind
  title?: string
  subtitle?: string
  data: TData
  pointers?: PointerSpec[]
  highlights?: HighlightSpec[]
  edgeHighlights?: EdgeHighlightSpec[]
  annotations?: AnnotationSpec[]
  layout?: LayoutSpec
  viewport?: PrimitiveViewportSpec
  meta?: SerializableRecord
}

export const primitiveFrameStateSchema = z.object({
  id: z.string().min(1),
  kind: primitiveKindSchema,
  title: z.string().optional(),
  subtitle: z.string().optional(),
  data: z.unknown(),
  pointers: z.array(pointerSpecSchema).optional(),
  highlights: z.array(highlightSpecSchema).optional(),
  edgeHighlights: z.array(edgeHighlightSpecSchema).optional(),
  annotations: z.array(annotationSpecSchema).optional(),
  layout: layoutSpecSchema.optional(),
  viewport: primitiveViewportSpecSchema.optional(),
  meta: serializableRecordSchema.optional(),
})

export function definePrimitiveFrameState<TData>(
  state: PrimitiveFrameState<TData>
): PrimitiveFrameState<TData> {
  primitiveFrameStateSchema.parse(state)
  return state
}

export type PrimitiveFrameMap = Record<string, PrimitiveFrameState>

export type PrimitiveMeta = SerializableRecord
