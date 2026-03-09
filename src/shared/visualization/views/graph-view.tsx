import type { GraphPrimitiveFrameState } from "@/entities/visualization/primitives"
import { EdgeLayer } from "@/shared/visualization/edge-layer"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"
import { cn } from "@/shared/lib/utils"

const nodeClasses = {
  default: "border-border/70 bg-card text-card-foreground",
  frontier: "border-amber-400/60 bg-amber-400/10 text-amber-50",
  active: "border-cyan-400/65 bg-cyan-400/12 text-cyan-50",
  visited: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  found: "border-emerald-400/70 bg-emerald-400/14 text-emerald-50",
  dim: "border-border/50 bg-muted/10 text-muted-foreground",
} as const

export function GraphView({
  primitive,
}: {
  primitive: GraphPrimitiveFrameState
}) {
  const minX = Math.min(...primitive.data.nodes.map((node) => node.x))
  const maxX = Math.max(...primitive.data.nodes.map((node) => node.x))
  const minY = Math.min(...primitive.data.nodes.map((node) => node.y))
  const maxY = Math.max(...primitive.data.nodes.map((node) => node.y))

  const padding = 64
  const canvasWidth = Math.max(maxX - minX + padding * 2, 360)
  const canvasHeight = Math.max(maxY - minY + padding * 2, 280)

  return (
    <PrimitiveShell primitive={primitive}>
      <div
        className="relative overflow-x-auto rounded-2xl border border-border/60 bg-muted/14 p-4"
        style={{ minHeight: canvasHeight }}
      >
        <div className="flex min-w-max justify-center">
          <div
            className="relative"
            style={{ width: canvasWidth, height: canvasHeight }}
          >
            <EdgeLayer
              nodes={primitive.data.nodes.map((node) => ({
                id: node.id,
                x: node.x - minX + padding,
                y: node.y - minY + padding,
              }))}
              edges={primitive.data.edges}
              edgeHighlights={primitive.edgeHighlights}
              width={canvasWidth}
              height={canvasHeight}
            />
            {primitive.data.nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "absolute flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-mono text-sm font-semibold shadow-[0_14px_28px_rgba(2,8,23,0.22)]",
                  nodeClasses[node.status]
                )}
                data-token-id={node.tokenId}
                style={{
                  left: node.x - minX + padding,
                  top: node.y - minY + padding,
                }}
              >
                {node.tokenStyle ? (
                  <div className="absolute bottom-[calc(100%+0.55rem)] left-1/2 -translate-x-1/2">
                    <ExecutionTokenMark
                      label={node.tokenLabel ?? node.label}
                      style={node.tokenStyle}
                    />
                  </div>
                ) : null}
                {node.label}
                {node.annotation ? (
                  <div className="absolute top-[calc(100%+0.45rem)] rounded-full border border-border/60 bg-background/75 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {node.annotation}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
