import type {
  GridOverlay,
  GridPrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"

const CELL_SIZE = 48
const CELL_GAP = 6
const COORDINATE_GUTTER = 20

const cellClasses = {
  default: "border-border/70 bg-card text-card-foreground",
  blocked: "border-border/55 bg-muted/16 text-muted-foreground",
  open: "border-sky-400/45 bg-sky-400/8 text-sky-50",
  visited: "border-cyan-400/55 bg-cyan-400/10 text-cyan-50",
  frontier: "border-amber-400/65 bg-amber-400/12 text-amber-50",
  source: "border-emerald-400/65 bg-emerald-400/12 text-emerald-50",
  target: "border-fuchsia-400/65 bg-fuchsia-400/12 text-fuchsia-50",
  path: "border-violet-400/65 bg-violet-400/12 text-violet-50",
  region: "border-teal-400/60 bg-teal-400/12 text-teal-50",
  done: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  dim: "border-border/50 bg-muted/10 text-muted-foreground",
} as const

const overlayStrokeClasses = {
  default: "stroke-cyan-300/85",
  muted: "stroke-muted-foreground/60",
  active: "stroke-cyan-300",
  success: "stroke-emerald-300",
  warning: "stroke-amber-300",
  error: "stroke-rose-300",
  memo: "stroke-violet-300",
  special: "stroke-fuchsia-300",
} as const

const overlayFillClasses = {
  default: "fill-cyan-300/12",
  muted: "fill-muted-foreground/10",
  active: "fill-cyan-300/12",
  success: "fill-emerald-300/12",
  warning: "fill-amber-300/12",
  error: "fill-rose-300/12",
  memo: "fill-violet-300/12",
  special: "fill-fuchsia-300/12",
} as const

function getCellOrigin(row: number, col: number, showRows: boolean, showCols: boolean) {
  return {
    x: (showRows ? COORDINATE_GUTTER : 0) + col * (CELL_SIZE + CELL_GAP),
    y: (showCols ? COORDINATE_GUTTER : 0) + row * (CELL_SIZE + CELL_GAP),
  }
}

function getCellCenter(row: number, col: number, showRows: boolean, showCols: boolean) {
  const origin = getCellOrigin(row, col, showRows, showCols)
  return {
    x: origin.x + CELL_SIZE / 2,
    y: origin.y + CELL_SIZE / 2,
  }
}

function renderOverlay(
  overlay: GridOverlay,
  cellMap: Map<string, { row: number; col: number }>,
  showRows: boolean,
  showCols: boolean
) {
  const tone = overlay.tone ?? "active"
  const strokeClass = overlayStrokeClasses[tone]
  const fillClass = overlayFillClasses[tone]

  if (overlay.kind === "neighbor-arrow" && overlay.sourceCellId && overlay.targetCellId) {
    const source = cellMap.get(overlay.sourceCellId)
    const target = cellMap.get(overlay.targetCellId)
    if (!source || !target) {
      return null
    }

    const start = getCellCenter(source.row, source.col, showRows, showCols)
    const end = getCellCenter(target.row, target.col, showRows, showCols)

    return (
      <g key={overlay.id} className={cn(strokeClass, fillClass)}>
        <defs>
          <marker
            id={`grid-arrow-${overlay.id}`}
            markerWidth="8"
            markerHeight="8"
            refX="7"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" className={fillClass} />
          </marker>
        </defs>
        <line
          x1={start.x}
          y1={start.y}
          x2={end.x}
          y2={end.y}
          className={strokeClass}
          strokeWidth="2"
          strokeLinecap="round"
          markerEnd={`url(#grid-arrow-${overlay.id})`}
        />
        {overlay.label ? (
          <text
            x={(start.x + end.x) / 2}
            y={(start.y + end.y) / 2 - 8}
            textAnchor="middle"
            className="fill-muted-foreground font-mono text-[10px]"
          >
            {overlay.label}
          </text>
        ) : null}
      </g>
    )
  }

  if (overlay.kind === "frontier-ring" && overlay.targetCellId) {
    const target = cellMap.get(overlay.targetCellId)
    if (!target) {
      return null
    }
    const center = getCellCenter(target.row, target.col, showRows, showCols)
    return (
      <circle
        key={overlay.id}
        cx={center.x}
        cy={center.y}
        r={CELL_SIZE / 2 + 6}
        className={cn(strokeClass, "fill-none")}
        strokeWidth="2"
        strokeDasharray="4 4"
      />
    )
  }

  if ((overlay.kind === "region-outline" || overlay.kind === "path-segment") && overlay.cellIds?.length) {
    const cells = overlay.cellIds
      .map((cellId) => {
        const cell = cellMap.get(cellId)
        if (!cell) {
          return undefined
        }
        return getCellOrigin(cell.row, cell.col, showRows, showCols)
      })
      .filter((value): value is { x: number; y: number } => Boolean(value))

    if (cells.length === 0) {
      return null
    }

    const left = Math.min(...cells.map((cell) => cell.x)) - 4
    const top = Math.min(...cells.map((cell) => cell.y)) - 4
    const right = Math.max(...cells.map((cell) => cell.x)) + CELL_SIZE + 4
    const bottom = Math.max(...cells.map((cell) => cell.y)) + CELL_SIZE + 4

    return (
      <rect
        key={overlay.id}
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx="14"
        className={cn(strokeClass, overlay.kind === "region-outline" ? fillClass : "fill-none")}
        strokeWidth="2"
        strokeDasharray={overlay.kind === "path-segment" ? "6 4" : undefined}
      />
    )
  }

  if (overlay.kind === "focus-cell" && overlay.targetCellId) {
    const target = cellMap.get(overlay.targetCellId)
    if (!target) {
      return null
    }
    const origin = getCellOrigin(target.row, target.col, showRows, showCols)
    return (
      <rect
        key={overlay.id}
        x={origin.x - 3}
        y={origin.y - 3}
        width={CELL_SIZE + 6}
        height={CELL_SIZE + 6}
        rx="14"
        className={cn(strokeClass, "fill-none")}
        strokeWidth="2"
      />
    )
  }

  return null
}

export function GridView({
  primitive,
}: {
  primitive: GridPrimitiveFrameState
}) {
  const showRows = primitive.data.coordinateLabels?.rows ?? false
  const showCols = primitive.data.coordinateLabels?.cols ?? false
  const boardWidth =
    primitive.data.cols * CELL_SIZE +
    Math.max(primitive.data.cols - 1, 0) * CELL_GAP +
    (showRows ? COORDINATE_GUTTER : 0)
  const boardHeight =
    primitive.data.rows * CELL_SIZE +
    Math.max(primitive.data.rows - 1, 0) * CELL_GAP +
    (showCols ? COORDINATE_GUTTER : 0)

  const cellMap = new Map(
    primitive.data.cells.map((cell) => [cell.id, { row: cell.row, col: cell.col }])
  )

  return (
    <PrimitiveShell primitive={primitive}>
      <div className="grid gap-3">
        {primitive.data.legend.length > 0 ? (
          <div className="flex flex-wrap gap-2 text-[11px]">
            {primitive.data.legend.map((item) => (
              <div
                key={`${item.state}-${item.label}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/16 px-2 py-1 font-mono text-muted-foreground"
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full border",
                    cellClasses[item.state]
                  )}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="overflow-auto rounded-2xl border border-border/60 bg-muted/14 p-4">
          <div className="flex min-w-max justify-center">
            <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
              {showCols ? (
                <div className="absolute inset-x-0 top-0 flex">
                  {Array.from({ length: primitive.data.cols }, (_, col) => (
                    <div
                      key={`col-${col}`}
                      className="absolute font-mono text-[10px] text-muted-foreground"
                      style={{
                        left: (showRows ? COORDINATE_GUTTER : 0) + col * (CELL_SIZE + CELL_GAP),
                        width: CELL_SIZE,
                        textAlign: "center",
                      }}
                    >
                      {col}
                    </div>
                  ))}
                </div>
              ) : null}
              {showRows ? (
                <div className="absolute inset-y-0 left-0">
                  {Array.from({ length: primitive.data.rows }, (_, row) => (
                    <div
                      key={`row-${row}`}
                      className="absolute font-mono text-[10px] text-muted-foreground"
                      style={{
                        top: (showCols ? COORDINATE_GUTTER : 0) + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 - 6,
                        width: COORDINATE_GUTTER - 6,
                        textAlign: "right",
                      }}
                    >
                      {row}
                    </div>
                  ))}
                </div>
              ) : null}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-visible"
                width={boardWidth}
                height={boardHeight}
              >
                {primitive.data.overlays.map((overlay) =>
                  renderOverlay(overlay, cellMap, showRows, showCols)
                )}
              </svg>
              {primitive.data.cells.map((cell) => {
                const origin = getCellOrigin(cell.row, cell.col, showRows, showCols)
                return (
                  <div
                    key={cell.id}
                    data-token-id={cell.tokenId}
                    className={cn(
                      "absolute flex flex-col items-center justify-center rounded-xl border font-mono shadow-[0_14px_28px_rgba(2,8,23,0.22)] transition-[background-color,border-color,color,box-shadow] duration-200 ease-out",
                      cellClasses[cell.state]
                    )}
                    style={{
                      left: origin.x,
                      top: origin.y,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                  >
                    {cell.tokenStyle ? (
                      <div className="absolute bottom-[calc(100%+0.45rem)] left-1/2 -translate-x-1/2">
                        <ExecutionTokenMark
                          label={cell.tokenLabel ?? String(cell.value ?? cell.id)}
                          style={cell.tokenStyle}
                        />
                      </div>
                    ) : null}
                    <span className="text-sm leading-none font-semibold">
                      {cell.value ?? ""}
                    </span>
                    {cell.annotation ? (
                      <span className="mt-1 text-[10px] leading-none text-muted-foreground">
                        {cell.annotation}
                      </span>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
