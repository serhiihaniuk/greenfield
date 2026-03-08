# Bootstrap Specification

## Purpose

This document defines the exact bootstrap commands and immediate setup steps for the new app.

A fresh implementation chat should not guess how to initialize the project.

## Package Manager

Use `npm`.

## Project Initialization

Run the app bootstrap through the current `shadcn` CLI so the project starts as a Vite React TypeScript app with `shadcn/ui` configured.

For a fresh parent directory, create the app with:

```bash
npx shadcn@latest create --name lc-vis --template vite --base base --preset nova --yes
```

This produces the `base-nova` style in `components.json`.

If the workspace root already exists and is non-empty, the current CLI cannot scaffold directly into that folder.
For this workspace shape, scaffold in a temporary directory and sync the generated app files into the root:

```bash
tmpdir=$(mktemp -d)
cd "$tmpdir"
npx shadcn@latest create --name app --template vite --base base --preset nova --yes
rsync -a --exclude '.git' --exclude 'node_modules' --exclude 'README.md' "$tmpdir/app/" /path/to/workspace/
cd /path/to/workspace
npm install
```

If the workspace already has the Vite app scaffolded but `shadcn/ui` is not initialized yet, run:

```bash
npx shadcn@latest init --base base --preset nova --yes
```

## Expected Bootstrap Outputs

After bootstrap, the workspace should have at least:
- `package.json`
- `vite.config.ts`
- `index.html`
- `src/main.tsx`
- `components.json`
- global Tailwind CSS entrypoint
- working alias configuration compatible with `shadcn/ui`

## Required Follow-Up Installs

After bootstrap, install the core non-default dependencies:

```bash
npm install react-router zustand zod shiki d3-hierarchy motion lucide-react
npm install -D vitest @testing-library/react @testing-library/user-event jsdom playwright eslint prettier
```

If some dependencies already came from bootstrap, keep the installed versions rather than reinstalling unnecessarily.

## Required Post-Bootstrap Checks

1. Confirm `components.json` exists.
2. Confirm the project runs with `npm run dev`.
3. Confirm Tailwind is active.
4. Confirm `shadcn/ui` components can be added.
5. Confirm aliases resolve correctly.
6. Confirm the project uses the workspace root, not a nested app folder.

## Required Immediate Folder Setup

Create these top-level directories after bootstrap if they do not exist:

```txt
src/app
src/domains
src/entities
src/features
src/widgets
src/shared
content/lessons
docs
plans
```

## Bootstrap Acceptance Criteria

Bootstrap is complete only when:
- the app runs locally
- `shadcn/ui` is initialized
- `components.json` is valid
- aliases resolve
- the workspace structure matches the architecture docs
- the project is ready for contract-first implementation
