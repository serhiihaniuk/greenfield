import { useTheme } from "@/app/providers/theme-provider"

function getSystemTheme(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

/*
 * Animated sun/moon toggle.
 *
 * The ThemeProvider's `disableTransitionOnChange` injects a global
 * `transition: none !important` when themes flip, which kills CSS transitions.
 * We use `@keyframes` animations instead — they're immune to that override.
 */

const STYLES = `
/* ─── Keyframes: Sun elements ─── */
@keyframes sun-core-in {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}
@keyframes sun-core-out {
  from { transform: scale(1); }
  to   { transform: scale(0); }
}
@keyframes sun-rays-in {
  from { transform: scale(0) rotate(45deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes sun-rays-out {
  from { transform: scale(1) rotate(0deg); opacity: 1; }
  to   { transform: scale(0) rotate(45deg); opacity: 0; }
}

/* ─── Keyframes: Moon elements ─── */
@keyframes moon-in {
  from { transform: scale(0) rotate(-60deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes moon-out {
  from { transform: scale(1) rotate(0deg); opacity: 1; }
  to   { transform: scale(0) rotate(-60deg); opacity: 0; }
}
@keyframes star-in {
  from { transform: scale(0) rotate(-45deg); opacity: 0; }
  to   { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes star-out {
  from { transform: scale(1) rotate(0deg); opacity: 1; }
  to   { transform: scale(0) rotate(-45deg); opacity: 0; }
}

/* ─── Shared ─── */
.tt-svg .sun-core,
.tt-svg .sun-rays-1,
.tt-svg .sun-rays-2,
.tt-svg .moon-base,
.tt-svg .star-1,
.tt-svg .star-2 {
  will-change: transform, opacity;
  animation-fill-mode: both;
}
.tt-svg .sun-core  { transform-origin: 12px 12px; }
.tt-svg .sun-rays-1 { transform-origin: 12px 12px; }
.tt-svg .sun-rays-2 { transform-origin: 12px 12px; }
.tt-svg .moon-base { transform-origin: 12px 12px; }
.tt-svg .star-1    { transform-origin: 17.5px 5px; }
.tt-svg .star-2    { transform-origin: 21px 10.5px; }

/* ─── Light state: sun pops IN, moon collapses OUT ─── */
.tt-svg:not([data-dark]) .sun-core   { animation: sun-core-in 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both; }
.tt-svg:not([data-dark]) .sun-rays-1 { animation: sun-rays-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s both; }
.tt-svg:not([data-dark]) .sun-rays-2 { animation: sun-rays-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.35s both; }
.tt-svg:not([data-dark]) .moon-base  { animation: moon-out 0.3s cubic-bezier(0.4,0,0.2,1) 0.1s both; }
.tt-svg:not([data-dark]) .star-1     { animation: star-out 0.3s cubic-bezier(0.4,0,0.2,1) 0.05s both; }
.tt-svg:not([data-dark]) .star-2     { animation: star-out 0.3s cubic-bezier(0.4,0,0.2,1) 0s both; }

/* ─── Dark state: moon bounces IN, sun collapses OUT ─── */
.tt-svg[data-dark] .sun-core   { animation: sun-core-out 0.3s cubic-bezier(0.4,0,0.2,1) 0.1s both; }
.tt-svg[data-dark] .sun-rays-1 { animation: sun-rays-out 0.3s cubic-bezier(0.4,0,0.2,1) 0s both; }
.tt-svg[data-dark] .sun-rays-2 { animation: sun-rays-out 0.3s cubic-bezier(0.4,0,0.2,1) 0.05s both; }
.tt-svg[data-dark] .moon-base  { animation: moon-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.25s both; }
.tt-svg[data-dark] .star-1     { animation: star-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.4s both; }
.tt-svg[data-dark] .star-2     { animation: star-in 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.5s both; }
`

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const resolved = theme === "system" ? getSystemTheme() : theme
  const isDark = resolved === "dark"

  const toggle = () => setTheme(isDark ? "light" : "dark")

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={className}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        className="tt-svg"
        data-dark={isDark ? "" : undefined}
      >
        <style>{STYLES}</style>

        {/* Sun */}
        <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none">
          <circle cx="12" cy="12" r="4" className="sun-core" />
          <g className="sun-rays-1">
            <line x1="12" y1="3" x2="12" y2="5" />
            <line x1="12" y1="21" x2="12" y2="19" />
            <line x1="3" y1="12" x2="5" y2="12" />
            <line x1="21" y1="12" x2="19" y2="12" />
          </g>
          <g className="sun-rays-2">
            <line x1="7.05" y1="7.05" x2="5.64" y2="5.64" />
            <line x1="16.95" y1="16.95" x2="18.36" y2="18.36" />
            <line x1="16.95" y1="7.05" x2="18.36" y2="5.64" />
            <line x1="7.05" y1="16.95" x2="5.64" y2="18.36" />
          </g>
        </g>

        {/* Moon & Stars */}
        <g stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round">
          <path
            d="M20.354 15.354A9 9 0 0 1 8.646 3.646 9.003 9.003 0 0 0 12 21a9.003 9.003 0 0 0 8.354-5.646z"
            fill="none"
            className="moon-base"
          />
          <path
            d="M17.5 3c0 1.5.5 2 2 2-1.5 0-2 .5-2 2 0-1.5-.5-2-2-2 1.5 0 2-.5 2-2z"
            fill="currentColor"
            stroke="none"
            className="star-1"
          />
          <path
            d="M21 9.5c0 .8.2 1 1 1-.8 0-1 .2-1 1 0-.8-.2-1-1-1 .8 0 1-.2 1-1z"
            fill="currentColor"
            stroke="none"
            className="star-2"
          />
        </g>
      </svg>
    </button>
  )
}
