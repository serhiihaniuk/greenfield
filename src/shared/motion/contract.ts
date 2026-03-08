import { useReducedMotion } from "motion/react"

const MOTION_EASINGS = {
  standard: [0.16, 1, 0.3, 1],
  emphasis: [0.2, 0.85, 0.2, 1],
} as const

export const MOTION_TOKENS = {
  shell: {
    duration: 0.2,
    ease: MOTION_EASINGS.standard,
  },
  highlight: {
    duration: 0.18,
    ease: MOTION_EASINGS.standard,
  },
  pointer: {
    duration: 0.28,
    ease: MOTION_EASINGS.emphasis,
  },
  pointerTravel: {
    type: "spring",
    stiffness: 400,
    damping: 25,
    mass: 1,
  },
  layout: {
    duration: 0.32,
    ease: MOTION_EASINGS.standard,
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
