import type { PointerSpec } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { pointerToneClasses } from "@/shared/visualization/semantic-tokens"

type PointerChipProps = {
  pointer: PointerSpec
}

export function PointerChip({ pointer }: PointerChipProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] leading-none tracking-wide whitespace-nowrap",
        pointerToneClasses[pointer.tone],
        pointer.status === "done" && "opacity-70",
        pointer.status === "waiting" && "opacity-85"
      )}
    >
      {pointer.label}
    </span>
  )
}
