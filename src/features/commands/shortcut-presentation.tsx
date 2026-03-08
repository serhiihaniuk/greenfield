import type { ReactNode } from "react"

import type { AppCommand } from "@/features/commands/types"
import { cn } from "@/shared/lib/utils"
import { KbdGroup } from "@/shared/ui/kbd"

type CommandShortcutSource<TContext> = Pick<AppCommand<TContext>, "shortcutHints">

type CommandShortcutHintsProps<TContext> = {
  command?: CommandShortcutSource<TContext>
  shortcutHints?: readonly (readonly string[])[]
  className?: string
}

type CommandTooltipShortcutProps<TContext> = CommandShortcutHintsProps<TContext> & {
  children: ReactNode
  className?: string
}

export function CommandShortcutHints<TContext>({
  command,
  shortcutHints,
  className,
}: CommandShortcutHintsProps<TContext>) {
  const hints = shortcutHints ?? command?.shortcutHints

  if (!hints?.length) {
    return null
  }

  return <KbdGroup shortcuts={hints} className={className} />
}

export function CommandTooltipShortcut<TContext>({
  command,
  children,
  className,
}: CommandTooltipShortcutProps<TContext>) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span>{children}</span>
      <CommandShortcutHints command={command} />
    </span>
  )
}
