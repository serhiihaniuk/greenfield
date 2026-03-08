import type { ReactNode } from "react"

import type { SequencePrimitiveFrameState } from "@/entities/visualization/primitives"
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

export function SequenceView({
  primitive,
}: {
  primitive: SequencePrimitiveFrameState
}) {
  const pointerMap = groupByTarget(sortPointers(primitive.pointers ?? []))
  const highlightMap = new Map<string, HighlightSpec>(
    (primitive.highlights ?? []).map((highlight) => [
      highlight.targetId,
      highlight,
    ])
  )
  const annotationMap = groupByTarget(primitive.annotations ?? [])

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-3">
        {primitive.data.leadingLabel || primitive.data.trailingLabel ? (
          <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{primitive.data.leadingLabel ?? ""}</span>
            <span>{primitive.data.trailingLabel ?? ""}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto pb-1">
          <div className="flex min-w-max items-start gap-2">
            {primitive.data.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                Sequence is empty
              </div>
            ) : (
              primitive.data.items.map((item, index) => {
                const pointers = pointerMap.get(item.id) ?? []
                const highlight = highlightMap.get(item.id)
                const annotations = annotationMap.get(item.id)
                const { topPointers, bottomPointers } =
                  splitPointersByPlacement(pointers)

                return (
                  <div key={item.id} className="flex items-start gap-2">
                    <div className="flex w-14 shrink-0 flex-col items-center gap-2">
                      <div
                        className="flex h-10 shrink-0 w-full min-w-0 flex-nowrap items-end justify-center gap-1 overflow-visible"
                        data-testid={`pointer-stack-top-${item.id}`}
                      >
                        {topPointers.map((pointer) => (
                          <PointerChip
                            key={pointer.id}
                            pointer={pointer}
                            scopeId={primitive.id}
                          />
                        ))}
                      </div>

                      <div
                        className={cn(
                          "flex min-h-12 w-full flex-col items-center justify-center rounded-xl border px-2 py-1.5 font-mono transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
                          highlight
                            ? highlightToneClasses[highlight.tone]
                            : highlightToneClasses.default,
                          highlight?.emphasis
                            ? emphasisClasses[highlight.emphasis]
                            : emphasisClasses.normal
                        )}
                        data-highlight-tone={highlight?.tone ?? "default"}
                      >
                        <span className="text-center text-sm leading-none font-semibold">
                          {item.label}
                        </span>
                        {item.detail ? (
                          <span className="mt-1 text-center text-[10px] leading-none text-muted-foreground">
                            {item.detail}
                          </span>
                        ) : null}
                      </div>

                      <div
                        className="flex min-h-5 max-w-full flex-wrap items-center justify-center gap-1"
                        data-testid={`annotation-stack-${item.id}`}
                      >
                        {renderAnnotations(annotations)}
                      </div>

                      <div
                        className="flex h-10 shrink-0 w-full min-w-0 flex-nowrap items-start justify-center gap-1 overflow-visible"
                        data-testid={`pointer-stack-bottom-${item.id}`}
                      >
                        {bottomPointers.map((pointer) => (
                          <PointerChip
                            key={pointer.id}
                            pointer={pointer}
                            scopeId={primitive.id}
                          />
                        ))}
                      </div>
                    </div>

                    {index < primitive.data.items.length - 1 ? (
                      <div className="pt-[3.15rem] text-muted-foreground/70">
                        →
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
