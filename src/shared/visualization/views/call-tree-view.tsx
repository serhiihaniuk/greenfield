import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import type { CallTreePrimitiveFrameState } from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { EdgeLayer } from "@/shared/visualization/edge-layer"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import { layoutCallTree } from "@/shared/visualization/layouts/call-tree-layout"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { executionTokenTextClasses } from "@/shared/visualization/semantic-tokens"

const statusClasses = {
  current: "border-cyan-400/65 bg-cyan-400/12 text-cyan-50",
  waiting: "border-border/70 bg-muted/20 text-foreground",
  solved: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  memo: "border-violet-400/55 bg-violet-400/10 text-violet-50",
  dead: "border-rose-400/55 bg-rose-400/10 text-rose-50",
  base: "border-teal-400/55 bg-teal-400/10 text-teal-50",
  archived: "border-border/50 bg-muted/10 text-muted-foreground",
} as const

export function CallTreeView({
  primitive,
}: {
  primitive: CallTreePrimitiveFrameState
}) {
  const { animateTravel, transitions } = useMotionContract()
  const layout = layoutCallTree(primitive.data.nodes)
  const canvasWidth = Math.max(layout.width + 136, 360)
  const canvasHeight = Math.max(layout.height + 84, 280)

  return (
    <PrimitiveShell primitive={primitive}>
      <div
        data-testid={`${primitive.id}-canvas`}
        className="relative overflow-x-auto rounded-2xl border border-border/60 bg-muted/14 p-4"
        style={{ minHeight: canvasHeight }}
      >
        <div className="flex min-w-max justify-center">
          <LayoutGroup id={`${primitive.id}-call-tree`}>
            <div
              className="relative"
              style={{ width: canvasWidth, height: canvasHeight }}
            >
              <EdgeLayer
                nodes={layout.nodes.map((node) => ({
                  id: node.id,
                  x: node.x + 68,
                  y: node.y + 42,
                }))}
                edges={layout.edges}
                edgeHighlights={primitive.edgeHighlights}
                width={canvasWidth}
                height={canvasHeight}
              />
              <AnimatePresence initial={false}>
                {layout.nodes.map((positioned) => {
                  const node = primitive.data.nodes.find(
                    (entry) => entry.id === positioned.id
                  )!

                  return (
                    <motion.div
                      key={node.id}
                      layout={animateTravel}
                      layoutId={
                        animateTravel ? `call-tree-node-${node.id}` : undefined
                      }
                      initial={
                        animateTravel
                          ? { opacity: 0, scale: 0.92, filter: "blur(4px)" }
                          : false
                      }
                      animate={{
                        opacity: 1,
                        scale: node.status === "current" ? 1.03 : 1,
                        filter: "blur(0px)",
                        left: positioned.x + 68,
                        top: positioned.y + 42,
                      }}
                      exit={
                        animateTravel
                          ? { opacity: 0, scale: 0.94, filter: "blur(4px)" }
                          : { opacity: 0 }
                      }
                      transition={
                        node.status === "current"
                          ? transitions.pointer
                          : transitions.layout
                      }
                      className={cn(
                        "absolute w-32 -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-2.5 shadow-[0_18px_40px_rgba(2,8,23,0.2)]",
                        statusClasses[node.status]
                      )}
                      data-token-id={node.tokenId}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={cn(
                            "font-mono text-[11px] tracking-[0.16em] uppercase",
                            node.tokenStyle &&
                              executionTokenTextClasses[node.tokenStyle]
                          )}
                        >
                          {node.tokenStyle ? (
                            <ExecutionTokenMark
                              label={node.label}
                              style={node.tokenStyle}
                              variant="text"
                            />
                          ) : (
                            node.label
                          )}
                        </div>
                        {node.badge ? (
                          <motion.div
                            layout={animateTravel}
                            transition={transitions.highlight}
                            className="rounded-full border border-current/30 px-1.5 py-0.5 font-mono text-[10px]"
                          >
                            {node.badge}
                          </motion.div>
                        ) : null}
                      </div>
                      <div className="mt-2 font-mono text-lg font-semibold">
                        {node.stateValue}
                      </div>
                      <div className="mt-1 min-h-4 text-[11px] text-muted-foreground">
                        <AnimatePresence initial={false} mode="popLayout">
                          {node.returnValue ? (
                            <motion.div
                              key={`${node.id}-${node.returnValue}`}
                              initial={
                                animateTravel
                                  ? { opacity: 0, y: 6, filter: "blur(2px)" }
                                  : false
                              }
                              animate={{
                                opacity: 1,
                                y: 0,
                                filter: "blur(0px)",
                              }}
                              exit={
                                animateTravel
                                  ? { opacity: 0, y: -6, filter: "blur(2px)" }
                                  : { opacity: 0 }
                              }
                              transition={transitions.valueCommit}
                            >
                              return {node.returnValue}
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </PrimitiveShell>
  )
}
