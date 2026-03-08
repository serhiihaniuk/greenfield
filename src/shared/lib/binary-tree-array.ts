export type BinaryTreeArrayNode = {
  id: string
  value: number
  index: number
  depth: number
  parentId?: string
  leftId?: string
  rightId?: string
}

export type BinaryTreeArrayModel = {
  rootId: string
  nodes: BinaryTreeArrayNode[]
  nodeById: Map<string, BinaryTreeArrayNode>
}

export function buildBinaryTreeArrayModel(
  values: Array<number | null>,
  label: string
): BinaryTreeArrayModel {
  const rootValue = values[0]
  if (rootValue === null) {
    throw new Error(`${label} requires a non-null root node.`)
  }

  const nodes = new Map<number, BinaryTreeArrayNode>()

  values.forEach((value, index) => {
    if (value === null) {
      return
    }

    if (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2)
      if (values[parentIndex] === null || values[parentIndex] === undefined) {
        throw new Error(
          `Node at index ${index} is disconnected from a null parent.`
        )
      }
    }

    nodes.set(index, {
      id: `node-${index}`,
      value,
      index,
      depth: 0,
    })
  })

  const root = nodes.get(0)
  if (!root) {
    throw new Error(`${label} could not construct a root node.`)
  }

  const queue: Array<{ index: number; depth: number }> = [
    { index: 0, depth: 0 },
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    const node = nodes.get(current.index)
    if (!node) {
      continue
    }

    node.depth = current.depth
    const leftIndex = current.index * 2 + 1
    const rightIndex = current.index * 2 + 2
    const leftNode = nodes.get(leftIndex)
    const rightNode = nodes.get(rightIndex)

    if (leftNode) {
      leftNode.parentId = node.id
      leftNode.depth = current.depth + 1
      node.leftId = leftNode.id
      queue.push({ index: leftIndex, depth: current.depth + 1 })
    } else if (values[leftIndex] !== undefined && values[leftIndex] !== null) {
      throw new Error(
        `Node at index ${leftIndex} is disconnected from a null parent.`
      )
    }

    if (rightNode) {
      rightNode.parentId = node.id
      rightNode.depth = current.depth + 1
      node.rightId = rightNode.id
      queue.push({ index: rightIndex, depth: current.depth + 1 })
    } else if (
      values[rightIndex] !== undefined &&
      values[rightIndex] !== null
    ) {
      throw new Error(
        `Node at index ${rightIndex} is disconnected from a null parent.`
      )
    }
  }

  const orderedNodes = [...nodes.values()].sort(
    (left, right) => left.index - right.index
  )

  return {
    rootId: root.id,
    nodes: orderedNodes,
    nodeById: new Map(orderedNodes.map((node) => [node.id, node])),
  }
}
