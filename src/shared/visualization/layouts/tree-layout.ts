type FlatLayoutNode = {
  id: string
  parentId?: string
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

  for (const node of nodes) {
    if (!node.parentId) {
      continue
    }

    const existing = childrenMap.get(node.parentId) ?? []
    existing.push(node)
    childrenMap.set(node.parentId, existing)
  }

  for (const entry of childrenMap.values()) {
    entry.sort((left, right) => left.id.localeCompare(right.id))
  }

  const roots = nodes
    .filter((node) => !node.parentId || !nodeMap.has(node.parentId))
    .sort((left, right) => left.id.localeCompare(right.id))

  const positioned: PositionedTreeNode[] = []
  let cursor = 0

  function walk(node: FlatLayoutNode, depth: number): number {
    const children = childrenMap.get(node.id) ?? []
    const childXs = children.map((child) => walk(child, depth + 1))
    const x =
      childXs.length > 0
        ? childXs.reduce((sum, value) => sum + value, 0) / childXs.length
        : cursor++ * siblingWidth

    positioned.push({
      id: node.id,
      x,
      y: depth * levelHeight,
      depth,
      parentId: node.parentId,
    })

    return x
  }

  roots.forEach((root, index) => {
    if (index > 0 && cursor > 0) {
      cursor += 1
    }
    walk(root, root.depth ?? 0)
  })

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
