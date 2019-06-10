// Find the intesection of each segment:
// pass the first and second array arr1, arr2
// and the upper index of the array where the
// two intersect e
function segmentIntersection(arr1, arr2, e) {
  var b = e - 1;
  var m1 = (arr1[e] - arr1[b]) / (e - b);
  var m2 = (arr2[e] - arr2[b]) / (e - b);
  var q1 = arr1[e] - m1 * e;
  var q2 = arr2[e] - m2 * e;
  var x = (q2 - q1) / (m1 - m2);
  return x;
}

// computes the element-wise array difference
// and returns the upper indices of the sign changes
function signChange(arr1, arr2) {
  var diff = [];
  var sign = [];
  for (var i = 0; i < arr1.length; i++) {
    diff.push(arr1[i] - arr2[i]);
    if (i > 0) {
      if (diff[i] * diff[i - 1] < 0) {
        sign.push(i);
      }
    }
  }

  return sign;
}

// computes all the X coordinates of the
// intersections of the arrays
function lineIntersection(arr1, arr2) {
  var sign = signChange(arr1, arr2);
  var intersections = [];
  for (var i = 0; i < arr1.length; i++) {
    if (arr1[i] - arr2[i] == 0.0) {
      intersections.push(i);
    }
  }

  for (i = 0; i < sign.length; i++) {
    intersections.push(segmentIntersection(arr1, arr2, sign[i]));
  }

  // Remove the x = 0 point in case it was one
  // of the intersection points: this is because
  // the gradient always starts at 0 and having 0
  // in the interception would create a redundant
  // gradeint stop point
  intersections = intersections.filter(function (d) {return d > 0;});

  return intersections;
}

function barColor(bH, colors) {
  if (bH > 0) {
    return colors[0];
  } else {
    return colors[1];
  }
}

function drawSvg(data1, data2) {
  var svgWidth = 1200;
  var svgHeight = 750;
  var svg = d3.select('body')
  .append('svg')
  .attr('id', 'main-svg')
  .attr('width', '100%')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);

  var datas = [data1, data2];
  var c = ['HotPink', 'gold'];
  var maxY = d3.max([d3.max(data1), d3.max(data2)]);
  var chartsDiff = 250;
  var marginLines = { top: 50, right: 50, bottom: chartsDiff, left: 50 };
  var widthLines = svgWidth - marginLines.left - marginLines.right;
  var heightLines = svgHeight - marginLines.top - marginLines.bottom;

  // X Scale
  var xScaleLines = d3.scaleLinear()
  .domain([-0.5, data1.length - 0.5])
  .range([0, widthLines]);

  // Y Scale
  var yScaleLines = d3.scaleLinear()
  .domain([0, maxY])
  .range([heightLines, 0]);

  // Line Generator
  var line = d3.line()
  .x(function (d, i) {return xScaleLines(i); }) // set the x values for the line generator
  .y(function (d) { return yScaleLines(d); }); // set the y values for the line generator

  // SVG dimensions
  var lines = d3.select('#main-svg')
    .append('g')
    .attr('id', 'svg-lines')
    .attr('transform', 'translate(' + marginLines.left + ',' + marginLines.top + ')');

  // Call the x axis in a group tag
  lines.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + heightLines + ')')
      .call(d3.axisBottom(xScaleLines).ticks(data1.length));

  // Call the y axis in a group tag
  lines.append('g')
  .attr('class', 'axis')
  .call(d3.axisLeft(yScaleLines));

  // reshape data array from (2, n)
  // to (n, 2)
  var dataLong = [];
  for (i = 0; i < datas[0].length; i++) {
    dataLong.push([]);
  }

  datas.forEach(function (d) {
    for (var i = 0; i < d.length; i++) {
      dataLong[i].push([d[i]]);
    }
  });

  // Area Generator
  var area = d3.area()
  .x(function (d, i) { return xScaleLines(i);})
  .y1(function (d) { return yScaleLines(d[1]);})
  .y0(function (d) { return yScaleLines(d[0]);});

  // Draw the area using the reshaped array.
  var drawarea = lines.append('path')
  .datum(dataLong)
  .attr('d', area) // Calls the area generator
  .attr('class', 'area');

  // enter the data to the svg
  var graph = lines.append('g')
  .selectAll('graph')
  .data(datas)
  .enter()
  .append('g')
  .attr('stroke', function (d, i) {return c[i];})
  .attr('class', 'line');

  // draw the lines
  graph.append('path')
  .attr('d', function (d) {return line(d);}); // Calls the line generator

  // Create a linear Gradient to assign different
  // colors to the areas based on the highest value
  var linearGradient = svg.append('defs')
  .append('linearGradient')
  .attr('id', 'linear-gradient');

  // Compute the intersections of the arrays
  var intersections = lineIntersection(data1, data2);

  // Transform the intersections values
  // to percentages to be used as stop points
  var offScale = d3.scaleLinear()
  .domain([0, data1.length - 1])
  .range([0, 100]);

  // Choose which color to start with
  // based on which curve starts with the
  // highest value hence is on top off the other.
  var lastColor = c[0];
  var nextColor = c[1];
  var temp;
  if (data1[0] < data2[0]) {
    lastColor = c[1];
    nextColor = c[0];
  } else if (data1[0] == data2[0]) {
    if (data1[0] < data2[0]) {
      lastColor = c[1];
      nextColor = c[0];
    }
  }

  // Always start the linear gradient from
  // the beginning of the chart
  linearGradient.append('stop')
  .attr('offset', '0%')
  .attr('stop-color', lastColor);

  // Insert two stops per intersection,
  // the first one where the last color stops,
  // the second one where the next color begins
  for (i = 0; i < intersections.length; i++) {
    var offset = offScale(intersections[i]) + '%';

    linearGradient.append('stop')
    .attr('offset', offset)
    .attr('stop-color', lastColor);

    linearGradient.append('stop')
    .attr('offset', offset)
    .attr('stop-color', nextColor);

    // siwtch the color to use next after each interception
    temp = lastColor;
    lastColor = nextColor;
    nextColor = temp;
  }

  linearGradient.append('stop')
  .attr('offset', '100%')
  .attr('stop-color', lastColor);
  var fromTop = svgHeight - chartsDiff + 50;
  var marginBars = { top: fromTop, right: 50, bottom: 50, left: 50 };
  var widthBars = svgWidth - marginBars.left - marginBars.right;
  var heightBars = svgHeight - marginBars.top - marginBars.bottom;
  var bars = d3.select('svg')
  .append('g')
  .attr('id', 'svg-bars')
  .attr('transform', 'translate(' + marginBars.left + ',' + marginBars.top + ')');

  // Get the bars height
  var bHeight = [];
  var bHeightAbs = [];
  for (var i = 0; i < data1.length; i++) {
    bHeightAbs.push(Math.abs(data1[i] - data2[i]));
    bHeight.push(data1[i] - data2[i]);
  }

  var bands = [];
  for (i = 0; i < data1.length; i++) {
    bands.push(i);
  }

  // X Scale
  var xScaleBars = d3.scaleBand()
  .domain(bands)
  .range([0, widthBars])
  .padding(0);

  // Compute the stroke-width
  var strokeWidth = xScaleBars.padding() * xScaleBars.bandwidth();

  // Y Scale
  var yScaleBars = d3.scaleLinear()
  .domain([0, d3.max(bHeightAbs)])
  .range([heightBars, 0]);

  // Call the x axis in a group tag
  bars.append('g')
  .attr('class', 'axis')
  .attr('transform', 'translate(0,' + heightBars + ')')
  .call(d3.axisBottom(xScaleBars));

  // Call the y axis in a group tag
  bars.append('g')
  .attr('class', 'axis')
  .call(d3.axisLeft(yScaleBars).ticks(3));

  // Draw the bars
  var bWidth = xScaleBars.bandwidth();
  bars.selectAll('rect')
  .data(bHeight)
  .enter()
  .append('rect')
  .attr('width', xScaleBars.bandwidth())
  .attr('height', function (d) { return heightBars - yScaleBars(Math.abs(d));})
  .attr('x', function (d, i) { return xScaleBars(i);})
  .attr('y', function (d) { return yScaleBars(Math.abs(d));})
  .attr('class', 'bars')
  .attr('fill', function (d) { return barColor(d, c);})
  .attr('stroke', function (d) { return barColor(d, c);})
  .attr('stroke-width', strokeWidth);
}

function main() {
  // generate random arrays
  var nPoints = Math.round(Math.random() * 25 + 25);
  var data1 = [];
  var data2 = [];
  for (var i = 0; i < nPoints; i++) {
    data1.push(Math.random() * 10);
    data2.push(Math.random() * 10);
  }

  drawSvg(data1, data2);
}

main();
