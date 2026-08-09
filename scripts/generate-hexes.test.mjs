// @vitest-environment node

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  aggregateShots,
  buildDataset,
  generateDataset,
  parseShots,
  serializeDataset,
} from "./generate-hexes.mjs";

const rootUrl = new URL("../", import.meta.url);

async function readFixtures() {
  const [contractText, csvText] = await Promise.all([
    readFile(new URL("data/shot-source.json", rootUrl), "utf8"),
    readFile(new URL("data/nba-shot-chart-processed.csv", rootUrl), "utf8"),
  ]);
  return { contract: JSON.parse(contractText), csvText };
}

describe("shot-data generation", () => {
  it("validates the documented player, totals, and zones", async () => {
    const { contract, csvText } = await readFixtures();
    const shots = parseShots(csvText, contract);

    expect(shots).toHaveLength(937);
    expect(new Set(shots.map((shot) => shot.name))).toEqual(new Set(["Ja Morant"]));
    expect(new Set(shots.map((shot) => shot.zone))).toEqual(new Set(["2", "3"]));
    expect(shots.reduce((sum, shot) => sum + shot.make, 0)).toBe(447);
  });

  it("conserves attempts and makes across deterministic hex bins", async () => {
    const { contract, csvText } = await readFixtures();
    const shots = parseShots(csvText, contract);
    const forward = aggregateShots(shots);
    const reversed = aggregateShots([...shots].reverse());

    expect(forward).toEqual(reversed);
    expect(forward).toHaveLength(293);
    expect(forward.reduce((sum, bin) => sum + bin.fga, 0)).toBe(937);
    expect(forward.reduce((sum, bin) => sum + bin.fgm, 0)).toBe(447);
  });

  it("rejects rows outside the source contract", async () => {
    const { contract, csvText } = await readFixtures();
    const wrongPlayer = csvText.replace("Ja Morant", "Unknown Player");
    const wrongMake = csvText.replace(",1,2", ",2,2");

    expect(() => parseShots(wrongPlayer, contract)).toThrow("unexpected player");
    expect(() => parseShots(wrongMake, contract)).toThrow("invalid make value");
  });

  it("matches the checked-in generated artifact byte for byte", async () => {
    const committed = await readFile(
      new URL("src/data-processed/hexes.json", rootUrl),
      "utf8",
    );
    const generated = await generateDataset();

    expect(generated).toBe(committed);
  });

  it("serializes a stable metadata contract", async () => {
    const { contract, csvText } = await readFixtures();
    const dataset = buildDataset(csvText, contract);
    const serialized = serializeDataset(dataset);

    expect(dataset.metadata).toMatchObject({
      player: "Ja Morant",
      season: "2019-20",
      seasonType: "Regular Season",
      attempts: 937,
      makes: 447,
      generatedBy: "npm run data:generate",
    });
    expect(serialized.endsWith("\n")).toBe(true);
  });
});
