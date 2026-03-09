import { LayoutGroup, motion } from "motion/react"

import type { ArrayPrimitiveFrameState } from "@/entities/visualization/primitives"
import type { HighlightSpec } from "@/entities/visualization/types"
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

export function ArrayView({
  primitive,
}: {
  primitive: ArrayPrimitiveFrameState
}) {
  const { animateTravel, transitions } = useMotionContract()
  const { rootRef, registerTarget, anchors } = usePointerAnchorRegistry()
  const highlightMap = new Map<string, HighlightSpec>(
    (primitive.highlights ?? []).map((highlight) => [
      highlight.targetId,
      highlight,
    ])
  )
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="overflow-x-auto overflow-y-clip pb-1">
        <LayoutGroup id={`${primitive.id}-array`}>
          <div
            ref={rootRef}
            className="relative flex min-w-max items-start gap-3 px-5 pt-14 pb-14"
          >
            <PointerLayer
              pointers={primitive.pointers ?? []}
              anchors={anchors}
              scopeId={primitive.id}
            />
            {primitive.data.cells.map((cell) => {
              const highlight = highlightMap.get(cell.id)

              return (
                <div
                  key={cell.id}
                  ref={registerTarget(cell.id)}
                  className="flex w-12 shrink-0 flex-col items-center gap-2"
                >
                  <motion.div
                    transition={transitions.highlight}
                    animate={
                      animateTravel
                        ? { scale: highlight?.emphasis === "strong" ? 1.06 : 1 }
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
                    data-highlight-tone={highlight?.tone ?? "default"}
                  >
                    <span className="text-sm leading-none font-semibold">
                      {cell.value}
                    </span>
                  </motion.div>

                  <div className="font-mono text-[11px] leading-none text-muted-foreground">
                    {cell.index}
                  </div>
                </div>
              )
            })}
          </div>
        </LayoutGroup>
      </div>
    </PrimitiveShell>
  )
}
