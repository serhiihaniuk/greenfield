import type { CallTreePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { layoutCallTree } from "@/shared/visualization/layouts/call-tree-layout"
import { EdgeLayer } from "@/shared/visualization/edge-layer"
import { cn } from "@/shared/lib/utils"

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
  const layout = layoutCallTree(primitive.data.nodes)
  const canvasWidth = Math.max(layout.width + 180, 420)
  const canvasHeight = Math.max(layout.height + 120, 320)

  return (
    <PrimitiveShell primitive={primitive}>
      <div
        data-testid={`${primitive.id}-canvas`}
        className="relative overflow-x-auto rounded-2xl border border-border/60 bg-muted/14 p-4"
        style={{ minHeight: canvasHeight }}
      >
        <div className="flex min-w-max justify-center">
          <div
            className="relative"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
          <EdgeLayer
            nodes={layout.nodes.map((node) => ({ id: node.id, x: node.x + 90, y: node.y + 54 }))}
            edges={layout.edges}
            edgeHighlights={primitive.edgeHighlights}
            width={canvasWidth}
            height={canvasHeight}
          />
          {layout.nodes.map((positioned) => {
            const node = primitive.data.nodes.find((entry) => entry.id === positioned.id)!
            return (
              <div
                key={node.id}
                className={cn(
                  "absolute w-40 -translate-x-1/2 -translate-y-1/2 rounded-[1.35rem] border px-3 py-2.5 shadow-[0_18px_40px_rgba(2,8,23,0.2)]",
                  statusClasses[node.status]
                )}
                style={{ left: positioned.x + 90, top: positioned.y + 54 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em]">
                    {node.label}
                  </div>
                  {node.badge ? (
                    <div className="rounded-full border border-current/30 px-1.5 py-0.5 text-[10px] font-mono">
                      {node.badge}
                    </div>
                  ) : null}
                </div>
                <div className="mt-2 font-mono text-lg font-semibold">
                  {node.stateValue}
                </div>
                {node.returnValue ? (
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    return {node.returnValue}
                  </div>
                ) : null}
              </div>
            )
          })}
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
