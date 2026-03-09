import { z } from "zod"

import { primitiveKindSchema, type PrimitiveKind } from "@/entities/visualization/types"
import { type Frame } from "@/domains/projection/types"
import { type TraceEvent } from "@/domains/tracing/types"
import { type VerificationReport } from "@/domains/verification/types"
import { type SerializableRecord } from "@/shared/lib/serializable"

export const confusionTypeSchema = z.enum([
  "pointer-state",
  "stack-execution",
  "memoization-reuse",
  "structural-mutation",
  "state-transition",
  "frontier-traversal",
  "priority-structure",
])

export type ConfusionType = z.infer<typeof confusionTypeSchema>

export const visualizationModeSchema = z.enum(["full"])

export type VisualizationMode = z.infer<typeof visualizationModeSchema>

export type ParsedInput = SerializableRecord

export const codeLanguageSchema = z.enum([
  "typescript",
  "javascript",
  "python",
  "java",
  "cpp",
  "go",
  "pseudocode",
])

export type CodeLanguage = z.infer<typeof codeLanguageSchema>

export interface CodeLine {
  id: string
  lineNumber: number
  text: string
  highlightable?: boolean
}

export const codeLineSchema = z.object({
  id: z.string().min(1),
  lineNumber: z.number().int().positive(),
  text: z.string(),
  highlightable: z.boolean().optional(),
})

export const codeTemplateSchema = z.object({
  language: codeLanguageSchema,
  entryLine: z.string().min(1),
  lines: z.array(codeLineSchema).min(1),
})

export type CodeTemplate = z.infer<typeof codeTemplateSchema>

export const presetDefinitionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  rawInput: z.string(),
  description: z.string().optional(),
})

export type PresetDefinition = z.infer<typeof presetDefinitionSchema>

export interface RequiredView {
  id: string
  primitive: PrimitiveKind
  role:
    | "primary"
    | "co-primary"
    | "context"
    | "support"
    | "secondary"
    | "tertiary"
  title?: string
  optional?: boolean
}

export const requiredViewSchema = z.object({
  id: z.string().min(1),
  primitive: primitiveKindSchema,
  role: z.enum([
    "primary",
    "co-primary",
    "context",
    "support",
    "secondary",
    "tertiary",
  ]),
  title: z.string().optional(),
  optional: z.boolean().optional(),
})

export const viewportContractSchema = z.object({
  desktopMinWidth: z.number().int().positive(),
  desktopMinHeight: z.number().int().positive(),
  avoidVerticalScroll: z.boolean(),
  preferredLayout: z.enum([
    "single-canvas",
    "canvas-with-side-panels",
    "canvas-with-dock",
  ]),
  maxVisibleSecondaryPanels: z.number().int().nonnegative().default(0),
})

export type ViewportContract = z.infer<typeof viewportContractSchema>

export interface ApproachDefinition<TParsedInput extends ParsedInput = ParsedInput> {
  id: string
  label: string
  codeTemplate: CodeTemplate
  parseInput(raw: string): TParsedInput
  presets: PresetDefinition[]
  requiredViews: RequiredView[]
  trace(input: TParsedInput): TraceEvent[]
  project(events: TraceEvent[], mode: VisualizationMode): Frame[]
  verify?(events: TraceEvent[], frames: Frame[]): VerificationReport
}

export interface LessonDefinition<TParsedInput extends ParsedInput = ParsedInput> {
  id: string
  slug: string
  title: string
  confusionType: ConfusionType
  shortPatternNote: string
  approaches: ApproachDefinition<TParsedInput>[]
  defaultApproachId: string
  defaultMode: VisualizationMode
  viewportContract: ViewportContract
}

export const approachMetadataSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  codeTemplate: codeTemplateSchema,
  presets: z.array(presetDefinitionSchema),
  requiredViews: z.array(requiredViewSchema),
})

export type ApproachMetadata = z.infer<typeof approachMetadataSchema>

export const lessonMetadataSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  confusionType: confusionTypeSchema,
  shortPatternNote: z.string().min(1),
  defaultApproachId: z.string().min(1),
  defaultMode: visualizationModeSchema,
  viewportContract: viewportContractSchema,
})

export type LessonMetadata = z.infer<typeof lessonMetadataSchema>

export function defineApproachDefinition<TParsedInput extends ParsedInput>(
  approach: ApproachDefinition<TParsedInput>
): ApproachDefinition<TParsedInput> {
  approachMetadataSchema.parse(approach)
  return approach
}

export function defineLessonDefinition<TParsedInput extends ParsedInput>(
  lesson: LessonDefinition<TParsedInput>
): LessonDefinition<TParsedInput> {
  lessonMetadataSchema.parse(lesson)

  if (lesson.approaches.length === 0) {
    throw new Error(`Lesson "${lesson.id}" must define at least one approach.`)
  }

  const approachIds = new Set(lesson.approaches.map((approach) => approach.id))
  if (!approachIds.has(lesson.defaultApproachId)) {
    throw new Error(
      `Lesson "${lesson.id}" defaultApproachId "${lesson.defaultApproachId}" does not match any approach.`
    )
  }

  if (approachIds.size !== lesson.approaches.length) {
    throw new Error(`Lesson "${lesson.id}" has duplicate approach ids.`)
  }

  return lesson
}

export type AnyLessonDefinition = LessonDefinition
export type LessonLike = LessonDefinition
export type LessonRecord = Record<string, LessonDefinition>
export type LessonMeta = SerializableRecord
