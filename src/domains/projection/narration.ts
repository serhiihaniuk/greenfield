import type {
  ExecutionTokenStyle,
  PointerSpec,
  PointerTone,
} from "@/entities/visualization/types"

import type {
  NarrationClause,
  NarrationEvidence,
  NarrationFamily,
  NarrationPayload,
  NarrationSegment,
  NarrationSegmentTone,
} from "@/domains/projection/types"
import { narrationPayloadSchema } from "@/domains/projection/types"

type NarrationClauseInput =
  | string
  | NarrationSegment[]
  | {
      segments: NarrationSegment[]
    }

type StructuredNarrationInput = {
  family?: NarrationFamily
  headline: NarrationClauseInput
  reason?: NarrationClauseInput
  implication?: NarrationClauseInput
  evidence?: NarrationEvidence[]
  sourceValues?: NarrationPayload["sourceValues"]
}

export function narrationText(
  id: string,
  text: string,
  tone?: NarrationSegmentTone
): NarrationSegment {
  return {
    id,
    text,
    tone,
  }
}

export function narrationToken(options: {
  id: string
  text: string
  tokenId: string
  tokenStyle: ExecutionTokenStyle
  tone?: NarrationSegmentTone
}): NarrationSegment {
  return {
    id: options.id,
    text: options.text,
    tokenId: options.tokenId,
    tokenStyle: options.tokenStyle,
    tone: options.tone,
  }
}

export function narrationTokenFromPointer(
  id: string,
  pointer: PointerSpec,
  tone?: NarrationSegmentTone
): NarrationSegment {
  return narrationToken({
    id,
    text: pointer.label,
    tokenId: pointer.id,
    tokenStyle: narrationTokenStyleFromPointerTone(pointer.tone),
    tone,
  })
}

function narrationTokenStyleFromPointerTone(
  tone: PointerTone
): ExecutionTokenStyle {
  switch (tone) {
    case "primary":
      return "accent-1"
    case "secondary":
      return "accent-2"
    case "compare":
      return "accent-3"
    case "special":
      return "accent-4"
    case "success":
    case "done":
      return "success"
    case "error":
      return "error"
    default:
      return "muted"
  }
}

function asNarrationClause(
  input: NarrationClauseInput | undefined,
  fallbackId: string
): NarrationClause | undefined {
  if (!input) {
    return undefined
  }

  if (typeof input === "string") {
    return {
      segments: [narrationText(fallbackId, input)],
    }
  }

  if (Array.isArray(input)) {
    return {
      segments: input,
    }
  }

  return input
}

export function narrationPlainText(segments: NarrationSegment[]): string {
  return segments.map((segment) => segment.text).join("")
}

export function flattenNarrationSegments(payload: NarrationPayload): NarrationSegment[] {
  const collected = new Map<string, NarrationSegment>()

  for (const segment of payload.segments) {
    collected.set(segment.id, segment)
  }

  const sections = [payload.headline, payload.reason, payload.implication]
  for (const section of sections) {
    for (const segment of section?.segments ?? []) {
      collected.set(segment.id, segment)
    }
  }

  return [...collected.values()]
}

export function defineStructuredNarration(
  input: StructuredNarrationInput
): NarrationPayload {
  const headline = asNarrationClause(input.headline, "headline")
  if (!headline || headline.segments.length === 0) {
    throw new Error("Structured narration requires a non-empty headline.")
  }

  const payload: NarrationPayload = {
    summary: narrationPlainText(headline.segments),
    segments: headline.segments,
    headline,
    reason: asNarrationClause(input.reason, "reason"),
    implication: asNarrationClause(input.implication, "implication"),
    evidence: input.evidence ?? [],
    family: input.family,
    sourceValues: input.sourceValues ?? {},
  }

  return narrationPayloadSchema.parse(payload)
}
