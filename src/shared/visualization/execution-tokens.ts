import type {
  ExecutionTokenStyle,
  PointerSpec,
  PointerTone,
} from "@/entities/visualization/types"

export type ExecutionToken = {
  id: string
  label: string
  style: ExecutionTokenStyle
  status?: PointerSpec["status"]
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
