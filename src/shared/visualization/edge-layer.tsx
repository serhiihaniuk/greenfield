import type { EdgeHighlightSpec } from "@/entities/visualization/types"
import { edgeToneClasses } from "@/shared/visualization/semantic-tokens"
import { cn } from "@/shared/lib/utils"

type EdgePoint = {
  id: string
  x: number
  y: number
}

type EdgeLayerProps = {
  nodes: EdgePoint[]
  edges: Array<{
    id: string
    sourceId: string
    targetId: string
  }>
  edgeHighlights?: EdgeHighlightSpec[]
  width: number
  height: number
}

export function EdgeLayer({
  nodes,
  edges,
  edgeHighlights,
  width,
  height,
}: EdgeLayerProps) {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const highlightMap = new Map(
    (edgeHighlights ?? []).map((edge) => [edge.id, edge])
  )

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
    >
      {edges.map((edge) => {
        const source = nodeMap.get(edge.sourceId)
        const target = nodeMap.get(edge.targetId)
        if (!source || !target) {
          return null
        }

        const highlight = highlightMap.get(edge.id)
        const midY = (source.y + target.y) / 2

        return (
          <path
            key={edge.id}
            className={cn(
              "fill-none stroke-[1.75]",
              edgeToneClasses[highlight?.tone ?? "default"],
              highlight?.emphasis === "strong" && "stroke-[2.5]",
              highlight?.emphasis === "soft" && "opacity-55"
            )}
            d={`M ${source.x} ${source.y} C ${source.x} ${midY}, ${target.x} ${midY}, ${target.x} ${target.y}`}
          />
        )
      })}
    </svg>
  )
}
