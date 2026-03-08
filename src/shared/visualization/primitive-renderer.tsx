import type {
  ArrayPrimitiveFrameState,
  CallTreePrimitiveFrameState,
  CodeTracePrimitiveFrameState,
  HashMapPrimitiveFrameState,
  NarrationPrimitiveFrameState,
  StackPrimitiveFrameState,
  StatePrimitiveFrameState,
  TreePrimitiveFrameState,
} from "@/entities/visualization/primitives"
import type { PrimitiveFrameState } from "@/entities/visualization/types"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { CallTreeView } from "@/shared/visualization/views/call-tree-view"
import { ArrayView } from "@/shared/visualization/views/array-view"
import { CodeTraceView } from "@/shared/visualization/views/code-trace-view"
import { HashMapView } from "@/shared/visualization/views/hash-map-view"
import { NarrationView } from "@/shared/visualization/views/narration-view"
import { StackView } from "@/shared/visualization/views/stack-view"
import { StateView } from "@/shared/visualization/views/state-view"
import { TreeView } from "@/shared/visualization/views/tree-view"

type PrimitiveRendererProps = {
  primitive: PrimitiveFrameState
}

export function PrimitiveRenderer({ primitive }: PrimitiveRendererProps) {
  switch (primitive.kind) {
    case "array":
      return <ArrayView primitive={primitive as ArrayPrimitiveFrameState} />
    case "state":
      return <StateView primitive={primitive as StatePrimitiveFrameState} />
    case "stack":
      return <StackView primitive={primitive as StackPrimitiveFrameState} />
    case "hash-map":
      return <HashMapView primitive={primitive as HashMapPrimitiveFrameState} />
    case "tree":
      return <TreeView primitive={primitive as TreePrimitiveFrameState} />
    case "call-tree":
      return <CallTreeView primitive={primitive as CallTreePrimitiveFrameState} />
    case "code-trace":
      return <CodeTraceView primitive={primitive as CodeTracePrimitiveFrameState} />
    case "narration":
      return <NarrationView primitive={primitive as NarrationPrimitiveFrameState} />
    default:
      return (
        <PrimitiveShell primitive={primitive}>
          <pre className="overflow-auto rounded-xl border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground">
            {JSON.stringify(primitive.data, null, 2)}
          </pre>
        </PrimitiveShell>
      )
  }
}
