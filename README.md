# D3.js NBA Hex Chart

An interactive NBA shot chart built with React, D3, TypeScript, and Vite. It
recreates the ideas explored in the Tableau
[NBA Chart Morant](https://public.tableau.com/profile/jovanipink#!/vizhome/NBA_16088323647060/NBAChartMorant)
visualization.

## Architecture and data contract

React owns the page lifecycle and SVG container. On mount, D3 draws the court
and binds the generated records in `src/data-processed/hexes.json` to the chart.
`d3-hexbin` generates each hexagon path, while the record's coordinates, shot
zone, and field-goal-attempt count control its position, color, and size.

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
npm run data:generate
npm run data:check
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

Use Node.js 22.12.0 or newer and npm 11.19.0 (the version declared in
`package.json`). Install the locked dependency graph before running the app:

```bash
npm ci
npm run dev
```

Vite serves the app at [http://localhost:5173](http://localhost:5173) and
reloads it when source files change.

## Validation and release

Run the same local gates before committing or merging any change:

```bash
npm run check
npm run audit:dependencies
```

`npm run check` verifies generated-data freshness, runs the Vitest UI and
preprocessing suites, type-checks the project, and creates the optimized,
content-hashed static artifact in `dist`. CI repeats that contract from
`npm ci`, then audits the complete locked dependency graph. Deployment is a
separate operation; a successful build does not by itself confirm that `dist`
was published.

## Accessibility and privacy

The SVG has an accessible chart label, and every generated hex is keyboard
focusable with its make/attempt/zone summary exposed to assistive technology.
The site has no analytics, account, form, cookie, or live-data request.

## License

Application source is provided under the repository's [MIT License](LICENSE).
NBA names, statistics, and linked source material remain subject to their
respective owners' terms; the MIT license does not relicense that data.
