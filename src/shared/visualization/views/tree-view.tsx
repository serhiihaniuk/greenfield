import type { TreePrimitiveFrameState } from "@/entities/visualization/primitives"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { layoutTree } from "@/shared/visualization/layouts/tree-layout"
import { EdgeLayer } from "@/shared/visualization/edge-layer"
import { cn } from "@/shared/lib/utils"

const nodeClasses = {
  default: "border-border/70 bg-card text-card-foreground",
  active: "border-cyan-400/60 bg-cyan-400/10 text-cyan-50",
  done: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  found: "border-emerald-400/70 bg-emerald-400/14 text-emerald-50",
  memo: "border-violet-400/55 bg-violet-400/10 text-violet-50",
  base: "border-teal-400/55 bg-teal-400/10 text-teal-50",
  dim: "border-border/50 bg-muted/12 text-muted-foreground",
} as const

export function TreeView({ primitive }: { primitive: TreePrimitiveFrameState }) {
  const layout = layoutTree(primitive.data.nodes)
  const canvasWidth = Math.max(layout.width + 120, 360)
  const canvasHeight = Math.max(layout.height + 120, 280)

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
            nodes={layout.nodes.map((node) => ({ id: node.id, x: node.x + 60, y: node.y + 60 }))}
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
                  "absolute flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[1.35rem] border font-mono text-sm font-medium shadow-[0_14px_28px_rgba(2,8,23,0.22)]",
                  nodeClasses[node.status]
                )}
                style={{ left: positioned.x + 60, top: positioned.y + 60 }}
              >
                {node.label}
                {node.annotation ? (
                  <div className="absolute top-[calc(100%+0.4rem)] rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {node.annotation}
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
