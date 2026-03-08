import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

import App from "@/app/App"
import { ThemeProvider } from "@/app/providers/theme-provider"
import { createVerificationReport } from "@/domains/verification/types"
import { buildPlainCodePresentation } from "@/features/player/code-presentation"
import { lessonPlayerStore } from "@/features/player/store"

vi.mock("@/features/player/code", () => ({
  tokenizeCodeTemplate: async (template: Parameters<typeof buildPlainCodePresentation>[0]) =>
    buildPlainCodePresentation(template),
}))

async function renderApp() {
  await act(async () => {
    render(
      <ThemeProvider defaultTheme="dark" storageKey="greenfield-theme">
        <App />
      </ThemeProvider>
    )
    await Promise.resolve()
    await new Promise((resolve) => window.setTimeout(resolve, 0))
  })
}

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/")
    lessonPlayerStore.getState().initialize("binary-search")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
    lessonPlayerStore.getState().initialize("binary-search")
  })

  it("renders the lesson player toolbar", async () => {
    await renderApp()

    expect(await screen.findByRole("button", { name: /^play$/i })).toBeInTheDocument()
  })

  it("opens custom input through the dialog shell", async () => {
    await renderApp()

    fireEvent.click(screen.getByRole("button", { name: /custom input/i }))

    expect(screen.getByRole("dialog", { name: /custom input/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/custom input editor/i)).toBeInTheDocument()
  })

  it("renders the verification blocker through the dialog shell", async () => {
    await renderApp()

    await act(async () => {
      lessonPlayerStore.setState({
        verification: createVerificationReport([
          {
            code: "PEDAGOGY_BLOCK",
            kind: "pedagogical-integrity",
            severity: "error",
            message: "The active frame hides required state.",
            frameId: lessonPlayerStore.getState().frames[0]?.id,
            pedagogicalCheck: "hidden-state-loss",
          },
        ]),
        authorMode: false,
      })
    })

    expect(
      await screen.findByRole("dialog", { name: /verification blocked/i })
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /open author mode/i }))

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: /verification blocked/i })
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText("Execution Context", { exact: true })).toBeInTheDocument()
  })

  it("renders the primitive audit surface when requested by query param", async () => {
    window.history.replaceState({}, "", "/?audit=primitives")

    await renderApp()

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
