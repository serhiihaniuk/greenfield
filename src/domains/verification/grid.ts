import type { GridPrimitiveFrameState } from "@/entities/visualization/primitives"
import {
  createVerificationReport,
  type VerificationIssue,
  type VerificationReport,
} from "@/domains/verification/types"

type GridCellCoordinate = {
  row: number
  col: number
}

export function buildGridCellCoordinateMap(primitive: GridPrimitiveFrameState) {
  return new Map<string, GridCellCoordinate>(
    primitive.data.cells.map((cell) => [
      cell.id,
      {
        row: cell.row,
        col: cell.col,
      },
    ])
  )
}

export function areGridNeighbors(
  left: GridCellCoordinate,
  right: GridCellCoordinate,
  adjacencyMode: GridPrimitiveFrameState["data"]["adjacencyMode"] = "orthogonal-4"
) {
  const rowDelta = Math.abs(left.row - right.row)
  const colDelta = Math.abs(left.col - right.col)

  if (rowDelta === 0 && colDelta === 0) {
    return false
  }

  if (adjacencyMode === "orthogonal-4") {
    return rowDelta + colDelta === 1
  }

  return rowDelta <= 1 && colDelta <= 1
}

export function verifyGridPrimitiveFrame(
  primitive: GridPrimitiveFrameState,
  frameId: string
): VerificationReport {
  const issues: VerificationIssue[] = []
  const seenCoordinates = new Set<string>()
  const seenIds = new Set<string>()
  const { rows, cols } = primitive.data

  for (const cell of primitive.data.cells) {
    if (cell.row < 0 || cell.row >= rows || cell.col < 0 || cell.col >= cols) {
      issues.push({
        code: "GRID_CELL_OUT_OF_BOUNDS",
        kind: "frame",
        severity: "error",
        message: `Grid cell "${cell.id}" in primitive "${primitive.id}" lies outside the declared ${rows}x${cols} board.`,
        frameId,
        meta: {
          primitiveId: primitive.id,
          cellId: cell.id,
          row: cell.row,
          col: cell.col,
        },
      })
    }

    if (seenIds.has(cell.id)) {
      issues.push({
        code: "GRID_CELL_DUPLICATE_ID",
        kind: "frame",
        severity: "error",
        message: `Grid primitive "${primitive.id}" duplicates cell id "${cell.id}".`,
        frameId,
        meta: {
          primitiveId: primitive.id,
          cellId: cell.id,
        },
      })
    }
    seenIds.add(cell.id)

    const coordinateKey = `${cell.row}:${cell.col}`
    if (seenCoordinates.has(coordinateKey)) {
      issues.push({
        code: "GRID_CELL_DUPLICATE_COORDINATE",
        kind: "frame",
        severity: "error",
        message: `Grid primitive "${primitive.id}" places multiple cells at (${cell.row}, ${cell.col}).`,
        frameId,
        meta: {
          primitiveId: primitive.id,
          row: cell.row,
          col: cell.col,
        },
      })
    }
    seenCoordinates.add(coordinateKey)
  }

  const cellMap = buildGridCellCoordinateMap(primitive)

  for (const overlay of primitive.data.overlays) {
    for (const cellId of [
      overlay.sourceCellId,
      overlay.targetCellId,
      ...(overlay.cellIds ?? []),
    ].filter((value): value is string => Boolean(value))) {
      if (!cellMap.has(cellId)) {
        issues.push({
          code: "GRID_OVERLAY_TARGET_MISSING",
          kind: "frame",
          severity: "error",
          message: `Grid overlay "${overlay.id}" in primitive "${primitive.id}" references missing cell "${cellId}".`,
          frameId,
          meta: {
            primitiveId: primitive.id,
            overlayId: overlay.id,
            cellId,
          },
        })
      }
    }
  }

  return createVerificationReport(issues)
}
