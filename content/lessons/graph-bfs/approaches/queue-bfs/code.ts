import type { CodeTemplate } from "@/domains/lessons/types"

export const queueBfsCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const queue = [startId]" },
    { id: "L2", lineNumber: 2, text: "const visited = new Set([startId])" },
    { id: "L3", lineNumber: 3, text: "while (queue.length > 0) {" },
    { id: "L4", lineNumber: 4, text: "  const node = queue.shift()!" },
    { id: "L5", lineNumber: 5, text: "  if (node === targetId) return node" },
    {
      id: "L6",
      lineNumber: 6,
      text: "  for (const neighbor of graph[node]) {",
    },
    {
      id: "L7",
      lineNumber: 7,
      text: "    if (visited.has(neighbor)) continue",
    },
    { id: "L8", lineNumber: 8, text: "    visited.add(neighbor)" },
    { id: "L9", lineNumber: 9, text: "    queue.push(neighbor)" },
    { id: "L10", lineNumber: 10, text: "  }" },
    { id: "L11", lineNumber: 11, text: "}" },
    { id: "L12", lineNumber: 12, text: "return null" },
  ],
}
