import type {
  AnnotationTone,
  EdgeTone,
  Emphasis,
  HighlightTone,
  PointerTone,
} from "@/entities/visualization/types"

type ToneClassMap<TTone extends string> = Record<TTone, string>

export const highlightToneClasses: ToneClassMap<HighlightTone> = {
  default: "border-border bg-card text-card-foreground",
  active: "border-cyan-400/70 bg-cyan-400/12 text-cyan-50",
  compare: "border-sky-400/70 bg-sky-400/12 text-sky-50",
  candidate: "border-amber-400/70 bg-amber-400/12 text-amber-50",
  done: "border-emerald-500/45 bg-emerald-500/8 text-emerald-100",
  found: "border-emerald-400/80 bg-emerald-400/16 text-emerald-50",
  error: "border-rose-400/70 bg-rose-400/14 text-rose-50",
  memo: "border-violet-400/65 bg-violet-400/12 text-violet-50",
  base: "border-teal-400/65 bg-teal-400/12 text-teal-50",
  mutated: "border-orange-400/70 bg-orange-400/14 text-orange-50",
  dim: "border-border/70 bg-muted/35 text-muted-foreground",
}

export const pointerToneClasses: ToneClassMap<PointerTone> = {
  primary: "text-cyan-300",
  secondary: "text-slate-300",
  compare: "text-sky-300",
  success: "text-emerald-300",
  error: "text-rose-300",
  done: "text-emerald-400/80",
  special: "text-amber-300",
}

export const annotationToneClasses: ToneClassMap<AnnotationTone> = {
  default: "border-border/80 bg-muted/35 text-foreground",
  muted: "border-border/60 bg-muted/20 text-muted-foreground",
  active: "border-cyan-400/60 bg-cyan-400/12 text-cyan-50",
  success: "border-emerald-400/60 bg-emerald-400/12 text-emerald-50",
  warning: "border-amber-400/60 bg-amber-400/12 text-amber-50",
  error: "border-rose-400/60 bg-rose-400/12 text-rose-50",
  memo: "border-violet-400/60 bg-violet-400/12 text-violet-50",
  special: "border-fuchsia-400/60 bg-fuchsia-400/12 text-fuchsia-50",
}

export const edgeToneClasses: ToneClassMap<EdgeTone> = {
  default: "stroke-border",
  active: "stroke-cyan-400",
  compare: "stroke-sky-400",
  candidate: "stroke-amber-400",
  done: "stroke-emerald-500/70",
  found: "stroke-emerald-400",
  error: "stroke-rose-400",
  memo: "stroke-violet-400",
  dim: "stroke-muted-foreground/40",
}

export const emphasisClasses: ToneClassMap<Emphasis> = {
  soft: "shadow-none",
  normal: "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
  strong:
    "shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_0_24px_rgba(56,189,248,0.08)]",
}
