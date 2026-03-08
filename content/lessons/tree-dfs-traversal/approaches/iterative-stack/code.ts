import type { CodeTemplate } from "@/domains/lessons/types"

export const iterativeStackTreeDfsCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const stack = [root]" },
    { id: "L2", lineNumber: 2, text: "const order: number[] = []" },
    { id: "L3", lineNumber: 3, text: "while (stack.length > 0) {" },
    { id: "L4", lineNumber: 4, text: "  const node = stack.pop()!" },
    { id: "L5", lineNumber: 5, text: "  order.push(node.val)" },
    { id: "L6", lineNumber: 6, text: "  if (node.right) stack.push(node.right)" },
    { id: "L7", lineNumber: 7, text: "  if (node.left) stack.push(node.left)" },
    { id: "L8", lineNumber: 8, text: "}" },
    { id: "L9", lineNumber: 9, text: "return order" },
  ],
}
