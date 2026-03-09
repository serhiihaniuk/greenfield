import type {
  ExecutionTokenStyle,
  PointerSpec,
  PointerTone,
} from "@/entities/visualization/types"
import type { Frame } from "@/domains/projection/types"

export type ExecutionToken = {
  id: string
  label: string
  style: ExecutionTokenStyle
  status?: PointerSpec["status"]
}

export type FrameExecutionTokenSource =
  | "state"
  | "stack"
  | "call-tree"
  | "narration"
  | "code-trace"

export type FrameExecutionToken = ExecutionToken & {
  sources: FrameExecutionTokenSource[]
}

export function executionTokenStyleFromPointerTone(
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

export function executionTokenFromPointer(pointer: PointerSpec): ExecutionToken {
  return {
    id: pointer.id,
    label: pointer.label,
    style: executionTokenStyleFromPointerTone(pointer.tone),
    status: pointer.status,
  }
}

export function deriveExecutionTokensFromPointers(
  pointers: PointerSpec[]
): Map<string, ExecutionToken> {
  return new Map(
    pointers.map((pointer) => [pointer.id, executionTokenFromPointer(pointer)])
  )
}

export function findExecutionTokenByLabel(
  tokens: Iterable<ExecutionToken>,
  label: string
) {
  const normalized = label.trim().toLowerCase()
  for (const token of tokens) {
    if (token.label.trim().toLowerCase() === normalized) {
      return token
    }
  }

  return undefined
}

function mergeFrameExecutionToken(
  tokens: Map<string, FrameExecutionToken>,
  token: ExecutionToken,
  source: FrameExecutionTokenSource
) {
  const existing = tokens.get(token.id)
  if (existing) {
    if (!existing.sources.includes(source)) {
      existing.sources.push(source)
    }
    return
  }

  tokens.set(token.id, {
    ...token,
    sources: [source],
  })
}

export function collectFrameExecutionTokens(
  frame: Frame | undefined
): FrameExecutionToken[] {
  if (!frame) {
    return []
  }

  const tokens = new Map<string, FrameExecutionToken>()

  for (const primitive of frame.primitives) {
    if (primitive.kind === "state") {
      const values = (
        primitive.data as {
          values: Array<{
            label: string
            tokenId?: string
            tokenStyle?: ExecutionTokenStyle
          }>
        }
      ).values
      for (const value of values) {
        if (value.tokenId && value.tokenStyle) {
          mergeFrameExecutionToken(
            tokens,
            {
              id: value.tokenId,
              label: value.label,
              style: value.tokenStyle,
            },
            "state"
          )
        }
      }
      continue
    }

    if (primitive.kind === "stack") {
      const frames = (
        primitive.data as {
          frames: Array<{
            label: string
            tokenId?: string
            tokenStyle?: ExecutionTokenStyle
          }>
        }
      ).frames
      for (const stackFrame of frames) {
        if (stackFrame.tokenId && stackFrame.tokenStyle) {
          mergeFrameExecutionToken(
            tokens,
            {
              id: stackFrame.tokenId,
              label: stackFrame.label,
              style: stackFrame.tokenStyle,
            },
            "stack"
          )
        }
      }
      continue
    }

    if (primitive.kind === "call-tree") {
      const nodes = (
        primitive.data as {
          nodes: Array<{
            label: string
            tokenId?: string
            tokenStyle?: ExecutionTokenStyle
          }>
        }
      ).nodes
      for (const node of nodes) {
        if (node.tokenId && node.tokenStyle) {
          mergeFrameExecutionToken(
            tokens,
            {
              id: node.tokenId,
              label: node.label,
              style: node.tokenStyle,
            },
            "call-tree"
          )
        }
      }
      continue
    }

    if (primitive.kind === "code-trace") {
      const lines = (
        primitive.data as {
          lines: Array<{
            tokens: Array<{
              content: string
              tokenId?: string
              tokenStyle?: ExecutionTokenStyle
            }>
          }>
        }
      ).lines
      for (const line of lines) {
        for (const token of line.tokens) {
          if (token.tokenId && token.tokenStyle) {
            mergeFrameExecutionToken(
              tokens,
              {
                id: token.tokenId,
                label: token.content,
                style: token.tokenStyle,
              },
              "code-trace"
            )
          }
        }
      }
    }
  }

  for (const segment of frame.narration.segments) {
    if (segment.tokenId && segment.tokenStyle) {
      mergeFrameExecutionToken(
        tokens,
        {
          id: segment.tokenId,
          label: segment.text,
          style: segment.tokenStyle,
        },
        "narration"
      )
    }
  }

  return [...tokens.values()].sort((left, right) =>
    left.label.localeCompare(right.label)
  )
}
