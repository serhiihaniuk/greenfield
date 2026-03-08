type FlatLayoutNode = {
  id: string
  parentId?: string
  childSide?: "left" | "right"
  depth?: number
}

export type PositionedTreeNode = {
  id: string
  x: number
  y: number
  depth: number
  parentId?: string
}

export type PositionedTreeEdge = {
  id: string
  sourceId: string
  targetId: string
}

/**
 * Compact tree layout — places leaves left-to-right and centers each
 * parent over its children.  This produces tight layouts for both
 * balanced binary trees and deep sparse chains (e.g. recursion trees
 * where most nodes have a single child).
 *
 * When a node has exactly one child with an explicit `childSide`, a
 * phantom slot is reserved on the opposite side so the left/right
 * visual cue is preserved.
 */
export function layoutTree(
  nodes: FlatLayoutNode[],
  options?: {
    levelHeight?: number
    siblingWidth?: number
  }
) {
  const levelHeight = options?.levelHeight ?? 88
  const siblingWidth = options?.siblingWidth ?? 96
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const childrenMap = new Map<string, FlatLayoutNode[]>()

  for (const node of nodes) {
    if (!node.parentId) {
      continue
    }

    const existing = childrenMap.get(node.parentId) ?? []
    existing.push(node)
    childrenMap.set(node.parentId, existing)
  }

  for (const entry of childrenMap.values()) {
    entry.sort((left, right) => {
      const leftPriority =
        left.childSide === "left" ? 0 : left.childSide === "right" ? 1 : 2
      const rightPriority =
        right.childSide === "left" ? 0 : right.childSide === "right" ? 1 : 2

      return leftPriority - rightPriority || left.id.localeCompare(right.id)
    })
  }

  const roots = nodes
    .filter((node) => !node.parentId || !nodeMap.has(node.parentId))
    .sort((left, right) => left.id.localeCompare(right.id))

  // Compact placement — post-order traversal.
  // Leaves claim the next available slot; parents center over children.
  const positions = new Map<string, number>()
  const depths = new Map<string, number>()
  let cursor = 0

  function place(node: FlatLayoutNode, depth: number) {
    depths.set(node.id, depth)
    const children = childrenMap.get(node.id) ?? []

    // Leaf node — claim next slot
    if (children.length === 0) {
      positions.set(node.id, cursor)
      cursor += siblingWidth
      return
    }

    // Single child with explicit childSide — reserve a phantom slot on
    // the opposite side to preserve the left/right visual relationship.
    if (children.length === 1 && children[0].childSide) {
      const child = children[0]
      if (child.childSide === "right") {
        // phantom left slot, then real child
        const phantomX = cursor
        cursor += siblingWidth
        place(child, child.depth ?? depth + 1)
        const childX = positions.get(child.id)!
        positions.set(node.id, (phantomX + childX) / 2)
      } else {
        // real child first, then phantom right slot
        place(child, child.depth ?? depth + 1)
        const childX = positions.get(child.id)!
        const phantomX = cursor
        cursor += siblingWidth
        positions.set(node.id, (childX + phantomX) / 2)
      }
      return
    }

    // General case — place all children, center parent over span
    for (const child of children) {
      place(child, child.depth ?? depth + 1)
    }

    const childXValues = children.map((c) => positions.get(c.id)!)
    const center =
      (Math.min(...childXValues) + Math.max(...childXValues)) / 2
    positions.set(node.id, center)
  }

  roots.forEach((root, index) => {
    place(root, root.depth ?? 0)
    if (index < roots.length - 1) {
      cursor += siblingWidth
    }
  })

  const positioned: PositionedTreeNode[] = nodes.map((node) => ({
    id: node.id,
    x: positions.get(node.id) ?? 0,
    y: (depths.get(node.id) ?? node.depth ?? 0) * levelHeight,
    depth: depths.get(node.id) ?? node.depth ?? 0,
    parentId: node.parentId,
  }))

  positioned.sort((left, right) => left.y - right.y || left.x - right.x)

  const edges: PositionedTreeEdge[] = positioned
    .filter((node) => node.parentId)
    .map((node) => ({
      id: `${node.parentId}->${node.id}`,
      sourceId: node.parentId!,
      targetId: node.id,
    }))

  return {
    nodes: positioned,
    edges,
    width:
      positioned.length > 0
        ? Math.max(...positioned.map((node) => node.x)) + siblingWidth
        : siblingWidth,
    height:
      positioned.length > 0
        ? Math.max(...positioned.map((node) => node.y)) + levelHeight
        : levelHeight,
  }
}
