import type { ReactNode } from "react"

import type { ArrayPrimitiveFrameState } from "@/entities/visualization/primitives"
import type {
  AnnotationSpec,
  HighlightSpec,
  PointerSpec,
} from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import { PointerChip } from "@/shared/visualization/pointer-chip"
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

function renderAnnotations(annotations: AnnotationSpec[] | undefined): ReactNode {
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

function splitPointersByPlacement(pointers: PointerSpec[]) {
  return {
    topPointers: pointers.filter(
      (pointer) => !(pointer.placement ?? "top").startsWith("bottom")
    ),
    bottomPointers: pointers.filter((pointer) =>
      (pointer.placement ?? "top").startsWith("bottom")
    ),
  }
}

export function ArrayView({ primitive }: { primitive: ArrayPrimitiveFrameState }) {
  const pointerMap = groupByTarget(sortPointers(primitive.pointers ?? []))
  const highlightMap = new Map<string, HighlightSpec>(
    (primitive.highlights ?? []).map((highlight) => [highlight.targetId, highlight])
  )
  const annotationMap = groupByTarget(primitive.annotations ?? [])

  return (
    <PrimitiveShell primitive={primitive} className="min-h-[18rem]">
      <div className="rounded-[1.35rem] border border-border/60 bg-muted/18 p-5">
        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max gap-4">
          {primitive.data.cells.map((cell) => {
            const pointers = pointerMap.get(cell.id) ?? []
            const highlight = highlightMap.get(cell.id)
            const annotations = annotationMap.get(cell.id)
            const { topPointers, bottomPointers } = splitPointersByPlacement(pointers)

            return (
              <div
                key={cell.id}
                className="flex w-16 shrink-0 flex-col items-center gap-2 overflow-visible"
              >
                <div
                  className="flex min-h-8 min-w-max flex-nowrap items-end justify-center gap-1"
                  data-testid={`pointer-stack-top-${cell.id}`}
                >
                  {topPointers.map((pointer) => (
                    <PointerChip key={pointer.id} pointer={pointer} />
                  ))}
                </div>

                <div
                  className={cn(
                    "flex size-16 flex-col items-center justify-center rounded-[1.1rem] border font-mono",
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
                  <span className="text-lg leading-none font-semibold">
                    {cell.value}
                  </span>
                </div>

                <div className="text-[11px] font-mono leading-none text-muted-foreground">
                  {cell.index}
                </div>

                <div
                  className="flex min-h-5 max-w-full flex-wrap items-center justify-center gap-1"
                  data-testid={`annotation-stack-${cell.id}`}
                >
                  {renderAnnotations(annotations)}
                </div>

                <div
                  className="flex min-h-8 min-w-max flex-nowrap items-start justify-center gap-1"
                  data-testid={`pointer-stack-bottom-${cell.id}`}
                >
                  {bottomPointers.map((pointer) => (
                    <PointerChip key={pointer.id} pointer={pointer} />
                  ))}
                </div>
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
