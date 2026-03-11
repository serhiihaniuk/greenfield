import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import type { QueuePrimitiveFrameState } from "@/entities/visualization/primitives"
import type {
  ExecutionTokenStyle,
  HighlightSpec,
  PointerSpec,
  PointerTone,
} from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import {
  PointerLayer,
  usePointerAnchorRegistry,
} from "@/shared/visualization/pointer-overlay"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import {
  emphasisClasses,
  highlightToneClasses,
} from "@/shared/visualization/semantic-tokens"

const tokenStyleToPointerTone: Record<ExecutionTokenStyle, PointerTone> = {
  "accent-1": "primary",
  "accent-2": "secondary",
  "accent-3": "compare",
  "accent-4": "special",
  success: "success",
  warning: "error",
  error: "error",
  muted: "primary",
}

export function QueueView({
  primitive,
}: {
  primitive: QueuePrimitiveFrameState
}) {
  const { animateTravel, transitions } = useMotionContract()
  const { rootRef, registerTarget, anchors } = usePointerAnchorRegistry()

  // Derive pointers from item-level token info (same pattern as array pointers)
  const pointers: PointerSpec[] = [
    ...(primitive.pointers ?? []),
    ...primitive.data.items
      .filter((item) => item.tokenId && item.tokenStyle && item.tokenLabel)
      .map((item) => ({
        id: item.tokenId!,
        targetId: item.id,
        label: item.tokenLabel!,
        tone: tokenStyleToPointerTone[item.tokenStyle!],
      })),
  ]

  // Map item status → highlight spec for consistent cell coloring
  const highlightMap = new Map<string, HighlightSpec>(
    [
      ...(primitive.highlights ?? []),
      ...primitive.data.items
        .filter((item) => item.status === "active" || item.status === "done")
        .map(
          (item): HighlightSpec => ({
            targetId: item.id,
            tone: item.status === "active" ? "active" : "done",
            emphasis: item.status === "active" ? "strong" : "normal",
          })
        ),
    ].map((h) => [h.targetId, h])
  )

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
          <span>{primitive.data.frontLabel ?? "front"}</span>
          <span>{primitive.data.backLabel ?? "back"}</span>
        </div>
        <div className="overflow-x-auto overflow-y-clip pb-1">
          <LayoutGroup id={`${primitive.id}-queue`}>
            <div
              ref={rootRef}
              className="relative flex min-h-[5.5rem] min-w-max items-start gap-2 px-5 pt-14 pb-6"
            >
              <PointerLayer
                pointers={pointers}
                anchors={anchors}
                scopeId={primitive.id}
              />
              <AnimatePresence initial={false}>
                {primitive.data.items.length === 0 ? (
                  <motion.div
                    key="__empty__"
                    initial={animateTravel ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    exit={animateTravel ? { opacity: 0 } : { opacity: 0 }}
                    transition={transitions.shell}
                    className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-sm text-muted-foreground"
                  >
                    Queue is empty
                  </motion.div>
                ) : (
                  primitive.data.items.map((item) => {
                    const highlight = highlightMap.get(item.id)

                    return (
                      <motion.div
                        key={item.id}
                        layout={animateTravel}
                        layoutId={
                          animateTravel
                            ? `queue-item-${item.id}`
                            : undefined
                        }
                        initial={
                          animateTravel
                            ? {
                                opacity: 0,
                                x: 14,
                                scale: 0.96,
                                filter: "blur(3px)",
                              }
                            : false
                        }
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        exit={
                          animateTravel
                            ? {
                                opacity: 0,
                                x: -14,
                                scale: 0.96,
                                filter: "blur(3px)",
                              }
                            : { opacity: 0 }
                        }
                        transition={
                          item.status === "active"
                            ? transitions.pointer
                            : transitions.layout
                        }
                        ref={registerTarget(item.id)}
                        className="flex w-12 shrink-0 flex-col items-center gap-1.5"
                      >
                        <motion.div
                          transition={transitions.highlight}
                          animate={
                            animateTravel
                              ? {
                                  scale:
                                    highlight?.emphasis === "strong"
                                      ? 1.06
                                      : 1,
                                }
                              : undefined
                          }
                          className={cn(
                            "flex size-12 flex-col items-center justify-center rounded-xl border font-mono",
                            "transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
                            highlight
                              ? highlightToneClasses[highlight.tone]
                              : highlightToneClasses.default,
                            highlight?.emphasis
                              ? emphasisClasses[highlight.emphasis]
                              : emphasisClasses.normal
                          )}
                          data-highlight-tone={
                            highlight?.tone ?? "default"
                          }
                        >
                          <span className="text-sm leading-none font-semibold">
                            {item.label}
                          </span>
                          {item.detail ? (
                            <span className="mt-1 text-center text-[10px] leading-none text-muted-foreground">
                              {item.detail}
                            </span>
                          ) : null}
                        </motion.div>

                        {item.annotation ? (
                          <div className="font-mono text-[10px] leading-none text-muted-foreground">
                            {item.annotation}
                          </div>
                        ) : null}
                      </motion.div>
                    )
                  })
                )}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        </div>
      </div>
    </PrimitiveShell>
  )
}
