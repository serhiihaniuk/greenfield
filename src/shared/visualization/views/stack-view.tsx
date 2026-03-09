import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import type { StackPrimitiveFrameState } from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { executionTokenTextClasses } from "@/shared/visualization/semantic-tokens"

export function StackView({
  primitive,
}: {
  primitive: StackPrimitiveFrameState
}) {
  const { animateTravel, transitions } = useMotionContract()

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="relative flex flex-col gap-1.5 pl-5">
        <div className="absolute top-0 bottom-0 left-2 w-px bg-border/60" />
        {primitive.data.topLabel ? (
          <div className="flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase">
            <span className="size-2 rounded-full border border-cyan-400/50 bg-cyan-400/18" />
            {primitive.data.topLabel}
          </div>
        ) : null}
        <LayoutGroup id={`${primitive.id}-stack`}>
          <AnimatePresence initial={false}>
            {primitive.data.frames.map((frame) => (
              <motion.div
                key={frame.id}
                layout={animateTravel}
                layoutId={animateTravel ? `stack-frame-${frame.id}` : undefined}
                initial={
                  animateTravel
                    ? { opacity: 0, y: -14, scale: 0.96, filter: "blur(3px)" }
                    : false
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: frame.status === "active" ? 1.02 : 1,
                  filter: "blur(0px)",
                }}
                exit={
                  animateTravel
                    ? { opacity: 0, y: 12, scale: 0.96, filter: "blur(3px)" }
                    : { opacity: 0 }
                }
                transition={
                  frame.status === "active"
                    ? transitions.pointer
                    : transitions.layout
                }
                className="relative"
              >
                <div className="absolute top-3 -left-[1.1rem] size-1.5 rounded-full border border-border/80 bg-background" />
                <div
                  className={cn(
                    "rounded-xl border px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
                    frame.status === "active" &&
                      "border-cyan-400/60 bg-cyan-400/10",
                    frame.status === "waiting" &&
                      "border-border/70 bg-muted/24",
                    frame.status === "done" &&
                      "border-emerald-500/45 bg-emerald-500/8",
                    frame.status === "archived" &&
                      "border-border/50 bg-muted/15 opacity-75"
                  )}
                  data-token-id={frame.tokenId}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <div
                        className={cn(
                          "font-mono text-sm font-medium",
                          frame.tokenStyle &&
                            executionTokenTextClasses[frame.tokenStyle]
                        )}
                      >
                        {frame.tokenStyle ? (
                          <ExecutionTokenMark
                            label={frame.label}
                            style={frame.tokenStyle}
                            variant="text"
                          />
                        ) : (
                          frame.label
                        )}
                      </div>
                      {frame.detail ? (
                        <motion.div
                          layout={animateTravel}
                          transition={transitions.highlight}
                          className="text-xs text-muted-foreground"
                        >
                          {frame.detail}
                        </motion.div>
                      ) : null}
                    </div>
                    <div className="min-w-10 text-right font-mono text-[10px] text-muted-foreground">
                      <AnimatePresence initial={false} mode="popLayout">
                        {frame.annotation ? (
                          <motion.div
                            key={`${frame.id}-${frame.annotation}`}
                            initial={
                              animateTravel
                                ? { opacity: 0, x: 8, filter: "blur(2px)" }
                                : false
                            }
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={
                              animateTravel
                                ? { opacity: 0, x: -8, filter: "blur(2px)" }
                                : { opacity: 0 }
                            }
                            transition={transitions.valueCommit}
                          >
                            {frame.annotation}
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </PrimitiveShell>
  )
}
