# D3 NBA Hex Chart

## Purpose

This repository is a static React, D3, and TypeScript visualization backed by an immutable,
repository-owned NBA shot snapshot. React owns page state, `src/shot-chart.ts` owns SVG rendering
and inspection semantics, and `scripts/generate-hexes.mjs` owns deterministic data generation.

## Canonical commands

```sh
npm ci
npm run check
npm run audit:production
npm run audit:dependencies
```

`npm run check` verifies the source contract and generated artifact, runs the interaction and data
tests, type-checks the project, and builds the static Vite artifact.

## Data and rendering contract

- `data/nba-shot-chart-processed.csv` and `data/shot-source.json` are the source authority.
- `src/data-processed/hexes.json` is generated; change it only through `npm run data:generate`.
- Preserve exact attempt/make conservation, deterministic bin ordering, the 15-pixel bin radius,
  and the documented Ja Morant 2019-20 regular-season scope.
- D3 owns SVG children. React owns the surrounding document and the inspected-bin status message.
- Every shot hex must expose the same summary on pointer inspection and keyboard focus.
- Keep out-of-frame source attempts in provenance totals and the explicit coverage note; do not
  create invisible or off-canvas focus targets for them.
- Do not append children to SVG paths, disable a path after interaction, or log shot records during
  ordinary use.

## Dependency and release contract

- Node 22.12 is the minimum supported runtime; Node 24 is the current local and hosted line.
- Keep production-only and complete dependency audits separate. Both use the repository's strict
  low-severity threshold.
- Renovate may group compatible non-major updates. Every major requires Dependency Dashboard
  approval and still needs exact-head local and hosted validation before merge.
- A successful build or deploy preview does not prove production publication.

## Working rules

- Preserve the local source snapshot and third-party rights boundary in the README and license.
- Update README architecture, accessibility, dependency, and validation sections when their code
  contracts change.
- Stage only the intended paths; use an isolated worktree when the primary checkout is not clean.
