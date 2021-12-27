let raw = {};

function loadData() {
  return d3.csv("assets/data/data.csv").then((d) => {
    raw = d;
  });
}

function preprocessData(data) {
  data = data.filter((d) => !isNaN(d.value));

  let result = data.reduce(function (r, d) {
    r[d.level_1] = r[d.level_1] || [];
    r[d.level_1].push({
      year: new Date(+d.year, 0, 1),
      value: +d.value,
    });
    return r;
  }, Object.create(null));

  return result;
}

function showData() {
  const rawData = raw;
  const groupedData = preprocessData(rawData);
  let config = getChartConfig();
  let scales = getChartScales(rawData, config);

  console.log({ rawData, groupedData });

  drawAxes(scales, config);
  drawTooltip(config);
  drawChart(groupedData, scales, config);
  drawLine(config, scales);
  drawLegend(scales, config);
}

function getChartConfig() {
  let canvasWidth = 1280,
    canvasHeight = 640;
  let margin = { top: 50, right: 90, bottom: 80, left: 75 };

  let width = canvasWidth - margin.left - margin.right - 100;
  let height = canvasHeight - margin.top - margin.bottom - 100;

  let svg = d3.select("#canvas");
  svg.attr("width", canvasWidth);
  svg.attr("height", canvasHeight);

  return { canvasWidth, canvasHeight, margin, height, width, svg };
}

function getChartScales(data, config) {
  let { width, height } = config;
  let yearStart = d3.min(data, (d) => +d.year);
  let yearEnd = d3.max(data, (d) => +d.year);
  let maxAttendance = d3.max(data, (d) => +d.value);

  let xScale = d3
    .scaleTime()
    .range([0, width])
    .domain([new Date(yearStart - 3, 0, 1), new Date(yearEnd + 3, 0, 1)]);

  let yScale = d3
    .scaleLinear()
    .range([height, 0])
    .domain([-1000000, maxAttendance])
    .nice();

  let cScale = d3.scaleOrdinal(d3.schemeCategory10);

  return { xScale, yScale, cScale };
}

function drawChart(groupedData, scales, config) {
  let { margin, svg } = config;
  let { xScale, yScale, cScale } = scales;

  const lineGen = d3
    .line()
    .x(function (d) {
      return xScale(d.year);
    })
    .y(function (d) {
      return yScale(+d.value);
    })
    .defined((d) => !isNaN(d.value));

  for (const sector in groupedData) {
    id = sector.toLowerCase().replaceAll(" ", "-");

    svg
      .append("path")
      .style("transform", `translate(${margin.left}px,${margin.top}px)`)
      .datum(groupedData[sector])
      .attr("id", id)
      .attr("fill", "none")
      .attr("stroke", cScale(sector))
      .attr("stroke-width", 1.5)
      .attr("d", lineGen);

    svg
      .selectAll("points")
      .data(groupedData[sector])
      .enter()
      .append("circle")
      .style("transform", `translate(${margin.left}px,${margin.top}px)`)
      .attr("fill", cScale(sector))
      .attr("stroke", "none")
      .attr("cx", function (d) {
        return xScale(d.year);
      })
      .attr("cy", function (d) {
        return yScale(+d.value);
      })
      .attr("r", 3)
      .on("mouseover", function (d, i) {
        this.style.fill = "white";
        this.style.stroke = "black";
        let x = d3.select(this).attr("cx");
        let y = d3.select(this).attr("cy");
        d3.select(".tooltip")
          .style("opacity", 1)
          .html(
            new Date(d.target.__data__.year).getFullYear() +
              "<br/>" +
              sector +
              "<br/>" +
              d.target.__data__.value
          )
          .style("left", x + "px")
          .style("top", y + "px");
        d3.select(".dropline")
          .style("opacity", 1)
          .attr("x", x + "px");
      })
      .on("mousemove", function (d, i) {
        let x = d3.select(this).attr("cx");
        let y = d3.select(this).attr("cy");
        console.log(d);
        d3.select(".tooltip")
          .style("opacity", 1)
          .html(
            new Date(d.target.__data__.year).getFullYear() +
              "<br/>" +
              sector +
              "<br/>" +
              d.target.__data__.value
          )
          .style("left", x - 50 + "px")
          .style("top", y - 50 + "px");

        d3.select(".dropline")
          .style("opacity", 1)
          .attr("x", x + "px");

        console.log(sector);
      })
      .on("mouseleave", function () {
        this.style.fill = cScale(sector);
        this.style.stroke = "transparent";
        d3.select(".tooltip").style("opacity", 0);
      });
  }
}

function drawAxes(scales, config) {
  let { xScale, yScale } = scales;
  let { svg, margin, canvasHeight, canvasWidth, width, height } = config;

  let axisX = d3.axisBottom(xScale).ticks(8);

  let axisY = d3.axisLeft(yScale).ticks(8).tickFormat(d3.format(".1s"));

  let axisGridY = d3.axisLeft(yScale).ticks(8).tickFormat("").tickSize(-width);

  svg
    .append("g")
    .attr("class", "multlinechart")
    .on("mousover", function (d) {
      console.log("mouse on chart");
    });

  svg
    .append("g")
    .attr("id", "y-axis-grid")
    .style("transform", `translate(${margin.left}px,${margin.top}px)`)
    .call(axisGridY);

  svg
    .append("g")
    .attr("id", "x-axis")
    .style(
      "transform",
      `translate(${margin.left}px,${canvasHeight - margin.bottom - 100}px)`
    )
    .call(axisX);

  svg
    .append("text")
    .attr("id", "x-axis-label")
    .style(
      "transform",
      `translate(${width * 0.5 + margin.left}px,${height + margin.top + 40}px)`
    )
    .style("text-anchor", "middle")
    .text("YEAR");

  svg
    .append("g")
    .attr("id", "y-axis")
    .style("transform", `translate(${margin.left}px,${margin.top}px)`)
    .call(axisY);

  svg
    .append("text")
    .attr("id", "y-axis-label")
    .style("text-anchor", "middle")
    .style(
      "transform",
      `translate(${margin.left - 40}px,${canvasHeight * 0.5}px) rotate(-90deg)`
    )
    .text("PATIENTS ADMITTED");
}

function drawLegend(scales, config) {
  let { cScale } = scales;
  let { svg, width, canvasHeight, margin } = config;

  let legendarea = svg.append("g").attr("class", "legend-divs");

  let legend = legendarea
    .selectAll(".legend")
    .data(cScale.domain())
    .enter()
    .append("g")
    .attr("class", "legend")
    .attr("x", canvasHeight - margin.bottom)
    .attr("transform", function (d, i) {
      return "translate(0," + (480 + i * 20) + ")";
    });

  legend
    .append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .attr("rx", 20)
    .style("fill", cScale)
    .attr("opacity", 1);

  legend
    .append("text")
    .attr("x", width - 24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .attr("opacity", 1)
    .style("text-anchor", "end")
    .text(function (d) {
      return d;
    });
}

function drawTooltip() {
  let tooltip = d3
    .select("#visual-chart")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px")
    .style("position", "absolute")
    .text("this is the default tooltip");
}

function drawLine(config) {
  let { svg, margin } = config;

  let line = svg
    .append("g")
    .append("rect")
    .attr("class", "dropline")
    .attr("stroke-width", "1px")
    .attr("width", "1px")
    .attr("fill", "red")
    .style("transform", `translate(${margin.left}px,${margin.top}px)`)
    .attr("height", 410)
    .style("opacity", 0);
}
