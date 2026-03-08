import type { CodeTemplate } from "@/domains/lessons/types"

export const iterativeBinarySearchCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "let lo = 0" },
    { id: "L2", lineNumber: 2, text: "let hi = nums.length - 1" },
    { id: "L3", lineNumber: 3, text: "while (lo <= hi) {" },
    { id: "L4", lineNumber: 4, text: "  const mid = Math.floor((lo + hi) / 2)" },
    { id: "L5", lineNumber: 5, text: "  const value = nums[mid]" },
    { id: "L6", lineNumber: 6, text: "  if (value === target) {" },
    { id: "L7", lineNumber: 7, text: "    return mid" },
    { id: "L8", lineNumber: 8, text: "  }" },
    { id: "L9", lineNumber: 9, text: "  if (value < target) {" },
    { id: "L10", lineNumber: 10, text: "    lo = mid + 1" },
    { id: "L11", lineNumber: 11, text: "  } else {" },
    { id: "L12", lineNumber: 12, text: "    hi = mid - 1" },
    { id: "L13", lineNumber: 13, text: "  }" },
    { id: "L14", lineNumber: 14, text: "}" },
    { id: "L15", lineNumber: 15, text: "return -1" },
  ],
}
