import { useEffect, useRef } from "react"
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
  const contextRef = useRef(context)
  contextRef.current = context

  useEffect(() => {
    const manager = getHotkeyManager()
    const handles = commands.flatMap((command) =>
      (command.shortcuts ?? []).map((shortcut) =>
        manager.register(
          shortcut,
          () => {
            const currentContext = contextRef.current

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
  }, [commands])
}
