import type { SequencePrimitiveFrameState } from "@/entities/visualization/primitives"
import type { HighlightSpec } from "@/entities/visualization/types"
import { cn } from "@/shared/lib/utils"
import {
  PointerLayer,
  usePointerAnchorRegistry,
} from "@/shared/visualization/pointer-overlay"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import {
  emphasisClasses,
  highlightToneClasses,
} from "@/shared/visualization/semantic-tokens"

export function SequenceView({
  primitive,
}: {
  primitive: SequencePrimitiveFrameState
}) {
  const { rootRef, registerTarget, anchors } = usePointerAnchorRegistry()
  const highlightMap = new Map<string, HighlightSpec>(
    (primitive.highlights ?? []).map((highlight) => [
      highlight.targetId,
      highlight,
    ])
  )
  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-3">
        {primitive.data.leadingLabel || primitive.data.trailingLabel ? (
          <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
            <span>{primitive.data.leadingLabel ?? ""}</span>
            <span>{primitive.data.trailingLabel ?? ""}</span>
          </div>
        ) : null}

        <div className="overflow-x-auto overflow-y-clip pb-1">
          <div
            ref={rootRef}
            className="relative flex min-w-max items-start gap-2 px-5 pt-14 pb-14"
          >
            <PointerLayer
              pointers={primitive.pointers ?? []}
              anchors={anchors}
              scopeId={primitive.id}
            />
            {primitive.data.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-2 text-sm text-muted-foreground">
                Sequence is empty
              </div>
            ) : (
              primitive.data.items.map((item) => {
                const highlight = highlightMap.get(item.id)

                return (
                  <div
                    key={item.id}
                    ref={registerTarget(item.id)}
                    className="flex w-14 shrink-0 flex-col items-center"
                  >
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
