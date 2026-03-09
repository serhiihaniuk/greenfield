import { useEffect } from "react"
import { SearchIcon } from "lucide-react"

import { type CatalogEntry } from "@/domains/lessons/catalog"
import { CommandShortcutHints } from "@/features/commands/shortcut-presentation"
import { ProblemCard } from "@/features/problem-selector/problem-card"
import { FilterRail } from "@/features/problem-selector/filter-rail"
import { useCatalogFilter } from "@/features/problem-selector/use-catalog-filter"
import { Badge } from "@/shared/ui/badge"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogHeaderClose,
  DialogTitle,
} from "@/shared/ui/dialog"
import { Input } from "@/shared/ui/input"
import { ScrollArea } from "@/shared/ui/scroll-area"

type ProblemSelectorDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeLessonId?: string
  entries: CatalogEntry[]
  shortcutHints?: readonly (readonly string[])[]
  onSelectLesson: (slug: string) => void
}

export function ProblemSelectorDialog({
  open,
  onOpenChange,
  activeLessonId,
  entries,
  shortcutHints,
  onSelectLesson,
}: ProblemSelectorDialogProps) {
  const {
    filter,
    counts,
    results,
    setSearch,
    toggleCategory,
    toggleDifficulty,
    toggleMechanism,
    toggleConfusion,
    resetFilters,
  } = useCatalogFilter({
    entries,
    open,
    activeLessonId,
  })

  useEffect(() => {
    if (open) {
      // Must fire after base-ui Dialog's own focus management + animation (duration-100)
      const timer = setTimeout(() => {
        document
          .querySelector<HTMLInputElement>('[data-slot="dialog-content"] input')
          ?.focus()
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [open])

  const activeFilterCount =
    filter.categories.size +
    filter.difficulties.size +
    filter.mechanisms.size +
    filter.confusions.size +
    (filter.search.trim() ? 1 : 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[min(94vh,52rem)] flex-col overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={false}
      >
        <DialogHeader className="border-b border-border/30 px-5 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle>Choose a Problem</DialogTitle>
              <DialogDescription>
                Browse algorithm lessons by category, difficulty, mechanism, and confusion pattern.
              </DialogDescription>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              {shortcutHints?.length ? (
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Shortcut</span>
                  <CommandShortcutHints shortcutHints={shortcutHints} />
                </div>
              ) : null}
              <DialogHeaderClose srLabel="Close problem selector" />
            </div>
          </div>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] overflow-hidden md:grid-cols-[14rem_1fr] md:grid-rows-[1fr]">
          <div className="flex min-h-0 flex-1 flex-col md:col-start-2">
            <div className="flex flex-col gap-3 border-b border-border/30 px-5 py-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <SearchIcon className="size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search lessons..."
                    value={filter.search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="h-auto border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Badge variant="secondary">
                  {results.length} of {entries.length}
                </Badge>
                {activeFilterCount > 0 ? (
                  <Button size="sm" variant="outline" onClick={resetFilters}>
                    Clear all
                  </Button>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={filter.confusions.has("pointer-state") ? "secondary" : "outline"}
                  onClick={() => toggleConfusion("pointer-state")}
                >
                  Pointer Movement
                </Button>
                <Button
                  size="sm"
                  variant={filter.mechanisms.has("recursion") ? "secondary" : "outline"}
                  onClick={() => toggleMechanism("recursion")}
                >
                  Recursion
                </Button>
                <Button
                  size="sm"
                  variant={filter.mechanisms.has("memoization") ? "secondary" : "outline"}
                  onClick={() => toggleMechanism("memoization")}
                >
                  Memoization
                </Button>
                <Button
                  size="sm"
                  variant={filter.mechanisms.has("queue-bfs") ? "secondary" : "outline"}
                  onClick={() => toggleMechanism("queue-bfs")}
                >
                  Graph BFS
                </Button>
                <Button
                  size="sm"
                  variant={filter.mechanisms.has("sliding-window") ? "secondary" : "outline"}
                  onClick={() => toggleMechanism("sliding-window")}
                >
                  Sliding Window
                </Button>
              </div>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              {results.length > 0 ? (
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {results.map((entry) => (
                    <ProblemCard
                      key={entry.id}
                      entry={entry}
                      isActive={entry.id === activeLessonId}
                      onSelect={() => {
                        onSelectLesson(entry.slug)
                        onOpenChange(false)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    No lessons match these filters.
                  </p>
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            </ScrollArea>
          </div>

          <aside className="min-h-0 max-h-44 border-t border-border/30 md:col-start-1 md:row-start-1 md:max-h-none md:border-t-0 md:border-r">
            <FilterRail
              filter={filter}
              counts={counts}
              onToggleCategory={toggleCategory}
              onToggleDifficulty={toggleDifficulty}
              onToggleMechanism={toggleMechanism}
              onToggleConfusion={toggleConfusion}
            />
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
