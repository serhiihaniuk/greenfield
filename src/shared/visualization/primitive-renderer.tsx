import type {
  ArrayPrimitiveFrameState,
  CallTreePrimitiveFrameState,
  CodeTracePrimitiveFrameState,
  GraphPrimitiveFrameState,
  HashMapPrimitiveFrameState,
  NarrationPrimitiveFrameState,
  QueuePrimitiveFrameState,
  SequencePrimitiveFrameState,
  StackPrimitiveFrameState,
  StatePrimitiveFrameState,
  TreePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import {
  PrimitiveRoleContext,
  PrimitiveShell,
  SelectedPrimitiveIdContext,
  type PrimitiveRole,
} from "@/shared/visualization/primitive-shell"
import { CallTreeView } from "@/shared/visualization/views/call-tree-view"
import { ArrayView } from "@/shared/visualization/views/array-view"
import { CodeTraceView } from "@/shared/visualization/views/code-trace-view"
import { GraphView } from "@/shared/visualization/views/graph-view"
import { HashMapView } from "@/shared/visualization/views/hash-map-view"
import { NarrationView } from "@/shared/visualization/views/narration-view"
import { QueueView } from "@/shared/visualization/views/queue-view"
import { SequenceView } from "@/shared/visualization/views/sequence-view"
import { StackView } from "@/shared/visualization/views/stack-view"
import { StateView } from "@/shared/visualization/views/state-view"
import { TreeView } from "@/shared/visualization/views/tree-view"

type PrimitiveRendererProps = {
  primitive: PrimitiveFrameState
  role?: PrimitiveRole
  selectedPrimitiveId?: string
}

export function PrimitiveRenderer({
  primitive,
  role,
  selectedPrimitiveId,
}: PrimitiveRendererProps) {
  let content: React.ReactNode

  switch (primitive.kind) {
    case "array":
      content = <ArrayView primitive={primitive as ArrayPrimitiveFrameState} />
      break
    case "sequence":
      content = (
        <SequenceView primitive={primitive as SequencePrimitiveFrameState} />
      )
      break
    case "state":
      content = <StateView primitive={primitive as StatePrimitiveFrameState} />
      break
    case "stack":
      content = <StackView primitive={primitive as StackPrimitiveFrameState} />
      break
    case "queue":
      content = <QueueView primitive={primitive as QueuePrimitiveFrameState} />
      break
    case "hash-map":
      content = (
        <HashMapView primitive={primitive as HashMapPrimitiveFrameState} />
      )
      break
    case "tree":
      content = <TreeView primitive={primitive as TreePrimitiveFrameState} />
      break
    case "graph":
      content = <GraphView primitive={primitive as GraphPrimitiveFrameState} />
      break
    case "call-tree":
      content = (
        <CallTreeView primitive={primitive as CallTreePrimitiveFrameState} />
      )
      break
    case "code-trace":
      content = (
        <CodeTraceView primitive={primitive as CodeTracePrimitiveFrameState} />
      )
      break
    case "narration":
      content = (
        <NarrationView primitive={primitive as NarrationPrimitiveFrameState} />
      )
      break
    default:
      content = (
        <PrimitiveShell primitive={primitive}>
          <pre className="overflow-auto rounded-xl border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground">
            {JSON.stringify(primitive.data, null, 2)}
          </pre>
        </PrimitiveShell>
      )
  }

  return (
    <SelectedPrimitiveIdContext.Provider value={selectedPrimitiveId}>
      <PrimitiveRoleContext.Provider value={role}>
        {content}
      </PrimitiveRoleContext.Provider>
    </SelectedPrimitiveIdContext.Provider>
  )
}
