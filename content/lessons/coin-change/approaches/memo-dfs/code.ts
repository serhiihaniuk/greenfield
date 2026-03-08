import type { CodeTemplate } from "@/domains/lessons/types"

export const memoDfsCoinChangeCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const memo = new Map<number, number>()" },
    {
      id: "L2",
      lineNumber: 2,
      text: "function dfs(remaining: number): number {",
    },
    { id: "L3", lineNumber: 3, text: "  if (remaining === 0) return 0" },
    { id: "L4", lineNumber: 4, text: "  if (remaining < 0) return Infinity" },
    {
      id: "L5",
      lineNumber: 5,
      text: "  if (memo.has(remaining)) return memo.get(remaining)!",
    },
    { id: "L6", lineNumber: 6, text: "  let best = Infinity" },
    {
      id: "L7",
      lineNumber: 7,
      text: "  for (const coin of coins) {",
    },
    {
      id: "L8",
      lineNumber: 8,
      text: "    const child = dfs(remaining - coin)",
    },
    {
      id: "L9",
      lineNumber: 9,
      text: "    if (child === Infinity) continue",
    },
    { id: "L10", lineNumber: 10, text: "    const candidate = child + 1" },
    { id: "L11", lineNumber: 11, text: "    best = Math.min(best, candidate)" },
    { id: "L12", lineNumber: 12, text: "  }" },
    { id: "L13", lineNumber: 13, text: "  memo.set(remaining, best)" },
    { id: "L14", lineNumber: 14, text: "  return best" },
    { id: "L15", lineNumber: 15, text: "const answer = dfs(amount)" },
    {
      id: "L16",
      lineNumber: 16,
      text: "return answer === Infinity ? -1 : answer",
    },
  ],
}
