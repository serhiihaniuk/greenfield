import { useReducedMotion } from "motion/react"

const MOTION_EASINGS = {
  /** Fast attack, smooth deceleration — general-purpose ease-out. */
  standard: [0.22, 1, 0.36, 1],
  /** Quick exit — fast ease-in for disappearing elements. */
  exit: [0.32, 0, 0.67, 0],
} as const

export const MOTION_TOKENS = {
  shell: {
    duration: 0.2,
    ease: MOTION_EASINGS.standard,
  },
  highlight: {
    duration: 0.25,
    ease: MOTION_EASINGS.standard,
  },
  /** Layout spring for structural items (stack push/pop, tree nodes). */
  pointer: {
    type: "spring",
    stiffness: 320,
    damping: 30,
    mass: 1,
  },
  /** Pointer cross-cell travel — responsive with slight settle. */
  pointerTravel: {
    type: "spring",
    stiffness: 260,
    damping: 24,
    mass: 1,
  },
  /** Pointer entrance — softer spring with gentle overshoot. */
  pointerEnter: {
    type: "spring",
    stiffness: 180,
    damping: 18,
    mass: 0.8,
  },
  /** Pointer disappearance — quick and clean. */
  pointerExit: {
    duration: 0.15,
    ease: MOTION_EASINGS.exit,
  },
  layout: {
    type: "spring",
    stiffness: 280,
    damping: 28,
    mass: 1,
  },
  valueCommit: {
    duration: 0.22,
    ease: MOTION_EASINGS.standard,
  },
} as const

export function useMotionContract() {
  const prefersReducedMotion = useReducedMotion()

  return {
    prefersReducedMotion,
    animateTravel: !prefersReducedMotion,
    transitions: MOTION_TOKENS,
  }
}
