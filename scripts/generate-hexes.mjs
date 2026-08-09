import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { csvParse, scaleLinear } from "d3";
import { hexbin } from "d3-hexbin";

const rootUrl = new URL("../", import.meta.url);
const sourceContractUrl = new URL("data/shot-source.json", rootUrl);
const sourceCsvUrl = new URL("data/nba-shot-chart-processed.csv", rootUrl);
const generatedDataUrl = new URL("src/data-processed/hexes.json", rootUrl);

export const CHART_WIDTH = 954;
export const CHART_HEIGHT = CHART_WIDTH / 1.422475106685633;
export const HEX_RADIUS = 15;

const round = (value, digits = 6) => Number(value.toFixed(digits));

export function parseShots(csvText, contract) {
  const parsed = csvParse(csvText);
  const requiredColumns = ["name", "x", "y", "make", "zone"];

  if (requiredColumns.some((column) => !parsed.columns.includes(column))) {
    throw new Error(`Shot CSV must include: ${requiredColumns.join(", ")}`);
  }

  const shots = parsed.map((row, index) => {
    const x = Number(row.x);
    const y = Number(row.y);
    const make = Number(row.make);

    if (row.name !== contract.player.name) {
      throw new Error(`Row ${index + 2} has unexpected player: ${row.name}`);
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error(`Row ${index + 2} has invalid coordinates`);
    }
    if (make !== 0 && make !== 1) {
      throw new Error(`Row ${index + 2} has invalid make value: ${row.make}`);
    }
    if (!contract.expected.zones.includes(row.zone)) {
      throw new Error(`Row ${index + 2} has invalid zone: ${row.zone}`);
    }

    return { name: row.name, x, y, make, zone: row.zone };
  });

  const makes = shots.reduce((sum, shot) => sum + shot.make, 0);
  const zones = [...new Set(shots.map((shot) => shot.zone))].sort();

  if (shots.length !== contract.expected.attempts) {
    throw new Error(
      `Expected ${contract.expected.attempts} attempts, received ${shots.length}`,
    );
  }
  if (makes !== contract.expected.makes) {
    throw new Error(`Expected ${contract.expected.makes} makes, received ${makes}`);
  }
  if (JSON.stringify(zones) !== JSON.stringify(contract.expected.zones)) {
    throw new Error(`Expected zones ${contract.expected.zones}, received ${zones}`);
  }

  return shots;
}

export function aggregateShots(shots) {
  const xScale = scaleLinear().domain([-250, 250]).range([0, CHART_WIDTH]);
  const yScale = scaleLinear().domain([-47.5, 304]).range([CHART_HEIGHT, 0]);
  const bins = hexbin()
    .x((shot) => xScale(shot.x))
    .y((shot) => yScale(shot.y))
    .radius(HEX_RADIUS)(shots);

  return bins
    .map((bin) => {
      const zones = [...new Set(bin.map((shot) => shot.zone))];
      if (zones.length !== 1) {
        throw new Error(`Hex at ${bin.x},${bin.y} mixes shot zones: ${zones}`);
      }

      const fga = bin.length;
      const fgm = bin.reduce((sum, shot) => sum + shot.make, 0);
      return {
        x: round(bin.x),
        y: round(bin.y),
        fga,
        fgm,
        pct: round(fgm / fga),
        zone: zones[0],
      };
    })
    .sort((left, right) =>
      left.y - right.y || left.x - right.x || left.zone.localeCompare(right.zone),
    );
}

export function buildDataset(csvText, contract) {
  const shots = parseShots(csvText, contract);
  const hexes = aggregateShots(shots);
  const attempts = hexes.reduce((sum, bin) => sum + bin.fga, 0);
  const makes = hexes.reduce((sum, bin) => sum + bin.fgm, 0);

  if (attempts !== shots.length || makes !== contract.expected.makes) {
    throw new Error(
      `Hex totals do not conserve input totals: ${attempts} FGA / ${makes} FGM`,
    );
  }

  return {
    metadata: {
      schemaVersion: contract.schemaVersion,
      player: contract.player.name,
      nbaPlayerId: contract.player.nbaPlayerId,
      season: contract.season,
      seasonType: contract.seasonType,
      metric: contract.metric,
      attempts,
      makes,
      fieldGoalPercentage: round(makes / attempts),
      zones: contract.expected.zones,
      source: contract.source,
      generatedBy: "npm run data:generate",
      hexRadius: HEX_RADIUS,
    },
    hexes,
  };
}

export const serializeDataset = (dataset) => `${JSON.stringify(dataset, null, 2)}\n`;

export async function generateDataset() {
  const [contractText, csvText] = await Promise.all([
    readFile(sourceContractUrl, "utf8"),
    readFile(sourceCsvUrl, "utf8"),
  ]);
  const contract = JSON.parse(contractText);
  return serializeDataset(buildDataset(csvText, contract));
}

async function main() {
  const generated = await generateDataset();
  if (process.argv.includes("--check")) {
    const committed = await readFile(generatedDataUrl, "utf8");
    if (committed !== generated) {
      throw new Error(
        "Generated shot data is stale. Run `npm run data:generate` and commit the result.",
      );
    }
    console.log("Shot-data provenance and generated artifact are current.");
    return;
  }

  await writeFile(generatedDataUrl, generated);
  console.log(`Wrote ${fileURLToPath(generatedDataUrl)}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
