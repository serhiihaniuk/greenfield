import type { CodeTemplate } from "@/domains/lessons/types"

export const recursiveMaximumDepthCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L2",
  lines: [
    {
      id: "L1",
      lineNumber: 1,
      text: "function maxDepth(root: TreeNode | null): number {",
    },
    { id: "L2", lineNumber: 2, text: "  return dfs(root)" },
    { id: "L3", lineNumber: 3, text: "}" },
    {
      id: "L4",
      lineNumber: 4,
      text: "function dfs(node: TreeNode | null): number {",
    },
    { id: "L5", lineNumber: 5, text: "  if (node === null) return 0" },
    { id: "L6", lineNumber: 6, text: "  const leftDepth = dfs(node.left)" },
    { id: "L7", lineNumber: 7, text: "  const rightDepth = dfs(node.right)" },
    {
      id: "L8",
      lineNumber: 8,
      text: "  return 1 + Math.max(leftDepth, rightDepth)",
    },
    { id: "L9", lineNumber: 9, text: "}" },
  ],
}
