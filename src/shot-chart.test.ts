import { describe, expect, it } from "vitest";

import shotChartData from "./data-processed/hexes.json";
import { formatCoverageSummary, getChartCoverage } from "./shot-chart";

describe("shot-chart coverage", () => {
  it("keeps every out-of-frame attempt in the provenance total", () => {
    const coverage = getChartCoverage(shotChartData.hexes);
    const visibleAttempts = coverage.visible.reduce((total, hex) => total + hex.fga, 0);
    const visibleMakes = coverage.visible.reduce((total, hex) => total + hex.fgm, 0);

    expect(coverage.visible).toHaveLength(284);
    expect(coverage.outside).toHaveLength(9);
    expect(coverage.outsideAttempts).toBe(9);
    expect(coverage.outsideMakes).toBe(0);
    expect(visibleAttempts + coverage.outsideAttempts).toBe(shotChartData.metadata.attempts);
    expect(visibleMakes + coverage.outsideMakes).toBe(shotChartData.metadata.makes);
    expect(formatCoverageSummary(coverage, shotChartData.metadata.attempts)).toBe(
      "284 bins fit the fixed plotting frame. 9 long-range attempts across 9 bins sit outside it and remain included in the 937-attempt total.",
    );
  });
});
