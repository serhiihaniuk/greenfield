import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

import App from "@/app/App"
import { ThemeProvider } from "@/app/providers/theme-provider"

function renderApp() {
  return render(
    <ThemeProvider defaultTheme="dark" storageKey="greenfield-theme">
      <App />
    </ThemeProvider>
  )
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
  })

  it("renders the lesson player toolbar", () => {
    renderApp()

    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument()
  })

  it("opens custom input through the dialog shell", () => {
    renderApp()

    fireEvent.click(screen.getByRole("button", { name: /custom input/i }))

    expect(screen.getByRole("dialog", { name: /custom input/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/custom input editor/i)).toBeInTheDocument()
  })

  it("renders the primitive audit surface when requested by query param", async () => {
    window.history.replaceState({}, "", "/?audit=primitives")

    renderApp()

    expect(
      await screen.findByRole("heading", {
        name: /primitive qa harness/i,
      })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /composition audit: search stage/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /composition audit: recursion stage/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("heading", { name: /single primitive scenarios/i })
    ).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { name: /memo table/i }).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("heading", { name: /execution tree/i }).length).toBeGreaterThan(0)
  })
})
