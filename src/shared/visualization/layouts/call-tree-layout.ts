import type { CallTreeNode } from "@/entities/visualization/primitives"
import { layoutTree } from "@/shared/visualization/layouts/tree-layout"

export function layoutCallTree(
  nodes: Array<Pick<CallTreeNode, "id" | "parentId" | "depth">>,
  options?: {
    levelHeight?: number
    siblingWidth?: number
  }
) {
  return layoutTree(nodes, {
    levelHeight: options?.levelHeight ?? 146,
    siblingWidth: options?.siblingWidth ?? 188,
  })
}
