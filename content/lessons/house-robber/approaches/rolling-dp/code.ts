import type { CodeTemplate } from "@/domains/lessons/types"

export const rollingDpHouseRobberCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "let prevTwo = 0" },
    { id: "L2", lineNumber: 2, text: "let prevOne = 0" },
    { id: "L3", lineNumber: 3, text: "for (let index = 0; index < nums.length; index += 1) {" },
    { id: "L4", lineNumber: 4, text: "  const take = prevTwo + nums[index]" },
    { id: "L5", lineNumber: 5, text: "  const skip = prevOne" },
    { id: "L6", lineNumber: 6, text: "  const best = Math.max(take, skip)" },
    { id: "L7", lineNumber: 7, text: "  prevTwo = prevOne" },
    { id: "L8", lineNumber: 8, text: "  prevOne = best" },
    { id: "L9", lineNumber: 9, text: "}" },
    { id: "L10", lineNumber: 10, text: "return prevOne" },
  ],
}