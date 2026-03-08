import { render, screen } from "@testing-library/react"
import { afterEach, beforeEach } from "vitest"

import App from "@/app/App"

describe("App", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/")
  })

  afterEach(() => {
    window.history.replaceState({}, "", "/")
  })

  it("renders the lesson controls heading", () => {
    render(<App />)

    expect(
      screen.getByRole("heading", {
        name: /lesson controls/i,
      })
    ).toBeInTheDocument()
  })

  it("renders the primitive audit surface when requested by query param", () => {
    window.history.replaceState({}, "", "/?audit=primitives")

    render(<App />)

    expect(
      screen.getByRole("heading", {
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
