import { cn } from "@/shared/lib/utils"

type KbdProps = React.ComponentProps<"kbd"> & {
  keys?: readonly string[]
}

type KbdGroupProps = React.ComponentProps<"div"> & {
  shortcuts?: readonly (readonly string[])[]
}

function Kbd({ className, children, keys, ...props }: KbdProps) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 w-fit min-w-5 items-center justify-center gap-1 rounded-sm bg-muted px-1 font-sans text-xs font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10 [&_svg:not([class*='size-'])]:size-3",
        className
      )}
      {...props}
    >
      {keys?.join(" + ") ?? children}
    </kbd>
  )
}

function KbdGroup({
  className,
  children,
  shortcuts,
  ...props
}: KbdGroupProps) {
  return (
    <span
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    >
      {shortcuts
        ? shortcuts.map((shortcut, index) => (
            <span key={shortcut.join("-")} className="inline-flex items-center gap-1">
              {index > 0 ? (
                <span className="text-[10px] text-muted-foreground">/</span>
              ) : null}
              <Kbd keys={shortcut} />
            </span>
          ))
        : children}
    </span>
  )
}

export { Kbd, KbdGroup }
