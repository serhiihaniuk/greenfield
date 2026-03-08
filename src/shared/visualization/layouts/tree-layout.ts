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

export function layoutTree(
  nodes: FlatLayoutNode[],
  options?: {
    levelHeight?: number
    siblingWidth?: number
  }
) {
  const levelHeight = options?.levelHeight ?? 112
  const siblingWidth = options?.siblingWidth ?? 120
  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const childrenMap = new Map<string, FlatLayoutNode[]>()
  const explicitDepthMax = Math.max(...nodes.map((node) => node.depth ?? 0), 0)

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

  const positioned: PositionedTreeNode[] = []
  const rawPositions = new Map<string, number>()
  const rawDepths = new Map<string, number>()

  function subtreeHeight(node: FlatLayoutNode): number {
    const children = childrenMap.get(node.id) ?? []
    if (children.length === 0) {
      return node.depth ?? 0
    }

    return Math.max(...children.map((child) => subtreeHeight(child)))
  }

  function childOffset(depth: number) {
    const remainingDepth = Math.max(explicitDepthMax - depth, 0)
    return Math.max((2 ** remainingDepth * siblingWidth) / 2, siblingWidth / 2)
  }

  function placeNode(node: FlatLayoutNode, depth: number, x: number) {
    rawPositions.set(node.id, x)
    rawDepths.set(node.id, depth)
    const children = childrenMap.get(node.id) ?? []

    if (children.length === 2) {
      const offset = childOffset(depth + 1)
      const leftChild = children[0]
      const rightChild = children[1]

      placeNode(
        leftChild,
        leftChild.depth ?? depth + 1,
        x - offset
      )
      placeNode(
        rightChild,
        rightChild.depth ?? depth + 1,
        x + offset
      )
      return
    }

    if (children.length === 1) {
      const child = children[0]
      const offset = childOffset(depth + 1)
      const direction = child.childSide === "right" ? 1 : -1
      placeNode(
        child,
        child.depth ?? depth + 1,
        x + direction * offset
      )
    }
  }

  let rootCursor = 0
  roots.forEach((root, index) => {
    const rootDepth = root.depth ?? 0
    const rootMaxDepth = subtreeHeight(root)
    const rootSpan = Math.max(
      (2 ** Math.max(rootMaxDepth - rootDepth, 0)) * siblingWidth,
      siblingWidth * 2
    )
    const rootCenter = rootCursor + rootSpan / 2

    placeNode(root, rootDepth, rootCenter)
    rootCursor += rootSpan

    if (index < roots.length - 1) {
      rootCursor += siblingWidth
    }
  })

  const minX = Math.min(...rawPositions.values(), 0)

  for (const node of nodes) {
    const depth = rawDepths.get(node.id) ?? node.depth ?? 0
    positioned.push({
      id: node.id,
      x: (rawPositions.get(node.id) ?? 0) - minX,
      y: depth * levelHeight,
      depth,
      parentId: node.parentId,
    })
  }

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
