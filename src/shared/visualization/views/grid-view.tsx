import { AnimatePresence, motion } from "motion/react"

import type {
  GridOverlay,
  GridPrimitiveFrameState,
} from "@/entities/visualization/primitives"
import { cn } from "@/shared/lib/utils"
import { useMotionContract } from "@/shared/motion/contract"
import { PrimitiveShell } from "@/shared/visualization/primitive-shell"
import { ExecutionTokenMark } from "@/shared/visualization/execution-token-mark"

const CELL_SIZE = 96
const CELL_GAP = 8
const COORDINATE_GUTTER = 36

const cellClasses = {
  default: "border-border/70 bg-card text-card-foreground",
  blocked: "border-border/40 bg-muted/10 text-muted-foreground/70",
  open: "border-sky-400/40 bg-sky-400/8 text-sky-100",
  visited: "border-cyan-400/50 bg-cyan-400/10 text-cyan-50",
  frontier: "border-amber-400/55 bg-amber-400/10 text-amber-50",
  source: "border-emerald-400/55 bg-emerald-400/10 text-emerald-50",
  target: "border-fuchsia-400/55 bg-fuchsia-400/10 text-fuchsia-50",
  path: "border-violet-400/55 bg-violet-400/10 text-violet-50",
  region: "border-teal-400/50 bg-teal-400/10 text-teal-50",
  done: "border-emerald-500/40 bg-emerald-500/8 text-emerald-100",
  dim: "border-border/40 bg-muted/8 text-muted-foreground/60",
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

function shortenArrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  inset: number
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy)
  if (len < inset * 2) {
    return { x1, y1, x2, y2 }
  }
  const nx = dx / len
  const ny = dy / len
  return {
    x1: x1 + nx * inset,
    y1: y1 + ny * inset,
    x2: x2 - nx * inset,
    y2: y2 - ny * inset,
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

    const sc = getCellCenter(source.row, source.col, showRows, showCols)
    const tc = getCellCenter(target.row, target.col, showRows, showCols)

    const dx = tc.x - sc.x
    const dy = tc.y - sc.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const isHorizontal = Math.abs(dx) >= Math.abs(dy)
    const angle = Math.atan2(dy, dx) * (180 / Math.PI)

    // Midpoint between cell centers (sits in the gap)
    const mx = (sc.x + tc.x) / 2
    const my = (sc.y + tc.y) / 2

    // For non-adjacent cells, show a subtle connecting line
    const isAdjacent = dist < CELL_SIZE + CELL_GAP * 3
    const shortened = shortenArrow(sc.x, sc.y, tc.x, tc.y, CELL_SIZE / 2 + 2)

    return (
      <g key={overlay.id}>
        {/* Connecting line for non-adjacent cells */}
        {!isAdjacent ? (
          <line
            x1={shortened.x1}
            y1={shortened.y1}
            x2={shortened.x2}
            y2={shortened.y2}
            className={strokeClass}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.5}
          />
        ) : null}

        {/* Directional chevron in the gap */}
        <path
          d="M -4 -5.5 L 5 0 L -4 5.5"
          transform={`translate(${mx}, ${my}) rotate(${angle})`}
          fill="none"
          className={strokeClass}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Label offset perpendicular to direction */}
        {overlay.label ? (
          <text
            x={mx + (isHorizontal ? 0 : 20)}
            y={my + (isHorizontal ? -18 : 0)}
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-muted-foreground font-mono text-xs"
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
        strokeWidth="1.5"
        strokeDasharray="4 3"
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

    const left = Math.min(...cells.map((cell) => cell.x)) - 5
    const top = Math.min(...cells.map((cell) => cell.y)) - 5
    const right = Math.max(...cells.map((cell) => cell.x)) + CELL_SIZE + 5
    const bottom = Math.max(...cells.map((cell) => cell.y)) + CELL_SIZE + 5

    return (
      <rect
        key={overlay.id}
        x={left}
        y={top}
        width={right - left}
        height={bottom - top}
        rx="16"
        className={cn(strokeClass, overlay.kind === "region-outline" ? fillClass : "fill-none")}
        strokeWidth="1.5"
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
        x={origin.x - 4}
        y={origin.y - 4}
        width={CELL_SIZE + 8}
        height={CELL_SIZE + 8}
        rx="16"
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
  const { animateTravel, transitions } = useMotionContract()
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
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {primitive.data.legend.map((item) => (
              <div
                key={`${item.state}-${item.label}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/10 px-2 py-0.5 font-mono text-muted-foreground"
              >
                <span
                  className={cn(
                    "size-2 rounded-full border",
                    cellClasses[item.state]
                  )}
                />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="overflow-auto rounded-2xl border border-border/60 bg-muted/14 p-6">
          <div className="flex min-w-max justify-center">
            <div
              className="relative"
              style={{
                width: boardWidth,
                height: boardHeight,
              }}
            >
              {showCols ? (
                <div className="absolute inset-x-0 top-0 flex">
                  {Array.from({ length: primitive.data.cols }, (_, col) => (
                    <div
                      key={`col-${col}`}
                      className="absolute font-mono text-sm text-muted-foreground/70"
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
                      className="absolute font-mono text-sm text-muted-foreground/70"
                      style={{
                        top: (showCols ? COORDINATE_GUTTER : 0) + row * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 2 - 9,
                        width: COORDINATE_GUTTER - 8,
                        textAlign: "right",
                      }}
                    >
                      {row}
                    </div>
                  ))}
                </div>
              ) : null}

              {/* Cells layer */}
              {primitive.data.cells.map((cell) => {
                const origin = getCellOrigin(cell.row, cell.col, showRows, showCols)
                const isActive = Boolean(cell.tokenStyle)
                return (
                  <motion.div
                    key={cell.id}
                    data-token-id={cell.tokenId}
                    className={cn(
                      "absolute flex flex-col items-center justify-center rounded-2xl border font-mono transition-[background-color,border-color,color] duration-200 ease-out",
                      cellClasses[cell.state]
                    )}
                    style={{
                      left: origin.x,
                      top: origin.y,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }}
                    animate={
                      animateTravel
                        ? { scale: isActive ? 1.04 : 1 }
                        : undefined
                    }
                    transition={transitions.highlight}
                  >
                    {/* Value — commit animation on change */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={`${cell.id}-v-${cell.value}`}
                        className="text-xl leading-none font-semibold"
                        initial={
                          animateTravel
                            ? { opacity: 0, y: 6, filter: "blur(2px)" }
                            : false
                        }
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        exit={
                          animateTravel
                            ? { opacity: 0, y: -6, filter: "blur(2px)" }
                            : { opacity: 0 }
                        }
                        transition={transitions.valueCommit}
                      >
                        {cell.value ?? ""}
                      </motion.span>
                    </AnimatePresence>

                    {/* Annotation — crossfade on change */}
                    <AnimatePresence mode="popLayout" initial={false}>
                      {cell.annotation ? (
                        <motion.span
                          key={`${cell.id}-a-${cell.annotation}`}
                          className="mt-1.5 text-xs leading-none text-inherit"
                          initial={
                            animateTravel
                              ? { opacity: 0, y: 4 }
                              : false
                          }
                          animate={{ opacity: 0.6, y: 0 }}
                          exit={
                            animateTravel
                              ? { opacity: 0, y: -4 }
                              : { opacity: 0 }
                          }
                          transition={transitions.shell}
                        >
                          {cell.annotation}
                        </motion.span>
                      ) : null}
                    </AnimatePresence>

                    {/* Token mark — pop in with spring */}
                    <AnimatePresence initial={false}>
                      {cell.tokenStyle ? (
                        <motion.span
                          key={`${cell.id}-t-${cell.tokenLabel}`}
                          className="absolute bottom-1.5 left-1/2 -translate-x-1/2"
                          initial={
                            animateTravel
                              ? { opacity: 0, scale: 0.88 }
                              : false
                          }
                          animate={{ opacity: 1, scale: 1 }}
                          exit={
                            animateTravel
                              ? { opacity: 0, scale: 0.88 }
                              : { opacity: 0 }
                          }
                          transition={transitions.pointerEnter}
                        >
                          <ExecutionTokenMark
                            label={cell.tokenLabel ?? String(cell.value ?? cell.id)}
                            style={cell.tokenStyle}
                          />
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </motion.div>
                )
              })}

              {/* Overlays layer — above cells */}
              <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-visible"
                width={boardWidth}
                height={boardHeight}
                style={{ zIndex: 10 }}
              >
                <AnimatePresence initial={false}>
                  {primitive.data.overlays.map((overlay) => {
                    const element = renderOverlay(overlay, cellMap, showRows, showCols)
                    if (!element) return null
                    return (
                      <motion.g
                        key={overlay.id}
                        initial={
                          animateTravel ? { opacity: 0 } : false
                        }
                        animate={{ opacity: 1 }}
                        exit={
                          animateTravel
                            ? { opacity: 0 }
                            : { opacity: 0 }
                        }
                        transition={transitions.shell}
                      >
                        {element}
                      </motion.g>
                    )
                  })}
                </AnimatePresence>
              </svg>

            </div>
          </div>
        </div>
      </div>
    </PrimitiveShell>
  )
}
