import type { CodeTemplate } from "@/domains/lessons/types"

export const multiSourceBfsCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const queue: Array<[number, number, number]> = []" },
    { id: "L2", lineNumber: 2, text: "let fresh = 0" },
    { id: "L3", lineNumber: 3, text: "scan grid to seed rotten sources and count fresh oranges" },
    { id: "L4", lineNumber: 4, text: "let minutes = 0" },
    { id: "L5", lineNumber: 5, text: "while (queue.length > 0) {" },
    { id: "L6", lineNumber: 6, text: "  const [row, col, minute] = queue.shift()!" },
    { id: "L7", lineNumber: 7, text: "  for (const [nextRow, nextCol] of neighbors(row, col)) {" },
    { id: "L8", lineNumber: 8, text: "    if (outOfBounds || grid[nextRow][nextCol] !== 1) continue" },
    { id: "L9", lineNumber: 9, text: "    grid[nextRow][nextCol] = 2; fresh -= 1" },
    { id: "L10", lineNumber: 10, text: "    queue.push([nextRow, nextCol, minute + 1]); minutes = Math.max(minutes, minute + 1)" },
    { id: "L11", lineNumber: 11, text: "  }" },
    { id: "L12", lineNumber: 12, text: "}" },
    { id: "L13", lineNumber: 13, text: "return fresh === 0 ? minutes : -1" },
  ],
}
