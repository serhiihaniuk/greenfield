import { z } from "zod"

import {
  serializableRecordSchema,
  type SerializableRecord,
} from "@/shared/lib/serializable"

export const verificationIssueSeveritySchema = z.enum(["error", "warning"])
export type VerificationIssueSeverity = z.infer<
  typeof verificationIssueSeveritySchema
>

export const verificationIssueKindSchema = z.enum([
  "input-parse",
  "trace-generation",
  "semantic",
  "projection",
  "frame",
  "code-line-sync",
  "pedagogical-integrity",
  "viewport",
  "custom",
])

export type VerificationIssueKind = z.infer<typeof verificationIssueKindSchema>

export const pedagogicalCheckKindSchema = z.enum([
  "one-visual-change",
  "hidden-state-loss",
  "overloaded-frame",
  "narration-mismatch",
  "code-line-mismatch",
  "scope-handoff",
])

export type PedagogicalCheckKind = z.infer<
  typeof pedagogicalCheckKindSchema
>

export const verificationIssueSchema = z.object({
  code: z.string().min(1),
  kind: verificationIssueKindSchema,
  severity: verificationIssueSeveritySchema,
  message: z.string().min(1),
  lessonId: z.string().optional(),
  approachId: z.string().optional(),
  eventId: z.string().optional(),
  frameId: z.string().optional(),
  pedagogicalCheck: pedagogicalCheckKindSchema.optional(),
  meta: serializableRecordSchema.optional(),
})

export type VerificationIssue = z.infer<typeof verificationIssueSchema>

export interface VerificationReport {
  isValid: boolean
  errors: VerificationIssue[]
  warnings: VerificationIssue[]
  meta?: SerializableRecord
}

export const verificationReportSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(verificationIssueSchema),
  warnings: z.array(verificationIssueSchema),
  meta: serializableRecordSchema.optional(),
})

export function createVerificationReport(
  issues: VerificationIssue[],
  meta?: SerializableRecord
): VerificationReport {
  const errors = issues.filter((issue) => issue.severity === "error")
  const warnings = issues.filter((issue) => issue.severity === "warning")

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    meta,
  }
}

export function mergeVerificationReports(
  ...reports: VerificationReport[]
): VerificationReport {
  return createVerificationReport(
    reports.flatMap((report) => [...report.errors, ...report.warnings]),
    {
      reportCount: reports.length,
    }
  )
}
