import type { ExecutionTokenStyle } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import {
  executionTokenChipClasses,
  executionTokenTextClasses,
} from "@/shared/visualization/semantic-tokens"

type ExecutionTokenMarkProps = {
  label: string
  style: ExecutionTokenStyle
  variant?: "inline" | "text"
}

export function ExecutionTokenMark({
  label,
  style,
  variant = "inline",
}: ExecutionTokenMarkProps) {
  if (variant === "text") {
    return (
      <span
        className={cn(
          "font-mono font-semibold tracking-[0.08em] uppercase",
          executionTokenTextClasses[style]
        )}
      >
        {label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] leading-none font-semibold tracking-[0.08em] uppercase",
        executionTokenChipClasses[style]
      )}
    >
      {label}
    </span>
  )
}
