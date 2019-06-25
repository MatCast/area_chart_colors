// SVG properties
function svgChart() {
  this.svgWidth = 1200;
  this.svgHeight = 750;
  // Height of the bottom chart: bottom margin of the top chart
  this.chartsDiff = 250;
  //  Top chart margins and inner measures
  this.marginLines = { top: 50, right: 50, bottom: this.chartsDiff, left: 50 };
  this.widthLines = this.svgWidth - this.marginLines.left - this.marginLines.right;
  this.heightLines = this.svgHeight - this.marginLines.top - this.marginLines.bottom;

  // Bottom chart margins and inner measures
  this.fromTop = this.svgHeight - this.chartsDiff + 50;
  this.marginBars = { top: this.fromTop, right: 50, bottom: 50, left: 50 };
  this.widthBars = this.svgWidth - this.marginBars.left - this.marginBars.right;
  this.heightBars = this.svgHeight - this.marginBars.top - this.marginBars.bottom;


  // Dimensions and aspect ratio of the SVG
  this.svg = d3.select('body')
  .append('svg')
  .attr('id', 'main-svg')
  .attr('width', '100%')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .attr('viewBox', '0 0 ' + this.svgWidth + ' ' + this.svgHeight),

  this.drawCurves = () =>
    d3.csv('./distances.csv').then((data) => {
      this.names = [];
      this.colors = ['HotPink', 'gold', 'DodgerBlue', 'BlueViolet'];
      data.forEach((d) => {
        for (var key in d) {
          if (d.hasOwnProperty(key)) {
            d[key] = +d[key];
            if (key != 'distance' && ! this.names.includes(key)){
              this.names.push(key);
            }
          }
        }
      });

      // var datas = [data1, data2];
      // var c = ['HotPink', 'gold'];
      var maxPerName = [];
      this.names.forEach(function (name) {
        maxPerName.push(d3.max(data, function(d){
          return d[name];})
        );
      });
      this.maxY = d3.max(maxPerName);

      // X Scale
      this.xScaleLines = d3.scaleLinear()
      .domain([-0.5, data.length - 0.5])
      .range([0, this.widthLines]);

      // Y Scale
      this.yScaleLines = d3.scaleLinear()
      .domain([0, this.maxY])
      .range([this.heightLines, 0]);

      namesAvg(data).forEach((d,i) => {
        data[i].average = d;
      });
      this.names.push('average');
      this.colors.push('orange');

      // Curves Group and translation
      var lines = d3.select('#main-svg')
        .append('g')
        .attr('id', 'svg-lines')
        .attr('transform', 'translate(' + this.marginLines.left + ',' + this.marginLines.top + ')');

      // Call the x axis in a group tag
      lines.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(0,' + this.heightLines + ')')
          .call(d3.axisBottom(this.xScaleLines));

      // Call the y axis in a group tag
      lines.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(this.yScaleLines));

      // Generate a line for each line name
      lineGen = d3.line()
        .x((d, i) => {return this.xScaleLines(i); }) // set the x values for the line generator
        .y((d) => { return this.yScaleLines(d); }); // set the y values for the line generator

      // enter the data to the svg
      this.names.forEach((val, ix) => {
        lines.append('g')
        .append('path')
        .datum(data.map((d) => {return d[val];}))
        .attr('stroke', this.colors[ix]) // function (d, i) {return c[i];})
        .attr('class', `line ${val}`)
        .attr('d', lineGen)
        .on('click', function(d) {
          var sel = d3.select(this);
          console.log(d)
        console.log(sel.attr('stroke'));
      });
      });

    });


  this.drawAreas = (data1, data2, c) => {

    // reshape data array from (2, n)
    // to (n, 2)
    datas = [data1, data2]
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
    .x((d, i) => { return this.xScaleLines(i);})
    .y1((d) => { return this.yScaleLines(d[1]);})
    .y0((d) => { return this.yScaleLines(d[0]);});

    // Draw the area using the reshaped array.
    var drawarea = lines.append('path')
    .datum(dataLong)
    .attr('d', area) // Calls the area generator
    .attr('class', 'area');

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
};

function namesAvg(data) {
  var avg = [];
  data.forEach((d,i) => {
    var row = [];
    for (var key in d) {
      if (d.hasOwnProperty(key)) {
        if (key != 'distance') {
          row.push(d[key]);
        }
      }
    }
  avg.push(d3.mean(row));
  if (Number.isNaN(Math.max(...row))) {
  console.log(i, row)}
  });
  return avg;
}

function arrayFromJson(data, name) {
  var arr = [];
  data.forEach(d => {
    arr.push(d[name]);
  });
  return arr;
}

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

// Returns the bar color based on the first array selected
// depending on the difference of the two arrays
function barColor(bH, colors) {
  if (bH > 0) {
    return colors[0];
  } else {
    return colors[1];
  }
}


  // var bars = d3.select('svg')
  // .append('g')
  // .attr('id', 'svg-bars')
  // .attr('transform', 'translate(' + this.marginBars.left + ',' + this.marginBars.top + ')');
  //
  // // Get the bars height
  // var bHeight = [];
  // var bHeightAbs = [];
  // for (var i = 0; i < data1.length; i++) {
  //   bHeightAbs.push(Math.abs(data1[i] - data2[i]));
  //   bHeight.push(data1[i] - data2[i]);
  // }
  //
  // var bands = [];
  // for (i = 0; i < data1.length; i++) {
  //   bands.push(i);
  // }
  //
  // // X Scale
  // var xScaleBars = d3.scaleBand()
  // .domain(bands)
  // .range([0, widthBars])
  // .padding(0);
  //
  // // Compute the stroke-width
  // var strokeWidth = xScaleBars.padding() * xScaleBars.bandwidth();
  //
  // // Y Scale
  // var yScaleBars = d3.scaleLinear()
  // .domain([0, d3.max(bHeightAbs)])
  // .range([heightBars, 0]);
  //
  // // Call the x axis in a group tag
  // bars.append('g')
  // .attr('class', 'axis')
  // .attr('transform', 'translate(0,' + heightBars + ')')
  // .call(d3.axisBottom(xScaleBars));
  //
  // // Call the y axis in a group tag
  // bars.append('g')
  // .attr('class', 'axis')
  // .call(d3.axisLeft(yScaleBars).ticks(3));
  //
  // // Draw the bars
  // var bWidth = xScaleBars.bandwidth();
  // bars.selectAll('rect')
  // .data(bHeight)
  // .enter()
  // .append('rect')
  // .attr('width', xScaleBars.bandwidth())
  // .attr('height', function (d) { return heightBars - yScaleBars(Math.abs(d));})
  // .attr('x', function (d, i) { return xScaleBars(i);})
  // .attr('y', function (d) { return yScaleBars(Math.abs(d));})
  // .attr('class', 'bars')
  // .attr('fill', function (d) { return barColor(d, c);})
  // .attr('stroke', function (d) { return barColor(d, c);})
  // .attr('stroke-width', strokeWidth);
}

function main() {
  // generate random arrays
  // var nPoints = Math.round(Math.random() * 25 + 25);
  // var data1 = [];
  // var data2 = [];
  // for (var i = 0; i < nPoints; i++) {
  //   data1.push(Math.random() * 10);
  //   data2.push(Math.random() * 10);
  // }
  var chart = new svgChart();
  chart.drawCurves()
}

main();
