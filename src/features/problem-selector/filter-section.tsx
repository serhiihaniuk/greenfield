import type { ReactNode } from "react"

import { Checkbox } from "@/shared/ui/checkbox"
import { FieldLegend, FieldSet } from "@/shared/ui/field"
import { Label } from "@/shared/ui/label"
import { cn } from "@/shared/lib/utils"

type FilterSectionProps<T extends string> = {
  title: string
  options: readonly T[]
  labels: Record<T, string>
  active: Set<T>
  counts: Map<T, number>
  onToggle: (value: T) => void
  renderLabel?: (option: T, label: string) => ReactNode
}

export function FilterSection<T extends string>({
  title,
  options,
  labels,
  active,
  counts,
  onToggle,
  renderLabel,
}: FilterSectionProps<T>) {
  return (
    <FieldSet className="gap-2.5">
      <FieldLegend
        variant="label"
        className="text-xs uppercase tracking-[0.18em] text-muted-foreground"
      >
        {title}
      </FieldLegend>
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const count = counts.get(option) ?? 0
          const fieldId = `problem-filter-${title}-${option}`

          return (
            <div key={option} className="flex items-center gap-2">
              <Checkbox
                id={fieldId}
                checked={active.has(option)}
                onCheckedChange={() => onToggle(option)}
              />
              <Label
                htmlFor={fieldId}
                className="min-w-0 flex-1 cursor-pointer text-sm font-normal"
              >
                {renderLabel ? renderLabel(option, labels[option]) : labels[option]}
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  count === 0 ? "text-muted-foreground/40" : "text-muted-foreground"
                )}
              >
                {count}
              </span>
            </div>
          )
        })}
      </div>
    </FieldSet>
  )
}
