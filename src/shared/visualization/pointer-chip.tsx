import { useEffect } from "react"
import { motion } from "motion/react"

import type { PointerSpec } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { pointerToneClasses } from "@/shared/visualization/semantic-tokens"

type PointerChipProps = {
  pointer: PointerSpec
  scopeId?: string
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

export function PointerChip({ pointer, scopeId }: PointerChipProps) {
  const { animateTravel, transitions } = useMotionContract()
  const memoryKey = getPointerMemoryKey(pointer, scopeId)
  const previousTargetId = pointerTargetMemory.get(memoryKey)
  const movement = getMovement(previousTargetId, pointer.targetId)
  const pointsUp = isBottomPlacement(pointer)
  const verticalOffset = pointsUp ? 6 : -6

  useEffect(() => {
    pointerTargetMemory.set(memoryKey, pointer.targetId)
  }, [memoryKey, pointer.targetId])

  return (
    <motion.span
      layout={animateTravel}
      layoutId={animateTravel ? `pointer-${memoryKey}` : undefined}
      initial={
        animateTravel ? { opacity: 0, y: verticalOffset, scale: 0.92 } : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        animateTravel
          ? { opacity: 0, y: verticalOffset, scale: 0.92 }
          : { opacity: 0 }
      }
      transition={transitions.pointerTravel}
      className={cn(
        "inline-flex flex-col items-center gap-0.5 font-mono leading-none whitespace-nowrap drop-shadow-[0_0_12px_rgba(8,145,178,0.18)] select-none",
        pointerToneClasses[pointer.tone],
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
            skewX: movement === "right" ? -10 : movement === "left" ? 10 : 0,
          }}
          style={{ originX: "12px", originY: "18px" }}
          transition={transitions.pointerTravel}
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
