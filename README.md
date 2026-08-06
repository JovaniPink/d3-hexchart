# D3.js NBA Hex Chart

An interactive NBA shot chart built with React, D3, TypeScript, and Vite. It
recreates the ideas explored in the Tableau
[NBA Chart Morant](https://public.tableau.com/profile/jovanipink#!/vizhome/NBA_16088323647060/NBAChartMorant)
visualization.

## Architecture and data

React owns the page lifecycle and SVG container. On mount, D3 draws the court
and binds the bundled, preprocessed records in
`src/data-processed/hexes.json` to the chart. `d3-hexbin` generates each hexagon
path, while the record's coordinates, shot zone, and field-goal-attempt count
control its position, color, and size.

The application does not fetch live NBA data. Updating the visualization's
dataset is an explicit source change to the bundled JSON and should be reviewed
and tested like application code.

Reference material:

- [NBA.com: Off the Charts](https://www.nba.com/stats/articles/off-the-charts/)
- [NBA.com shot-chart example](https://www.nba.com/stats/events/?flag=3&CFID=33&CFPARAMS=2019-20&PlayerID=1629630&TeamID=0&GameID=&ContextMeasure=FGA&Season=2019-20&SeasonType=Regular%20Season&LeagueID=00&PerMode=PerGame&Split=general&PlusMinus=N&PaceAdjust=N&Rank=N&Outcome=&Location=&Month=0&SeasonSegment=&OpponentTeamID=0&VsConference=&VsDivision=&GameSegment=&Period=0&LastNGames=0&DateFrom=&DateTo=&PORound=0&ShotClockRange=&MeasureType=Base&section=player&sct=plot)

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

Run the same local gates before committing or merging a dependency update:

```bash
npm test
npm run build
npm audit
```

`npm test` runs the Vitest suite once in a browser-like DOM environment.
`npm run build` type-checks the project and creates the optimized, content-hashed
static artifact in `dist`. Deployment is a separate operation; a successful
build does not by itself confirm that `dist` was published.
