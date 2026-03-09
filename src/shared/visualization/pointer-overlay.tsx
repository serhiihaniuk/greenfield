import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type RefCallback,
} from "react"

import type {
  PointerPlacement,
  PointerSpec,
} from "@/entities/visualization/types"
import { PointerChip } from "@/shared/visualization/pointer-chip"

export type PointerAnchor = {
  targetId: string
  placement: PointerPlacement
  x: number
  y: number
}

export type PointerAnchorMap = Map<string, PointerAnchor>

type AnchorTargetRegistration = {
  rootRef: MutableRefObject<HTMLDivElement | null>
  registerTarget: (targetId: string) => RefCallback<HTMLElement>
  anchors: PointerAnchorMap
}

type PointerLayerProps = {
  pointers: PointerSpec[]
  anchors: PointerAnchorMap
  scopeId?: string
}

type ResolvedPointer = {
  pointer: PointerSpec
  anchor: PointerAnchor
}

const STACK_OFFSET = 16

function getAnchorKey(targetId: string, placement: PointerPlacement) {
  return `${targetId}:${placement}`
}

function getBasePlacement(placement: PointerPlacement) {
  if (placement.startsWith("top")) {
    return "top"
  }
  if (placement.startsWith("bottom")) {
    return "bottom"
  }
  if (placement.startsWith("left")) {
    return "left"
  }
  if (placement.startsWith("right")) {
    return "right"
  }

  return placement
}

function sortPointers(pointers: PointerSpec[]) {
  return [...pointers].sort((left, right) => {
    const leftPriority = left.priority ?? 0
    const rightPriority = right.priority ?? 0
    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return left.id.localeCompare(right.id)
  })
}

function resolveAnchor(
  anchors: PointerAnchorMap,
  pointer: PointerSpec
): PointerAnchor | undefined {
  const placement = pointer.placement ?? "top"
  const exact = anchors.get(getAnchorKey(pointer.targetId, placement))
  if (exact) {
    return exact
  }

  return anchors.get(getAnchorKey(pointer.targetId, getBasePlacement(placement)))
}

function buildAnchorMap(
  targets: Map<string, HTMLElement>
): PointerAnchorMap {
  const next = new Map<string, PointerAnchor>()

  for (const [targetId, node] of targets) {
    const left = node.offsetLeft
    const top = node.offsetTop
    const width = node.offsetWidth
    const height = node.offsetHeight

    const centerX = left + width / 2
    const centerY = top + height / 2
    const startX = left + Math.min(12, width / 4)
    const endX = left + width - Math.min(12, width / 4)
    const startY = top + Math.min(12, height / 4)
    const endY = top + height - Math.min(12, height / 4)

    const anchors: PointerAnchor[] = [
      { targetId, placement: "top", x: centerX, y: top - 6 },
      { targetId, placement: "top-start", x: startX, y: top - 6 },
      { targetId, placement: "top-end", x: endX, y: top - 6 },
      { targetId, placement: "bottom", x: centerX, y: top + height + 6 },
      { targetId, placement: "bottom-start", x: startX, y: top + height + 6 },
      { targetId, placement: "bottom-end", x: endX, y: top + height + 6 },
      { targetId, placement: "left", x: left - 6, y: centerY },
      { targetId, placement: "left-start", x: left - 6, y: startY },
      { targetId, placement: "left-end", x: left - 6, y: endY },
      { targetId, placement: "right", x: left + width + 6, y: centerY },
      { targetId, placement: "right-start", x: left + width + 6, y: startY },
      { targetId, placement: "right-end", x: left + width + 6, y: endY },
      { targetId, placement: "inline", x: centerX, y: centerY },
    ]

    for (const anchor of anchors) {
      next.set(getAnchorKey(anchor.targetId, anchor.placement), anchor)
    }
  }

  return next
}

export function usePointerAnchorRegistry(): AnchorTargetRegistration {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const targetsRef = useRef(new Map<string, HTMLElement>())
  const callbackCacheRef = useRef(new Map<string, RefCallback<HTMLElement>>())
  const [anchors, setAnchors] = useState<PointerAnchorMap>(new Map())
  const [registrationVersion, setRegistrationVersion] = useState(0)

  const registerTarget = useCallback((targetId: string) => {
    const cached = callbackCacheRef.current.get(targetId)
    if (cached) {
      return cached
    }

    const callback: RefCallback<HTMLElement> = (node) => {
      if (node) {
        targetsRef.current.set(targetId, node)
      } else {
        targetsRef.current.delete(targetId)
      }

      setRegistrationVersion((version) => version + 1)
    }

    callbackCacheRef.current.set(targetId, callback)
    return callback
  }, [])

  useLayoutEffect(() => {
    const update = () => {
      setAnchors(buildAnchorMap(targetsRef.current))
    }

    update()

    if (typeof ResizeObserver === "undefined") {
      return
    }

    const observer = new ResizeObserver(() => {
      update()
    })

    if (rootRef.current) {
      observer.observe(rootRef.current)
    }

    for (const target of targetsRef.current.values()) {
      observer.observe(target)
    }

    return () => {
      observer.disconnect()
    }
  }, [registrationVersion])

  return {
    rootRef,
    registerTarget,
    anchors,
  }
}

export function PointerLayer({
  pointers,
  anchors,
  scopeId,
}: PointerLayerProps) {
  const grouped = useMemo(() => {
    const next = new Map<string, ResolvedPointer[]>()

    for (const pointer of sortPointers(pointers)) {
      const anchor = resolveAnchor(anchors, pointer)
      if (!anchor) {
        continue
      }

      const key = getAnchorKey(anchor.targetId, anchor.placement)
      const existing = next.get(key) ?? []
      existing.push({ pointer, anchor })
      next.set(key, existing)
    }

    return next
  }, [anchors, pointers])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-clip">
      {[...grouped.entries()].map(([key, group]) => {
        const anchor = group[0]?.anchor
        if (!anchor) {
          return null
        }

        const placement = anchor.placement
        const basePlacement = getBasePlacement(placement)
        const testPlacement =
          basePlacement === "bottom"
            ? "bottom"
            : basePlacement === "top"
              ? "top"
              : basePlacement

        return (
          <div
            key={key}
            data-testid={`pointer-stack-${testPlacement}-${anchor.targetId}`}
            className="absolute overflow-visible"
            style={{ left: anchor.x, top: anchor.y }}
          >
            {group.map(({ pointer }, index) => {
              const spread = (index - (group.length - 1) / 2) * STACK_OFFSET
              const offset =
                basePlacement === "left" || basePlacement === "right"
                  ? { x: 0, y: spread }
                  : { x: spread, y: 0 }

              return (
                <PointerChip
                  key={pointer.id}
                  pointer={pointer}
                  scopeId={scopeId}
                  x={offset.x}
                  y={offset.y}
                />
              )
            })}
          </div>
        )
      })}
    </div>
  )
}
