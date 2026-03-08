import type { CodeTemplate } from "@/domains/lessons/types"

export const minHeapTopKCodeTemplate: CodeTemplate = {
  language: "typescript",
  entryLine: "L1",
  lines: [
    { id: "L1", lineNumber: 1, text: "const heap: number[] = []" },
    { id: "L2", lineNumber: 2, text: "for (const num of nums) {" },
    { id: "L3", lineNumber: 3, text: "  if (heap.length < k) {" },
    { id: "L4", lineNumber: 4, text: "    heap.push(num)" },
    {
      id: "L5",
      lineNumber: 5,
      text: "    siftUpMinHeap(heap, heap.length - 1)",
    },
    { id: "L6", lineNumber: 6, text: "  } else if (num > heap[0]) {" },
    { id: "L7", lineNumber: 7, text: "    heap[0] = num" },
    { id: "L8", lineNumber: 8, text: "    siftDownMinHeap(heap, 0)" },
    { id: "L9", lineNumber: 9, text: "  }" },
    { id: "L10", lineNumber: 10, text: "}" },
    {
      id: "L11",
      lineNumber: 11,
      text: "return [...heap].sort((a, b) => b - a)",
    },
  ],
}
