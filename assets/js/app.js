let raw = {}

function loadData() {
    return d3.csv("assets/data/data.csv").then(d => {
        raw = d;
    });
}

function preprocessData(data) {
    data = data.filter(d => !isNaN(d.value));

    let result = data.reduce(function (r, d) {
        r[d.level_1] = r[d.level_1] || [];
        r[d.level_1].push({
            "year": new Date(+d.year, 0, 1),
            "value": +d.value
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

    console.log({rawData, groupedData});

    drawChart(groupedData, scales, config);
    drawAxes(scales, config);
    //drawLegend(scales, config);
}

function getChartConfig() {
    let canvasWidth = 1280, canvasHeight = 640;
    let margin = { top: 50, right: 90, bottom: 80, left: 25 };

    let width = canvasWidth - margin.left - margin.right;
    let height = canvasHeight - margin.top - margin.bottom;

    let svg = d3.select("#canvas");
    svg.attr("width", canvasWidth)
    svg.attr("height", canvasHeight)

    return { canvasWidth, canvasHeight, margin, height, width, svg }
}

function getChartScales(data, config) {
    let { width, height } = config;
    let yearStart = d3.min(data, d => +d.year);
    let yearEnd = d3.max(data, d => +d.year);
    let maxAttendance = d3.max(data, d => +d.value);

    let xScale = d3.scaleTime()
        .range([0, width])
        .domain([new Date(yearStart - 3, 0, 1), new Date(yearEnd + 3, 0, 1)]);

    let yScale = d3.scaleLinear()
        .range([height, 0])
        .domain([-1000000, maxAttendance])
        .nice();

    let cScale = d3.scaleOrdinal(d3.schemeCategory10)
        
    return { xScale, yScale, cScale }
}

function drawChart(groupedData, scales, config) {
    let {margin, svg} = config;
    let {xScale, yScale, cScale} = scales;

    const lineGen = d3.line()
        .x(function(d) { return xScale(d.year) })
        .y(function(d) { return yScale(+d.value) })
        .defined(d => !isNaN(d.value));
  
    for (const sector in groupedData) {
        id = sector
            .toLowerCase()
            .replaceAll(" ", "-");

        svg.append("path")
            .style("transform", `translate(${margin.left}px,${margin.top}px)`)
            .datum(groupedData[sector])
            .attr("id", id)
            .attr("fill", "none")
            .attr("stroke", cScale(sector))
            .attr("stroke-width", 1.5)
            .attr("d", lineGen);

        svg.selectAll("points")
        .data(groupedData[sector])
        .enter()
        .append("circle")
            .style("transform", `translate(${margin.left}px,${margin.top}px)`)
            .attr("fill", cScale(sector))
            .attr("stroke", "none")
            .attr("cx", function(d) { return xScale(d.year) })
            .attr("cy", function(d) { return yScale(+d.value ) })
            .attr("r", 3)
    }
}

function drawAxes(scales, config){
    let {xScale, yScale} = scales
    let {svg, margin, canvasHeight} = config;
    
    let axisX = d3.axisBottom(xScale)
                  .ticks(8)
  
    svg.append("g")
        .attr("id", "x-axis")
        .style("transform", 
            `translate(${margin.left}px,${canvasHeight - margin.bottom}px)`
        )
        .call(axisX)
  
    let formatValue = d3.format(".1s");
    let axisY = d3.axisLeft(yScale)
        .ticks(8)
        .tickFormat(formatValue);

    svg.append("g")
        .attr("id", "y-axis")
        .style("transform", 
            `translate(${margin.left}px,${margin.top}px)`
        )
        .call(axisY)
}

function drawLegend(scales, config) {
    let { cScale } = scales;
    let { svg, width } = config;

    let legend = svg.selectAll(".legend")
        .data(cScale.domain())
        .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .attr("rx", 20)
        .style("fill", cScale);

    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });

}