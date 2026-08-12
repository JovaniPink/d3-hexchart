import * as React from "react";

import "./App.css";
import shotChartData from "./data-processed/hexes.json";
import {
  formatCoverageSummary,
  formatShotSummary,
  getChartCoverage,
  renderShotChart,
  type ShotHex,
} from "./shot-chart";

function App() {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const [inspectedHex, setInspectedHex] = React.useState<ShotHex | null>(null);
  const { metadata, hexes } = shotChartData;
  const coverage = getChartCoverage(hexes);

  React.useEffect(() => {
    if (!svgRef.current) return;

    return renderShotChart({
      svgElement: svgRef.current,
      hexes,
      onInspect: setInspectedHex,
    });
  }, [hexes]);

  return (
    <>
      <header id="header">
        <h1 className="heading">NBA SHOT CHART</h1>
        <p className="about">... mapping out an NBA player&apos;s shot chart per season.</p>
        <ul className="details">
          <li>
            Player
            <br /> <strong>{metadata.player}</strong>
          </li>
          <li>
            Season
            <br /> <strong>{metadata.season}</strong>
          </li>
          <li>
            Season Type
            <br /> <strong>{metadata.seasonType}</strong>
          </li>
          <li>
            Field Goal Type
            <br /> <strong>{metadata.metric}</strong>
          </li>
        </ul>
        <p className="data-summary">
          {metadata.attempts} attempts, {metadata.makes} makes, and {hexes.length} deterministic hex
          bins. Source snapshot checked against <a href={metadata.source.url}>NBA Stats</a>.
        </p>
      </header>

      <div className="container">
        <svg
          ref={svgRef}
          role="graphics-document"
          aria-label={`${metadata.player} ${metadata.season} ${metadata.seasonType} shot chart`}
          aria-describedby="chart-coverage shot-details"
        />
        <p id="chart-coverage" className="coverage-note">
          {formatCoverageSummary(coverage, metadata.attempts)}
        </p>
        <p id="shot-details" className="shot-details" role="status" aria-atomic="true">
          {inspectedHex
            ? formatShotSummary(inspectedHex)
            : "Focus or point at a shot hex to inspect its makes, attempts, and percentage."}
        </p>
      </div>
    </>
  );
}

export default App;
