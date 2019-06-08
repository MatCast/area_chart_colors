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

function areaChart() {
  // generate random arrays
  var nPoints = Math.round(Math.random() * 10 + 10);
  var data1 = [];
  var data2 = [];
  for (var i = 0; i < nPoints; i++) {
    data1.push(Math.random() * 10);
    data2.push(Math.random() * 10);
  }

  var datas = [data1, data2];
  var c = ['red', 'blue'];
  var maxY = d3.max([d3.max(data1), d3.max(data2)]);

  var margin = { top: 50, right: 50, bottom: 50, left: 50 };
  var svgWidth = 800;
  var svgHeight = 400;
  var width = svgWidth - margin.left - margin.right;
  var height = svgHeight - margin.top - margin.bottom;

  // X Scale
  var xScale = d3.scaleLinear()
  .domain([0, data1.length - 1])
  .range([0, width]);

  // Y Scale
  var yScale = d3.scaleLinear()
  .domain([0, maxY])
  .range([height, 0]);

  // Line Generator
  var line = d3.line()
  .x(function (d, i) {return xScale(i); }) // set the x values for the line generator
  .y(function (d) { return yScale(d); }); // set the y values for the line generator

  // SVG dimensions
  var svg = d3.select('body')
    .append('svg')
    .attr('width', '100%')
    .attr('preserveAspectRatio', 'xMidYMid meet')
    .attr('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // Call the x axis in a group tag
  svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale).ticks(data1.length));

  // Call the y axis in a group tag
  svg.append('g')
  .attr('class', 'axis')
  .call(d3.axisLeft(yScale));

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
  .x(function (d, i) { return xScale(i);})
  .y1(function (d) { return yScale(d[1]);})
  .y0(function (d) { return yScale(d[0]);});

  // Draw the area using the reshaped array.
  var drawarea = svg.append('path')
  .datum(dataLong)
  .attr('d', area) // Calls the area generator
  .attr('class', 'area');

  // enter the data to the svg
  var graph = svg.append('g')
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
}

areaChart();
