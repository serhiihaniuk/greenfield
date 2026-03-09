import {
  categoryLabels,
  confusionLabels,
  difficultyLabels,
  mechanismLabels,
  type CatalogEntry,
} from "@/domains/lessons/catalog"
import { Badge } from "@/shared/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card"
import { cn } from "@/shared/lib/utils"

function difficultyBadgeVariant(difficulty: CatalogEntry["difficulty"]) {
  switch (difficulty) {
    case "easy":
      return "success"
    case "hard":
      return "destructive"
    case "medium":
    default:
      return "secondary"
  }
}

type ProblemCardProps = {
  entry: CatalogEntry
  isActive: boolean
  onSelect: () => void
}

export function ProblemCard({ entry, isActive, onSelect }: ProblemCardProps) {
  return (
    <button type="button" onClick={onSelect} className="w-full text-left outline-none">
      <Card
        size="sm"
        className={cn(
          "w-full gap-2 ring-1 transition-colors",
          isActive ? "ring-primary/50" : "ring-foreground/10",
          !isActive && "hover:ring-foreground/20"
        )}
      >
        <CardHeader className="gap-2">
          <CardAction>
            {isActive ? <Badge variant="secondary">studying</Badge> : null}
          </CardAction>
          <CardTitle className="truncate pr-2">{entry.title}</CardTitle>
          <CardDescription className="line-clamp-2">{entry.summary}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">{categoryLabels[entry.category]}</Badge>
            <Badge variant={difficultyBadgeVariant(entry.difficulty)}>
              {difficultyLabels[entry.difficulty]}
            </Badge>
            {entry.mechanisms.map((mechanism) => (
              <Badge key={mechanism} variant="outline" className="text-muted-foreground">
                {mechanismLabels[mechanism]}
              </Badge>
            ))}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {confusionLabels[entry.confusionType]}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
