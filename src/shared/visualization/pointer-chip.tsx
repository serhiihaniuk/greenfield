import { useEffect } from "react"
import { ArrowDownIcon } from "lucide-react"
import { motion } from "motion/react"

import type { PointerSpec } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { executionTokenFromPointer } from "@/shared/visualization/execution-tokens"
import { executionTokenTextClasses } from "@/shared/visualization/semantic-tokens"

type PointerChipProps = {
  pointer: PointerSpec
  scopeId?: string
  x?: number
  y?: number
}

const pointerTargetMemory = new Map<string, string>()

function getPointerMemoryKey(pointer: PointerSpec, scopeId?: string) {
  return scopeId ? `${scopeId}:${pointer.id}` : pointer.id
}

function isBottomPlacement(pointer: PointerSpec) {
  return (pointer.placement ?? "top").startsWith("bottom")
}

function getPointerTransform(pointer: PointerSpec) {
  const placement = pointer.placement ?? "top"

  if (placement.startsWith("bottom")) {
    return "translate(-50%, 0)"
  }

  if (placement.startsWith("left")) {
    return "translate(-100%, -50%)"
  }

  if (placement.startsWith("right")) {
    return "translate(0, -50%)"
  }

  return "translate(-50%, -100%)"
}

export function PointerChip({
  pointer,
  scopeId,
  x = 0,
  y = 0,
}: PointerChipProps) {
  const { animateTravel, transitions } = useMotionContract()
  const memoryKey = getPointerMemoryKey(pointer, scopeId)
  const previousTargetId = pointerTargetMemory.get(memoryKey)
  const pointsUp = isBottomPlacement(pointer)
  const enterOffset = pointsUp ? 10 : -10
  const token = executionTokenFromPointer(pointer)

  // Pointer already existed in a different cell — it's moving, not new.
  // Let layoutId handle the smooth cross-cell transition instead of
  // playing fade-in/out that causes a visible blink.
  const isMoving =
    previousTargetId !== undefined && previousTargetId !== pointer.targetId

  useEffect(() => {
    pointerTargetMemory.set(memoryKey, pointer.targetId)
  }, [memoryKey, pointer.targetId])

  // Clear memory on unmount so reappearance plays entrance, not travel.
  useEffect(() => {
    return () => {
      pointerTargetMemory.delete(memoryKey)
    }
  }, [memoryKey])

  return (
    <motion.span
      layoutId={animateTravel ? `pointer-${memoryKey}` : undefined}
      initial={
        animateTravel && !isMoving
          ? { opacity: 0, y: enterOffset, scale: 0.88 }
          : false
      }
      animate={{ opacity: 1, x, y, scale: 1 }}
      exit={
        animateTravel
          ? { opacity: 0, scale: 0.92, transition: transitions.pointerExit }
          : { opacity: 0 }
      }
      transition={{
        default: isMoving ? transitions.pointerTravel : transitions.pointerEnter,
        opacity: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
      }}
      transformTemplate={(_, generated) =>
        `${getPointerTransform(pointer)} ${generated}`
      }
      data-token-id={token.id}
      className={cn(
        "absolute inline-flex flex-col items-center gap-0.5 font-mono leading-none whitespace-nowrap drop-shadow-[0_0_12px_rgba(8,145,178,0.18)] select-none",
        executionTokenTextClasses[token.style],
        pointer.status === "done" && "opacity-70",
        pointer.status === "waiting" && "opacity-85"
      )}
      aria-label={pointer.label}
    >
      {!pointsUp ? (
        <>
          <span className="text-[10px] font-semibold uppercase">
            {pointer.label}
          </span>
          <ArrowDownIcon className="size-4" strokeWidth={2.5} />
        </>
      ) : (
        <>
          <ArrowDownIcon className="size-4 rotate-180" strokeWidth={2.5} />
          <span className="text-[10px] font-semibold uppercase">
            {pointer.label}
          </span>
        </>
      )}
    </motion.span>
  )
}
