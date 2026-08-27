# D3.js NBA Hex Chart

An interactive NBA shot chart built with React, D3, TypeScript, and Vite. It
recreates the ideas explored in the Tableau
[NBA Chart Morant](https://public.tableau.com/profile/jovanipink#!/vizhome/NBA_16088323647060/NBAChartMorant)
visualization.

## Architecture and data contract

React owns page state and the inspected-bin status message. The rendering module
in `src/shot-chart.ts` owns the SVG lifecycle: D3 draws the court and binds the
generated records in `src/data-processed/hexes.json` to the chart. `d3-hexbin`
generates each atomic hexagon path, while the record's coordinates, shot zone,
and field-goal-attempt count control its position, color, and size. The chart
uses a fixed coordinate system inside a responsive SVG view box, so resizing the
page does not reinterpret the source data. Bins outside that fixed plotting
frame remain in provenance totals and are reported in a coverage note instead
of becoming invisible or off-canvas focus targets.

The application does not fetch live NBA data. Its repository authority is the
937-row snapshot in `data/nba-shot-chart-processed.csv`, paired with the
machine-readable contract in `data/shot-source.json`. The original commit linked
the NBA Stats shot chart for Ja Morant (player 1629630), the 2019-20 regular
season, and field-goal attempts. NBA Stats reports the same 447 makes and 937
attempts, which binds the snapshot totals to that player-season scope. The
snapshot does not retain game IDs or the original download response, so it must
not be represented as a fresh or independently re-downloadable NBA API export.

Generate the visualization artifact only through the checked-in pipeline:

```bash
corepack npm run data:generate
corepack npm run data:check
```

The generator validates the player name, allowed two-/three-point zones, input
totals, and make flags. It uses a pinned 15-pixel hex radius, rejects mixed-zone
bins, sorts output deterministically, and asserts that output attempts and makes
exactly conserve the input. `data:check` fails if the committed JSON differs by
even one byte from a fresh generation. The generated metadata drives the visible
player, season, season type, metric, and totals, so UI copy cannot silently drift
from the data contract.

Reference material:

- [NBA.com: Off the Charts](https://www.nba.com/stats/articles/off-the-charts/)
- [NBA Stats: Ja Morant 2019-20 shooting totals](https://www.nba.com/stats/player/1629630/shooting?Season=2019-20&SeasonType=Regular%20Season)

## Local development

Use Node.js 22.22.2 or later in the Node 22 line, or Node 24.15.0 or later in the
Node 24 line. Node 24.19.0 is the exact local and hosted line in `.nvmrc`, and npm
11.19.1 is pinned by `package.json`. Corepack selects that exact npm release.
Install the locked dependency graph before running the app:

```bash
corepack npm ci
corepack npm run dev
```

Vite serves the app at [http://localhost:5173](http://localhost:5173) and
reloads it when source files change.

## Validation and release

Run the same local gates before committing or merging any change:

```bash
corepack npm run check
corepack npm run audit:production
corepack npm run audit:dependencies
corepack npm run audit:signatures
```

`npm run check` first verifies the package-manager and install-script policy,
then verifies generated-data freshness, runs the Vitest UI and preprocessing
suites, type-checks the project, and creates the optimized, content-hashed
static artifact in `dist`. CI repeats that contract from a strict locked install
on Node 22.22.2 and Node 24.19.0. The production audit covers only code shipped
to the browser; the complete vulnerability audit also covers development and
build tooling. Both use the low-severity threshold. The
[`audit signatures`](https://docs.npmjs.com/cli/v11/commands/npm-audit/#audit-signatures)
gate separately verifies npm registry signatures for the locked graph; it does
not claim that an upstream package is safe or independently trustworthy.
Deployment is a separate operation; a successful build does not by itself
confirm that `dist` was published.

## Dependency update policy

Renovate groups compatible non-major updates. Every major update—including the
npm 12 runtime/tooling line—requires explicit Dependency Dashboard approval.
Approval may open a compatibility PR; it does not authorize a merge. Each exact
head must still pass the locked install, data contract, tests, build, both audit
scopes, and hosted Node matrix without force or legacy-peer resolution.

Dependency lifecycle scripts do not run unless an exact version is approved in
`allowScripts`; known unnecessary hooks are denied by package name. Vite's
optional macOS file watcher, [`fsevents`](https://github.com/fsevents/fsevents),
is explicitly denied lifecycle execution: the locked 2.3.3 tarball already
supplies its native binary and contains no install hook. The downloaded tarball
matched the lockfile's SHA-512 integrity and SHA-1 shasum, and its source tag
resolves to the verified upstream release commit. npm's
[`strict-allow-scripts`](https://docs.npmjs.com/cli/v11/using-npm/config/#strict-allow-scripts)
setting makes any unreviewed hook a hard install failure. `.npmrc` also rejects
unsupported Node runtimes, while `package:check` keeps every decision
synchronized with the lockfile and rejects policy bypasses during the gate.

## Accessibility and privacy

The SVG is a `graphics-document`, and every generated hex is an atomic
`graphics-symbol` with a make/attempt/percentage label. The nine long-range
attempts outside the plotting frame remain in the 937-attempt total and are
reported separately. Pointer inspection and keyboard focus update the same
visible polite status region; focus never moves to the status message. This
follows the W3C
[Graphics ARIA](https://www.w3.org/TR/graphics-aria-1.0/) role model and
[`role=status`](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22) guidance.
The responsive SVG preserves keyboard focus and chart coordinates at narrow
viewports. The site has no analytics, account, form, cookie, or live-data
request.

## License

Application source is provided under the repository's [MIT License](LICENSE).
NBA names, statistics, and linked source material remain subject to their
respective owners' terms; the MIT license does not relicense that data.
