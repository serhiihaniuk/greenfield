import { motion } from "motion/react"

import type { PointerSpec } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { pointerToneClasses } from "@/shared/visualization/semantic-tokens"

type PointerChipProps = {
  pointer: PointerSpec
}

export function PointerChip({ pointer }: PointerChipProps) {
  const { animateTravel, transitions } = useMotionContract()
  const verticalOffset = pointer.placement?.startsWith("bottom") ? 8 : -8

  return (
    <motion.span
      layout={animateTravel}
      layoutId={animateTravel ? `pointer-${pointer.id}` : undefined}
      initial={
        animateTravel ? { opacity: 0, y: verticalOffset, scale: 0.92 } : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        animateTravel
          ? { opacity: 0, y: verticalOffset, scale: 0.92 }
          : { opacity: 0 }
      }
      transition={transitions.pointer}
      className={cn(
        "inline-flex min-h-6 items-center rounded-full border px-2 py-0.5 font-mono text-[10px] leading-none tracking-wide whitespace-nowrap",
        pointerToneClasses[pointer.tone],
        pointer.status === "done" && "opacity-70",
        pointer.status === "waiting" && "opacity-85"
      )}
    >
      {pointer.label}
    </motion.span>
  )
}
