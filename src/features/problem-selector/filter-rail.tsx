import {
  catalogFilterOptions,
  categoryLabels,
  confusionLabels,
  difficultyLabels,
  mechanismLabels,
} from "@/domains/lessons/catalog"
import type { LessonDifficulty } from "@/domains/lessons/catalog-types"
import { confusionTypeSchema, type ConfusionType } from "@/domains/lessons/types"
import type { CatalogCountMaps, CatalogFilterState } from "@/features/problem-selector/catalog-query"
import { FilterSection } from "@/features/problem-selector/filter-section"
import { Badge } from "@/shared/ui/badge"
import { ScrollArea } from "@/shared/ui/scroll-area"
import { Separator } from "@/shared/ui/separator"

const difficultyBadgeVariant: Record<LessonDifficulty, "success" | "warning" | "destructive"> = {
  easy: "success",
  medium: "warning",
  hard: "destructive",
}

function renderDifficultyLabel(option: string, label: string) {
  return (
    <Badge variant={difficultyBadgeVariant[option as LessonDifficulty]}>
      {label}
    </Badge>
  )
}

type FilterRailProps = {
  filter: CatalogFilterState
  counts: CatalogCountMaps
  onToggleCategory: (value: (typeof catalogFilterOptions.categories)[number]) => void
  onToggleDifficulty: (value: (typeof catalogFilterOptions.difficulties)[number]) => void
  onToggleMechanism: (value: (typeof catalogFilterOptions.mechanisms)[number]) => void
  onToggleConfusion: (value: ConfusionType) => void
}

const confusionOptions = [...confusionTypeSchema.options]

export function FilterRail({
  filter,
  counts,
  onToggleCategory,
  onToggleDifficulty,
  onToggleMechanism,
  onToggleConfusion,
}: FilterRailProps) {
  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 p-4">
        <FilterSection
          title="Confusion"
          options={confusionOptions}
          labels={confusionLabels}
          active={filter.confusions}
          counts={counts.confusions}
          onToggle={onToggleConfusion}
        />

        <Separator />

        <FilterSection
          title="Category"
          options={catalogFilterOptions.categories}
          labels={categoryLabels}
          active={filter.categories}
          counts={counts.categories}
          onToggle={onToggleCategory}
        />

        <Separator />

        <FilterSection
          title="Difficulty"
          options={catalogFilterOptions.difficulties}
          labels={difficultyLabels}
          active={filter.difficulties}
          counts={counts.difficulties}
          onToggle={onToggleDifficulty}
          renderLabel={renderDifficultyLabel}
        />

        <Separator />

        <FilterSection
          title="Mechanism"
          options={catalogFilterOptions.mechanisms}
          labels={mechanismLabels}
          active={filter.mechanisms}
          counts={counts.mechanisms}
          onToggle={onToggleMechanism}
        />
      </div>
    </ScrollArea>
  )
}
