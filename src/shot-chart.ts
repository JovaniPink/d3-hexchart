import * as D3 from "d3";
import { hexbin } from "d3-hexbin";

export const CHART_WIDTH = 954;
export const CHART_HEIGHT = CHART_WIDTH / 1.422475106685633;
const HEX_RADIUS = 15;

export type ShotHex = {
  x: number;
  y: number;
  fga: number;
  fgm: number;
  pct: number;
  zone: string;
};

type ChartOptions = {
  svgElement: SVGSVGElement;
  hexes: readonly ShotHex[];
  onInspect: (hex: ShotHex) => void;
};

type SvgSelection = D3.Selection<SVGSVGElement, unknown, null, undefined>;

export type ChartCoverage = {
  visible: ShotHex[];
  outside: ShotHex[];
  outsideAttempts: number;
  outsideMakes: number;
};

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  count === 1 ? singular : plural;

export function formatShotSummary(hex: ShotHex) {
  const percentage = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
    style: "percent",
  }).format(hex.pct);

  return `${hex.fgm} ${pluralize(hex.fgm, "make")} on ${hex.fga} ${pluralize(
    hex.fga,
    "attempt",
  )} (${percentage}) from ${hex.zone}-point range`;
}

export function getChartCoverage(hexes: readonly ShotHex[]): ChartCoverage {
  const visible: ShotHex[] = [];
  const outside: ShotHex[] = [];

  for (const hex of hexes) {
    const collection =
      hex.x >= 0 && hex.x <= CHART_WIDTH && hex.y >= 0 && hex.y <= CHART_HEIGHT
        ? visible
        : outside;
    collection.push(hex);
  }

  return {
    visible,
    outside,
    outsideAttempts: outside.reduce((total, hex) => total + hex.fga, 0),
    outsideMakes: outside.reduce((total, hex) => total + hex.fgm, 0),
  };
}

export function formatCoverageSummary(coverage: ChartCoverage, totalAttempts: number) {
  const outsideAttempts = `${coverage.outsideAttempts} ${pluralize(
    coverage.outsideAttempts,
    "long-range attempt",
  )}`;
  const outsideBins = `${coverage.outside.length} ${pluralize(coverage.outside.length, "bin")}`;
  const outsideMakes =
    coverage.outsideMakes > 0
      ? `, including ${coverage.outsideMakes} ${pluralize(coverage.outsideMakes, "make")}`
      : "";

  return `${coverage.visible.length} bins fit the fixed plotting frame. ${outsideAttempts} across ${outsideBins} ${
    coverage.outside.length === 1 ? "sits" : "sit"
  } outside it and remain included in the ${totalAttempts}-attempt total${outsideMakes}.`;
}

function drawCourt(
  svg: SvgSelection,
  x: D3.ScaleLinear<number, number>,
  y: D3.ScaleLinear<number, number>,
) {
  svg
    .append("line")
    .attr("class", "court-outline baseline")
    .attr("x1", x(-250))
    .attr("y1", y(-47.5))
    .attr("x2", x(250))
    .attr("y2", y(-47.5));

  svg
    .append("circle")
    .attr("class", "court-outline hoop")
    .attr("cx", x(0))
    .attr("cy", y(0))
    .attr("r", (x(15) - x(0)) / 2);

  svg
    .append("line")
    .attr("class", "court-outline backboard")
    .attr("x1", x(30))
    .attr("x2", x(-30))
    .attr("y1", y(-8.5))
    .attr("y2", y(-8.5));

  const cornerTop = -47.5 + 140;
  for (const position of [-218, 218]) {
    svg
      .append("line")
      .attr("class", "court-outline three corner")
      .attr("x1", x(position))
      .attr("x2", x(position))
      .attr("y1", y(cornerTop))
      .attr("y2", y(-47.5));
  }

  const opposite = y(0) - y(cornerTop);
  const adjacent = x(0) - x(-218);
  const angle = Math.atan(opposite / adjacent);
  const radius = Math.hypot(opposite, adjacent);
  const threePointArc = D3.arc()({
    innerRadius: radius,
    outerRadius: radius,
    startAngle: -Math.PI / 2 + angle,
    endAngle: Math.PI / 2 - angle,
  });

  svg
    .append("path")
    .attr("d", threePointArc)
    .attr("class", "court-outline three arc")
    .attr("transform", `translate(${x(0)},${y(0)})`);
}

export function renderShotChart({ svgElement, hexes, onInspect }: ChartOptions) {
  const svg = D3.select(svgElement);
  svg.selectAll("*").remove();
  const { visible } = getChartCoverage(hexes);

  const x = D3.scaleLinear().domain([-250, 250]).range([0, CHART_WIDTH]);
  const y = D3.scaleLinear().domain([-47.5, 304]).range([CHART_HEIGHT, 0]);
  const maxAttempts = D3.max(hexes, (hex) => hex.fga) ?? 1;
  const size = D3.scaleSqrt()
    .domain([1, maxAttempts])
    .range([4, HEX_RADIUS - 1])
    .clamp(true);
  const path = hexbin<ShotHex>().radius(HEX_RADIUS);

  svg
    .attr("class", "court")
    .attr("width", CHART_WIDTH)
    .attr("height", CHART_HEIGHT)
    .attr("viewBox", `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  drawCourt(svg, x, y);

  svg
    .selectAll<SVGPathElement, ShotHex>("path.hexbin")
    .data(visible, (hex) => `${hex.x}:${hex.y}:${hex.zone}`)
    .join("path")
    .attr("class", "hexbin")
    .attr("role", "graphics-symbol")
    .attr("tabindex", 0)
    .attr("aria-controls", "shot-details")
    .attr("aria-label", formatShotSummary)
    .attr("d", (hex) => path.hexagon(size(hex.fga)))
    .attr("transform", (hex) => `translate(${hex.x},${hex.y})`)
    .attr("data-zone", (hex) => hex.zone)
    .on("pointerenter", (_event, hex) => onInspect(hex))
    .on("focus", (_event, hex) => onInspect(hex));

  return () => {
    svg.selectAll("*").remove();
  };
}
