import type { RegisterableHotkey } from "@tanstack/hotkeys"

export type AppCommandScope = "global" | "player" | "audit" | "dialog"

export interface AppCommand<TContext> {
  id: string
  group: string
  title: string
  description?: string
  keywords?: string[]
  shortcuts?: readonly RegisterableHotkey[]
  shortcutHints?: readonly (readonly string[])[]
  scope?: AppCommandScope
  isEnabled?: (context: TContext) => boolean
  isVisible?: (context: TContext) => boolean
  run: (context: TContext) => void
}

export function isCommandVisible<TContext>(
  command: AppCommand<TContext>,
  context: TContext
) {
  return command.isVisible ? command.isVisible(context) : true
}

export function isCommandEnabled<TContext>(
  command: AppCommand<TContext>,
  context: TContext
) {
  return command.isEnabled ? command.isEnabled(context) : true
}
