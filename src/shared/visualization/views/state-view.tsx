import { AnimatePresence, motion } from "motion/react"

import type { StatePrimitiveFrameState } from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"

export function StateView({
  primitive,
}: {
  primitive: StatePrimitiveFrameState
}) {
  const { animateTravel, transitions } = useMotionContract()

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-2">
        {primitive.data.values.map((entry) => (
          <motion.div
            key={entry.label}
            layout={animateTravel}
            transition={transitions.layout}
            className={cn(
              "rounded-lg border border-border/60 px-2.5 py-2 font-mono"
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] tracking-wider text-muted-foreground uppercase">
                {entry.label}
              </span>
              <span className="relative flex min-w-8 justify-end overflow-hidden text-base leading-none font-semibold text-foreground">
                <AnimatePresence initial={false} mode="popLayout">
                  <motion.span
                    key={`${entry.label}-${String(entry.value)}`}
                    initial={
                      animateTravel
                        ? { opacity: 0, y: 8, filter: "blur(2px)" }
                        : false
                    }
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={
                      animateTravel
                        ? { opacity: 0, y: -8, filter: "blur(2px)" }
                        : { opacity: 0 }
                    }
                    transition={transitions.valueCommit}
                  >
                    {String(entry.value)}
                  </motion.span>
                </AnimatePresence>
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </PrimitiveShell>
  )
}
