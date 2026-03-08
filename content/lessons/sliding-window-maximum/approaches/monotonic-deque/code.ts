import type { CodeTemplate } from "@/domains/lessons/types"

export const monotonicDequeSlidingWindowMaximumCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const deque: number[] = []" },
    { id: "L2", lineNumber: 2, text: "const result: number[] = []" },
    {
      id: "L3",
      lineNumber: 3,
      text: "for (let index = 0; index < nums.length; index += 1) {",
    },
    { id: "L4", lineNumber: 4, text: "  const current = nums[index]" },
    {
      id: "L5",
      lineNumber: 5,
      text: "  while (deque.length > 0 && deque[0] <= index - k) {",
    },
    { id: "L6", lineNumber: 6, text: "    deque.shift()" },
    { id: "L7", lineNumber: 7, text: "  }" },
    {
      id: "L8",
      lineNumber: 8,
      text: "  while (deque.length > 0 && nums[deque[deque.length - 1]] <= current) {",
    },
    { id: "L9", lineNumber: 9, text: "    deque.pop()" },
    { id: "L10", lineNumber: 10, text: "  }" },
    { id: "L11", lineNumber: 11, text: "  deque.push(index)" },
    { id: "L12", lineNumber: 12, text: "  if (index >= k - 1) {" },
    { id: "L13", lineNumber: 13, text: "    result.push(nums[deque[0]])" },
    { id: "L14", lineNumber: 14, text: "  }" },
    { id: "L15", lineNumber: 15, text: "}" },
    { id: "L16", lineNumber: 16, text: "return result" },
  ],
}
