import { useEffect } from "react"
import { getHotkeyManager } from "@tanstack/hotkeys"

import {
  isCommandEnabled,
  isCommandVisible,
  type AppCommand,
} from "@/features/commands/types"

export function useCommandHotkeys<TContext>(
  commands: readonly AppCommand<TContext>[],
  context: TContext
) {
  useEffect(() => {
    const manager = getHotkeyManager()
    const handles = commands.flatMap((command) =>
      (command.shortcuts ?? []).map((shortcut) =>
        manager.register(
          shortcut,
          () => {
            const currentContext = context

            if (!isCommandVisible(command, currentContext)) {
              return
            }

            if (!isCommandEnabled(command, currentContext)) {
              return
            }

            command.run(currentContext)
          },
          {
            enabled: true,
            ignoreInputs: true,
            preventDefault: true,
            stopPropagation: true,
          }
        )
      )
    )

    return () => {
      for (const handle of handles) {
        handle.unregister()
      }
    }
  }, [commands, context])
}
