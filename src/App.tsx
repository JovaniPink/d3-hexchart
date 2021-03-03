import * as React from "react";
import "./App.css";
import zonehexdataflat from "./data-processed/hexes.json";
import * as D3 from "d3";
//https://github.com/d3/d3-hexbin
//https://github.com/d3/d3-hexbin/issues/16
import { hexbin as Hexbin } from "d3-hexbin";
//https://www.stackoverflow.com/questions/50384029/cannot-import-d3-tip-or-d3-hexbin-into-react-component
const d3 = {
  ...D3,
  hex: Hexbin,
};

function App() {
  const [appState, setAppState] = React.useState({
    loading: false,
    data: null,
  });
  const svgRef = React.useRef<SVGSVGElement>(null);

  // will be called initially and on every data change
  React.useEffect(() => {
    setAppState({ loading: true, data: null });
    const apiURL =
      "https://raw.githubusercontent.com/JovaniPink/d3-hexchart/main/data/nba-shot-chart-processed.csv";
    fetch(apiURL)
      .then((res) => res.json())
      .then((data) => {
        data.forEach((d: any) => {
          d.x = +d.x;
          d.y = +d.y;
          d.make = +d.make;
        });
        return setAppState({ loading: false, data: data });
      });

    const svg = D3.select(svgRef.current);

    const width = 954;
    const height = width / 1.422475106685633;
    const z = 20;
    const margin = 10;
    const x = D3.scaleLinear().domain([-250, 250]).range([0, width]);
    const y = D3.scaleLinear().domain([-47.5, 304]).range([height, 0]);
    const whratio =
      (x.domain()[1] - x.domain()[0]) / (y.domain()[1] - y.domain()[0]);
    const binRadius = 15;
    const size3 = D3.scaleSqrt().domain([1, 500]);
    const size2 = D3.scaleLog().domain([1, 1000]);
    const hexbin = d3
      .hex()
      .x(function (d: any) {
        return x(d.x);
      })
      .y(function (d: any) {
        return y(d.y);
      })
      .radius(binRadius);
    //const color = d3
    //  .scaleLinear()
    //  .domain([0.05, 0.8])
    //  .range(["steelblue", "brown"])
    //  .interpolate(d3.interpolateHcl)
    //  .clamp(true);

    svg.attr("class", "court").attr("width", width).attr("height", height);

    svg
      .selectAll("path.hexbin")
      .data(zonehexdataflat)
      .join((enter) =>
        enter
          .append("path")
          .attr("class", "hexbin")
          .attr("d", (d) =>
            hexbin.hexagon(
              d.zone == "3" ? size3(d.fga) * 11 : size2(d.fga) * 11
            )
          )
          .attr("transform", (d) => `translate(${d.x},${d.y})`)
          .style("opacity", 0.4)
          .style("fill", (d) => (d.zone == "3" ? "#db00ff" : "#0047ff"))
          .on("mouseenter", function (event, value) {
            const index = svg.selectAll(".hexbin").nodes().indexOf(this);
            console.log(event, index, Object.entries(value));
            d3.select(this)
              .style("pointer-events", "none")
              .transition()
              .duration(1000)
              .attr("transform", "translate(480,480)scale(23)rotate(180)")
              .call(() => {
                d3.select(this)
                  .append("text")
                  .text(index)
                  .attr("x", "477")
                  .attr("y", "200")
                  .attr("font-family", "sans-serif")
                  .attr("font-size", "20px")
                  .attr("fill", "black");
              })
              .transition()
              .delay(1500)
              .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
              .style("fill-opacity", 0.4);
          })
      );

    function drawCourt(svgEL: any) {
      svgEL
        .append("line")
        .attr("class", "court-outline baseline")
        .attr("x1", x(-250))
        .attr("y1", y(-15 / 2 - 40))
        .attr("x2", x(250))
        .attr("y2", y(-15 / 2 - 40));

      svgEL
        .append("circle")
        .attr("class", "court-outline hoop")
        .attr("cx", x(0))
        .attr("cy", y(0))
        .attr("r", (x(15) - x(0)) / 2);

      svgEL
        .append("line")
        .attr("class", "court-outline backboard")
        .attr("x1", x(30))
        .attr("x2", x(-30))
        .attr("y1", y(-8.5))
        .attr("y2", y(-8.5));

      svgEL
        .append("line")
        .attr("class", "court-outline three corner")
        .attr("x1", x(218))
        .attr("x2", x(218))
        .attr("y1", y(-15 / 2 - 40 + 140))
        .attr("y2", y(-15 / 2 - 40));

      svgEL
        .append("line")
        .attr("class", "court-outline three corner")
        .attr("x1", x(-218))
        .attr("x2", x(-218))
        .attr("y1", y(-15 / 2 - 40 + 140))
        .attr("y2", y(-15 / 2 - 40));

      const bSide = y(0) - y(-15 / 2 - 40 + 140);
      const aSide = x(0) - x(-218);
      const angle = Math.atan(bSide / aSide);
      const hypot = Math.sqrt(bSide * bSide + aSide * aSide);

      const tpArc = D3.arc()
        .innerRadius(hypot)
        .outerRadius(hypot)
        .startAngle(-Math.PI / 2 + angle)
        .endAngle(Math.PI / 2 - angle);

      svgEL
        .append("path")
        .attr("d", tpArc)
        .attr("class", "court-outline three arc")
        .attr("transform", (d: any) => `translate(${x(0)},${y(0)})`);

      //   // optional

      //   svgEL.append("rect")
      //     .attr('class', 'court-outline key')
      //     .attr('x', x(-80))
      //     .attr('y', y(-15/2 - 40 + 190))
      //     .attr('width', x(160) - x(0))
      //     .attr('height', y(0) - y(190))

      //   var ftArcTop = D3.arc()
      //     .innerRadius(x(60) - x(0))
      //     .outerRadius(x(60) - x(0))
      //     .startAngle(-Math.PI/2)
      //     .endAngle(Math.PI/2)

      //   svgEL.append('path')
      //     .attr('class', 'court-outline ftcircle top')
      //     .attr('d', ftArcTop)
      //     .attr("transform", d => `translate(${x(0)},${y(0-15/2-40+190)})`)

      //   var ftArcBottom = D3.arc()
      //     .innerRadius(x(60) - x(0))
      //     .outerRadius(x(60) - x(0))
      //     .startAngle(Math.PI/2)
      //     .endAngle(3*Math.PI/2)

      //   svgEL.append('path')
      //     .attr('class', 'court-outline ftcircle bottom')
      //     .attr('d', ftArcBottom)
      //     .attr('stroke-dasharray', '20')
      //     .attr("transform", d => `translate(${x(0)},${y(0-15/2-40+190)})`)

      //   var raArc = D3.arc()
      //     .innerRadius(x(40) - x(0))
      //     .outerRadius(x(40) - x(0))
      //     .startAngle(-Math.PI/2)
      //     .endAngle(Math.PI/2)

      //   svgEL.append('path')
      //     .attr('class', 'court-outline rarea')
      //     .attr('d', raArc)
      //     .attr("transform", d => `translate(${x(0)},${y(0)})`)
    }

    drawCourt(svg);
  }, [setAppState]);

  return (
    <>
      <header id="header">
        <h1 className="heading">NBA SHOT CHART</h1>
        <p className="about">
          ... mapping out NBA player's shot chart per season.
        </p>
        <ul className="details">
          <li className="">
            Ja
            <br /> <strong>Morant</strong>
          </li>
          <li className="">
            Season
            <br /> <strong>2019-20</strong>
          </li>
          <li className="">
            Season Type
            <br /> <strong>Regular Season</strong>
          </li>
          <li className="">
            Field Goal Type
            <br /> <strong>FGA</strong>
          </li>
        </ul>
        <div id="bar">
          <div className="button-row">
            <button className="button">Update Data</button>
            <button className="button-reset">Reset Data</button>
          </div>
          <div className="notify">
            <span>Get notified when I release new stuff!</span>
            <span>@JovaniPink</span>
          </div>
        </div>
      </header>

      <div className="container">
        <svg ref={svgRef}></svg>
      </div>

      <footer>Footer</footer>
    </>
  );
}

export default App;
