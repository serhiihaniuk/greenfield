import { z } from "zod"

import {
  definePrimitiveFrameState,
  type PrimitiveFrameState,
} from "@/entities/visualization/types"

export const arrayCellSchema = z.object({
  id: z.string().min(1),
  index: z.number().int().nonnegative(),
  value: z.union([z.string(), z.number()]),
})

export type ArrayCell = z.infer<typeof arrayCellSchema>

export const arrayPrimitiveDataSchema = z.object({
  cells: z.array(arrayCellSchema),
})

export type ArrayPrimitiveData = z.infer<typeof arrayPrimitiveDataSchema>

export type ArrayPrimitiveFrameState = PrimitiveFrameState<ArrayPrimitiveData> & {
  kind: "array"
}

export function defineArrayPrimitiveFrameState(
  state: ArrayPrimitiveFrameState
): ArrayPrimitiveFrameState {
  const data = arrayPrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as ArrayPrimitiveFrameState
}

export const stateValueSchema = z.object({
  label: z.string().min(1),
  value: z.union([z.string(), z.number()]),
})

export type StateValue = z.infer<typeof stateValueSchema>

export const statePrimitiveDataSchema = z.object({
  values: z.array(stateValueSchema),
})

export type StatePrimitiveData = z.infer<typeof statePrimitiveDataSchema>

export type StatePrimitiveFrameState = PrimitiveFrameState<StatePrimitiveData> & {
  kind: "state"
}

export function defineStatePrimitiveFrameState(
  state: StatePrimitiveFrameState
): StatePrimitiveFrameState {
  const data = statePrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as StatePrimitiveFrameState
}

export const stackFrameSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  detail: z.string().optional(),
  status: z.enum(["active", "waiting", "done", "archived"]).default("waiting"),
  annotation: z.string().optional(),
})

export type StackFrame = z.infer<typeof stackFrameSchema>

export const stackPrimitiveDataSchema = z.object({
  frames: z.array(stackFrameSchema),
  topLabel: z.string().optional(),
})

export type StackPrimitiveData = z.infer<typeof stackPrimitiveDataSchema>

export type StackPrimitiveFrameState = PrimitiveFrameState<StackPrimitiveData> & {
  kind: "stack"
}

export function defineStackPrimitiveFrameState(
  state: StackPrimitiveFrameState
): StackPrimitiveFrameState {
  const data = stackPrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as StackPrimitiveFrameState
}

export const hashMapEntrySchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  value: z.union([z.string(), z.number()]).nullable(),
  status: z
    .enum(["default", "memo", "read", "write", "pending", "done"])
    .default("default"),
  annotation: z.string().optional(),
})

export type HashMapEntry = z.infer<typeof hashMapEntrySchema>

export const hashMapPrimitiveDataSchema = z.object({
  entries: z.array(hashMapEntrySchema),
})

export type HashMapPrimitiveData = z.infer<typeof hashMapPrimitiveDataSchema>

export type HashMapPrimitiveFrameState =
  PrimitiveFrameState<HashMapPrimitiveData> & {
    kind: "hash-map"
  }

export function defineHashMapPrimitiveFrameState(
  state: HashMapPrimitiveFrameState
): HashMapPrimitiveFrameState {
  const data = hashMapPrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as HashMapPrimitiveFrameState
}

export const treeNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  parentId: z.string().min(1).optional(),
  depth: z.number().int().nonnegative().optional(),
  annotation: z.string().optional(),
  status: z
    .enum(["default", "active", "done", "found", "memo", "base", "dim"])
    .default("default"),
})

export type TreeNode = z.infer<typeof treeNodeSchema>

export const treePrimitiveDataSchema = z.object({
  nodes: z.array(treeNodeSchema),
  rootId: z.string().min(1),
})

export type TreePrimitiveData = z.infer<typeof treePrimitiveDataSchema>

export type TreePrimitiveFrameState = PrimitiveFrameState<TreePrimitiveData> & {
  kind: "tree"
}

export function defineTreePrimitiveFrameState(
  state: TreePrimitiveFrameState
): TreePrimitiveFrameState {
  const data = treePrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as TreePrimitiveFrameState
}

export const callTreeNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  stateValue: z.string().min(1),
  parentId: z.string().min(1).optional(),
  depth: z.number().int().nonnegative().optional(),
  badge: z.string().optional(),
  returnValue: z.string().optional(),
  status: z
    .enum(["current", "waiting", "solved", "memo", "dead", "base", "archived"])
    .default("waiting"),
})

export type CallTreeNode = z.infer<typeof callTreeNodeSchema>

export const callTreePrimitiveDataSchema = z.object({
  nodes: z.array(callTreeNodeSchema),
  rootId: z.string().min(1),
})

export type CallTreePrimitiveData = z.infer<typeof callTreePrimitiveDataSchema>

export type CallTreePrimitiveFrameState =
  PrimitiveFrameState<CallTreePrimitiveData> & {
    kind: "call-tree"
  }

export function defineCallTreePrimitiveFrameState(
  state: CallTreePrimitiveFrameState
): CallTreePrimitiveFrameState {
  const data = callTreePrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as CallTreePrimitiveFrameState
}

export const codeTraceLineSchema = z.object({
  id: z.string().min(1),
  lineNumber: z.number().int().positive(),
  text: z.string(),
  tokens: z.array(
    z.object({
      content: z.string(),
      color: z.string().optional(),
      fontStyle: z.number().optional(),
    })
  ),
})

export type CodeTraceLine = z.infer<typeof codeTraceLineSchema>

export const codeTracePrimitiveDataSchema = z.object({
  lines: z.array(codeTraceLineSchema),
  activeLineId: z.string().optional(),
  waitingLineIds: z.array(z.string()).optional(),
  returnedLineIds: z.array(z.string()).optional(),
  background: z.string().optional(),
  foreground: z.string().optional(),
})

export type CodeTracePrimitiveData = z.infer<typeof codeTracePrimitiveDataSchema>

export type CodeTracePrimitiveFrameState =
  PrimitiveFrameState<CodeTracePrimitiveData> & {
    kind: "code-trace"
  }

export function defineCodeTracePrimitiveFrameState(
  state: CodeTracePrimitiveFrameState
): CodeTracePrimitiveFrameState {
  const data = codeTracePrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as CodeTracePrimitiveFrameState
}

export const narrationSegmentPrimitiveSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  tone: z
    .enum([
      "default",
      "active",
      "compare",
      "candidate",
      "done",
      "found",
      "error",
      "memo",
      "base",
      "dim",
    ])
    .optional(),
})

export type NarrationSegmentPrimitive = z.infer<
  typeof narrationSegmentPrimitiveSchema
>

export const narrationPrimitiveDataSchema = z.object({
  summary: z.string().min(1),
  segments: z.array(narrationSegmentPrimitiveSchema).default([]),
  codeLine: z.string().optional(),
  visualChange: z.string().optional(),
})

export type NarrationPrimitiveData = z.infer<typeof narrationPrimitiveDataSchema>

export type NarrationPrimitiveFrameState =
  PrimitiveFrameState<NarrationPrimitiveData> & {
    kind: "narration"
  }

export function defineNarrationPrimitiveFrameState(
  state: NarrationPrimitiveFrameState
): NarrationPrimitiveFrameState {
  const data = narrationPrimitiveDataSchema.parse(state.data)
  return definePrimitiveFrameState({
    ...state,
    data,
  }) as NarrationPrimitiveFrameState
}
