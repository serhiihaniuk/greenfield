import { useEffect } from "react"
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

function parseDirectionalOrder(targetId: string) {
  const match = /^(.*?)(\d+)$/.exec(targetId)
  if (!match) {
    return undefined
  }

  return {
    prefix: match[1],
    order: Number(match[2]),
  }
}

function getMovement(
  previousTargetId: string | undefined,
  currentTargetId: string
) {
  if (!previousTargetId || previousTargetId === currentTargetId) {
    return "idle"
  }

  const previous = parseDirectionalOrder(previousTargetId)
  const current = parseDirectionalOrder(currentTargetId)

  if (!previous || !current || previous.prefix !== current.prefix) {
    return "idle"
  }

  if (current.order > previous.order) {
    return "right"
  }

  if (current.order < previous.order) {
    return "left"
  }

  return "idle"
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
  const movement = getMovement(previousTargetId, pointer.targetId)
  const pointsUp = isBottomPlacement(pointer)
  const verticalOffset = pointsUp ? 6 : -6
  const token = executionTokenFromPointer(pointer)

  // Pointer already existed in a different cell — it's moving, not new.
  // Let layoutId handle the smooth cross-cell transition instead of
  // playing fade-in/out that causes a visible blink.
  const isMoving =
    previousTargetId !== undefined && previousTargetId !== pointer.targetId

  useEffect(() => {
    pointerTargetMemory.set(memoryKey, pointer.targetId)
  }, [memoryKey, pointer.targetId])

  return (
    <motion.span
      layoutId={animateTravel ? `pointer-${memoryKey}` : undefined}
      initial={
        animateTravel && !isMoving
          ? { opacity: 0, y: verticalOffset, scale: 0.92 }
          : false
      }
      animate={{ opacity: 1, x, y, scale: 1 }}
      exit={animateTravel ? { opacity: 0 } : { opacity: 0 }}
      transition={transitions.pointerTravel}
      style={{ transform: getPointerTransform(pointer) }}
      data-token-id={token.id}
      className={cn(
        "absolute inline-flex w-8 flex-col items-center gap-0.5 font-mono leading-none whitespace-nowrap drop-shadow-[0_0_12px_rgba(8,145,178,0.18)] select-none",
        executionTokenTextClasses[token.style],
        pointer.status === "done" && "opacity-70",
        pointer.status === "waiting" && "opacity-85"
      )}
      aria-label={pointer.label}
    >
      {!pointsUp ? (
        <>
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">
            {pointer.label}
          </span>
          <PointerArrow movement={movement} pointsUp={false} />
        </>
      ) : (
        <>
          <PointerArrow movement={movement} pointsUp />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase">
            {pointer.label}
          </span>
        </>
      )}
    </motion.span>
  )
}

function PointerArrow({
  movement,
  pointsUp,
}: {
  movement: "left" | "right" | "idle"
  pointsUp: boolean
}) {
  const { animateTravel, transitions } = useMotionContract()

  return (
    <motion.svg
      viewBox="0 0 24 36"
      className="h-8 w-5 overflow-visible"
      initial={animateTravel ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transitions.pointerTravel}
    >
      <motion.g
        animate={{ rotate: pointsUp ? 180 : 0 }}
        style={{ originX: "12px", originY: "18px" }}
        transition={transitions.pointerTravel}
      >
        <motion.g
          animate={{
            skewX:
              movement === "right"
                ? [-10, 0]
                : movement === "left"
                  ? [10, 0]
                  : 0,
          }}
          style={{ originX: "12px", originY: "18px" }}
          transition={transitions.pointer}
        >
          <motion.circle
            cx="12"
            cy="4.5"
            r="2.6"
            fill="currentColor"
            initial={animateTravel ? { scale: 0, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ ...transitions.pointerTravel, delay: 0.12 }}
            style={{ originX: "12px", originY: "4.5px" }}
          />
          <motion.line
            x1="12"
            y1="8.5"
            x2="12"
            y2="17"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            initial={animateTravel ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ pathLength: 0, opacity: 0 }}
            transition={{ ...transitions.pointerTravel, delay: 0.04 }}
          />
          <motion.path
            d="M 6 13 L 12 20 L 18 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={animateTravel ? { y: -5, scale: 0.55, opacity: 0 } : false}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -5, scale: 0.55, opacity: 0 }}
            transition={transitions.pointerTravel}
            style={{ originX: "12px", originY: "20px" }}
          />
        </motion.g>
      </motion.g>
    </motion.svg>
  )
}
