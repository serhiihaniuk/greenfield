import type { ReactNode } from "react"
import { AnimatePresence, LayoutGroup, motion } from "motion/react"

import type { ArrayPrimitiveFrameState } from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  HighlightSpec,
  PointerSpec,
} from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import {
  PointerLayer,
  usePointerAnchorRegistry,
} from "@/shared/visualization/pointer-overlay"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import {
  annotationToneClasses,
  emphasisClasses,
  highlightToneClasses,
} from "@/shared/visualization/semantic-tokens"

function sortPointers(pointers: PointerSpec[]) {
  return [...pointers].sort((left, right) => {
    const leftPriority = left.priority ?? 0
    const rightPriority = right.priority ?? 0
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return left.id.localeCompare(right.id)
  })
}

function groupByTarget<T extends { targetId: string }>(entries: T[]) {
  const grouped = new Map<string, T[]>()

  for (const entry of entries) {
    const existing = grouped.get(entry.targetId) ?? []
    existing.push(entry)
    grouped.set(entry.targetId, existing)
  }

  return grouped
}

function renderAnnotations(
  annotations: AnnotationSpec[] | undefined
): ReactNode {
  if (!annotations || annotations.length === 0) {
    return null
  }

  return annotations.map((annotation) => (
    <span
      key={annotation.id}
      className={cn(
        "inline-flex max-w-full items-center rounded-md border px-1.5 py-0.5 font-mono text-[10px] leading-none",
        annotationToneClasses[annotation.tone ?? "default"]
      )}
    >
      {annotation.text}
    </span>
  ))
}

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
  const annotationMap = groupByTarget(primitive.annotations ?? [])

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="overflow-x-auto pb-1">
        <LayoutGroup id={`${primitive.id}-array`}>
          <div
            ref={rootRef}
            className="relative flex min-w-max items-start gap-3 px-1 pt-10 pb-10"
          >
            <PointerLayer
              pointers={sortPointers(primitive.pointers ?? [])}
              anchors={anchors}
              scopeId={primitive.id}
            />
            {primitive.data.cells.map((cell) => {
              const highlight = highlightMap.get(cell.id)
              const annotations = annotationMap.get(cell.id)

              return (
                <div
                  key={cell.id}
                  className="flex w-12 shrink-0 flex-col items-center gap-2 overflow-visible"
                >
                  <motion.div
                    ref={registerTarget(cell.id)}
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

                  <div
                    className="flex min-h-5 max-w-full flex-wrap items-center justify-center gap-1"
                    data-testid={`annotation-stack-${cell.id}`}
                  >
                    <AnimatePresence initial={false}>
                      {renderAnnotations(annotations)}
                    </AnimatePresence>
                  </div>

                  <div className="h-0 w-full shrink-0" />
                </div>
              )
            })}
          </div>
        </LayoutGroup>
      </div>
    </PrimitiveShell>
  )
}
