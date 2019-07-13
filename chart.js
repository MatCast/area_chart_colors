// SVG properties
function svgChart() {
  this.svgWidth = 1200;
  this.svgHeight = 700;
  // Height of the bottom chart: bottom margin of the top chart
  this.chartsDiff = 250;
  //  Top chart margins and inner measures
  this.marginLines = { top: 50, right: 80, bottom: this.chartsDiff, left: 80 };
  this.widthLines = this.svgWidth - this.marginLines.left - this.marginLines.right;
  this.heightLines = this.svgHeight - this.marginLines.top - this.marginLines.bottom;

  // Bottom chart margins and inner measures
  this.fromTop = this.svgHeight - this.chartsDiff + 50;
  this.marginBars = { top: this.fromTop, right: this.marginLines.right, bottom: 50, left: this.marginLines.left };
  this.widthBars = this.svgWidth - this.marginBars.left - this.marginBars.right;
  this.heightBars = this.svgHeight - this.marginBars.top - this.marginBars.bottom;


  // Dimensions and aspect ratio of the SVG
  this.svg = d3.select('#lines')
  .append('svg')
  .attr('id', 'main-svg')
  .attr('width', '100%')
  .attr('preserveAspectRatio', 'xMidYMid meet')
  .attr('viewBox', '0 0 ' + this.svgWidth + ' ' + this.svgHeight);

  this.drawCurves = () =>
    d3.csv('./distances.csv').then((data) => {
      this.names = [];
      this.colors = ['HotPink', 'Orange', 'DodgerBlue', 'BlueViolet'];
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
      this.colors.push('OrangeRed');

      // Curves Group and translation
      let lines = d3.select('#main-svg')
        .append('g')
        .attr('id', 'svg-lines')
        .attr('transform', 'translate(' + this.marginLines.left + ',' + this.marginLines.top + ')');
      // Bars plot
      let bars = d3.select('#main-svg')
        .append('g')
        .attr('id', 'svg-bars')
        .attr('transform', 'translate(' + this.marginBars.left + ',' + this.marginBars.top + ')');

      this.xTicksOffset = (data[1].distance - data[0].distance) / 2000.0;

      // X Scale
      this.xScaleTicks = d3.scaleLinear()
      .domain([- this.xTicksOffset, d3.max(data, d => d.distance) / 1000 - this.xTicksOffset])
      .range([0, this.widthLines]);

      // Call the x axis in a group tag
      lines.append('g')
          .attr('class', 'axis')
          .attr('transform', 'translate(0,' + this.heightLines + ')')
          .call(d3.axisBottom(this.xScaleTicks));

      // Call the y axis in a group tag
      lines.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(this.yScaleLines));

      // Generate a line for each line name
      lineGen = d3.line()
        .x((d, i) => {return this.xScaleLines(i); }) // set the x values for the line generator
        .y((d) => { return this.yScaleLines(d); }); // set the y values for the line generator

      this.clicks = 0;

      // enter the data to the svg
      this.names.forEach((val, ix) => {
        lines.append('g')
        .append('path')
        .datum(data.map((d) => {return d[val];}))
        .attr('stroke', this.colors[ix]) // function (d, i) {return c[i];})
        .attr('class', `line ${val}`)
        .attr('d', lineGen)
        .on('click', (d, i, nodes) => {
          let sel = d3.select(nodes[i]);
          let col = sel.attr('stroke');
          let cl = sel.attr('class').split(' ')[1];

          if (! this.clicks) {
            let d2 = arrayFromJson(data, 'average');
            this.lastClass = 'average';
            let c = [col, this.colors[this.colors.length - 1]];
            this.drawAreas(d, d2, c, cl);
            this.drawBars(d, d2, c, cl);
          } else {
            let d2 = this.lastClicked;
            let c = [col, this.lastColor];
            this.drawAreas(d, d2, c, cl);
            this.drawBars(d, d2, c, cl);
          }
        })
      .on('mouseover', (d, i, node) => this.overTooltip(node[i]))
      .on('mouseout', () => this.outTooltip())
      .on('mousemove', (d, i, node) => this.tooltipUpdate(node[i]));
      });


    // toolTip

     this.overTooltip = (node) => {
       let sel = d3.select(node);
       let x = this.xScaleLines.invert(d3.mouse(node)[0]) * this.xTicksOffset * 2.0;
       let y = this.yScaleLines.invert(d3.mouse(node)[1]);
       let name = sel.attr('class').split(' ')[1];
       this.fillTooltip(sel, name, x, y);
       d3.selectAll('.tooltip')
        .classed('hidden', false)
        .style('left', (d3.event.pageX - 100) + 'px')
        .style('top', (d3.event.pageY - 60) + 'px');
     };

     this.outTooltip = () => {
       d3.selectAll('.tooltip')
        .classed('hidden', true);
     };

     this.tooltipUpdate = (node) => {
       let sel = d3.select(node);
       let x = this.xScaleLines.invert(d3.mouse(node)[0]) * this.xTicksOffset * 2.0;
       let y = this.yScaleLines.invert(d3.mouse(node)[1]);
       let name = sel.attr('class').split(' ')[1];
       this.fillTooltip(sel, name, x, y);
       d3.selectAll('.tooltip')
       .style('left', (d3.event.pageX - 100) + 'px')
       .style('top', (d3.event.pageY - 60) + 'px');
     };

    this.fillTooltip = (sel, name, x, y) => {
      let tb = d3.selectAll('.tooltip').select('table');
      tb.select('th')
      .text(capitFirst(name))
      .style('color', sel.attr('stroke'));

      tb.select('.x')
      .text(x.toFixed(1) + 'km');

      tb.select('.y')
      .text(y.toFixed(0) + 'm');
    };

      // Legend
      let legFontSize = 12;
      let legRectHeight = legFontSize - 1;
      let legRectWidth = 19;
      let xOffset = 5;


      var legend = lines.append('g')
       .attr('font-family', 'sans-serif')
       .attr('font-size', legFontSize)
       .selectAll('g')
       .data(this.names)
       .enter()
       .append('g')
       .attr('class', d => `legend ${d}`)
       .attr('transform', function(d, i) { return 'translate(0,' + i * (legRectHeight + 1) + ')'; });

     legend.append('rect')
       .attr('x', xOffset)
       .attr('width', legRectWidth)
       .attr('height', legRectHeight)
       .attr('fill', (d, i) => {return this.colors[i];});

     legend.append('text')
       .attr('x', xOffset + legRectWidth + 5)
       .attr('y', legRectHeight / 2)
       .attr('dy', '0.32em')
       .text(function(d) { return capitFirst(d); });

      legend.on('click', (name, i, nodes) => {
        let sel = d3.select(nodes[i]);
        let cl = sel.attr('class').split(' ')[1];
        let col = d3.select(`.line.${cl}`).attr('stroke');
        var d = d3.select(`.line.${cl}`).data()[0];

        if (! this.clicks) {
          let d2 = d3.select(`.line.average`).data()[0];
          this.lastClass = 'average';
          let c = [col, this.colors[this.colors.length - 1]];
          this.drawAreas(d, d2, c, cl);
          this.drawBars(d, d2, c, cl);
        } else {
          let d2 = this.lastClicked;
          let c = [col, this.lastColor];
          this.drawAreas(d, d2, c, cl);
          this.drawBars(d, d2, c, cl);
        }
      });

      //  Axis Labels
      let xLabel = lines.append('text')
      .attr('class', 'x axis-label')
      .text('Distance [km]')
      .attr('x', this.widthBars / 2.0)
      .attr('y', this.heightLines + 40);

      let labTop = d3.select('.x.axis-label')
      .node()
      .getBoundingClientRect()
      .top;

      d3.select('.howto')
      .on('click', function() {this.classList.add('hidden');});

      //  Axis Labels
      let yLabelLines = lines.append('text')
      .attr('class', 'y axis-label')
      .text('Altitude differece [m]')
      .attr('y', - 50)
      .attr('x', - this.heightLines / 2.0)
      .attr('transform', 'rotate(270)');
    });


  this.drawAreas = (data1, data2, c, cl) => {

    this.clicks = 1;
    this.lastClicked = [];
    data1.forEach(d => {this.lastClicked.push(d);});
    this.lastColor = c[0];

    // reshape data array from (2, n)
    // to (n, 2)
    d3.select('.area')
    .transition()
    .duration(1000)
    .attr('opacity', 0)
    .remove();

    d3.select('defs')
    .transition()
    .delay(500)
    .remove();

    datas = [data1, data2];
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

    var lines = d3.select('#main-svg')
      .append('g')
      .attr('transform', 'translate(' + this.marginLines.left + ',' + this.marginLines.top + ')');

    // Draw the area using the reshaped array.
    var drawarea = lines.append('path')
    .datum(dataLong)
    .attr('d', area) // Calls the area generator
    .attr('class', 'area')
    .attr('opacity', 0)
    .transition()
    .delay(500)
    .duration(500)
    .attr('opacity', 0.5);

    // Create a linear Gradient to assign different
    // colors to the areas based on the highest value
    var linearGradient = this.svg.append('defs')
    .append('linearGradient')
    .attr('id', 'linear-gradient');

    // Compute the intersections of the arrays
    let intersections = lineIntersection(data1, data2);

    // Transform the intersections values
    // to percentages to be used as stop points
    var offScale = d3.scaleLinear()
    .domain([0, data1.length - 1])
    .range([0, 100]);

    // Choose which color to start with
    // based on which curve starts with the
    // highest value hence is on top off the other.

    // each of this point represents the NEXT color to show.
    let highs = whichHigher(data1, data2, intersections, c);
    var lastColor = c[0];

    setTimeout(() => {
      if (data1[0] - data2[0] != 0) {
          linearGradient.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', lastColor);
        } else if (data1[0] - data2[0] < 0) {
          lastColor = c[1];
        }

        for (i = 0; i < intersections.length; i++) {
          var offset = offScale(intersections[i]) + '%';

          linearGradient.append('stop')
          .attr('offset', offset)
          .attr('stop-color', lastColor);

          lastColor = highs[i];

          linearGradient.append('stop')
          .attr('offset', offset)
          .attr('stop-color', lastColor);
        }

        linearGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', lastColor);}, 500);

};


this.drawBars = (data1, data2, c, cl) => {

d3.select('.button-wrapper')
.classed('hidden', true);

var bars = d3.select('#svg-bars');

  bars
  .selectAll('.axis')
  .remove();

  d3.selectAll('.chart-title')
  .transition()
  .duration(1000)
  .style('opacity', 0)
  .remove();

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
  .range([0, this.widthBars])
  .padding(0);

  // Compute the stroke-width
  var strokeWidth = xScaleBars.padding() * xScaleBars.bandwidth();

  // Y Scale
  var yScaleBars = d3.scaleLinear()
  .domain([0, d3.max(bHeightAbs)])
  .range([this.heightBars, 0]);

  var barsTitle = bars.append('g')
  .attr('class', 'chart-title')
  .append('text')
  .attr('x', 5)
  .attr('y', yScaleBars(d3.max(bHeightAbs)))
  .text(`${capitFirst(cl)} vs. ${capitFirst(this.lastClass)}`)
  .style('opacity', 0)
  .transition()
  .duration(1000)
  .style('opacity', 1);

  let ticksBands = [];

  for (i = 0; i < data1.length; i++) {
    ticksBands.push(i * this.xTicksOffset * 2.0);
  }

  let xScaleBarsTicks = d3.scaleBand()
  .domain(ticksBands)
  .range([0, this.widthBars])
  .padding(0);

  var ticks = xScaleBarsTicks.domain()
  .filter(function(d, i){ return !(i%50); } );

  // Call the x axis in a group tag
  bars.append('g')
  .attr('class', 'axis')
  .attr('transform', 'translate(0,' + this.heightBars + ')')
  .call(d3.axisBottom(xScaleBarsTicks).tickValues(ticks));

  // Call the y axis in a group tag
  bars.append('g')
  .attr('class', 'axis')
  .call(d3.axisLeft(yScaleBars).ticks(3));

  var barsData = bars.selectAll('rect')
  .data(bHeight);

  // Draw the bars
  var bWidth = xScaleBars.bandwidth();
  if(barsData.size()>0) {
    barsData
    .enter()
    .append('rect')
    .merge(barsData)
    .attr('x', function (d, i) { return xScaleBars(i);})
    // .attr('y', (d) => { return this.heightBars - yScaleBars(Math.abs(d));})
    // .attr('height', 0)
    .transition()
    .duration(1000)
    .attr('y', function (d) { return yScaleBars(Math.abs(d));})
    .attr('height', (d) => { return this.heightBars - yScaleBars(Math.abs(d));})
    .attr('fill', function (d) { return barColor(d, c);})
    .attr('stroke', function (d) { return barColor(d, c);});
  } else {
    barsData.enter()
    .append('rect')
    .attr('x', function (d, i) { return xScaleBars(i);})
    .attr('y', yScaleBars(0))
    .attr('width', xScaleBars.bandwidth())
    .transition()
    .duration(1000)
    .attr('y', function (d) { return yScaleBars(Math.abs(d));})
    .attr('height', (d) => { return this.heightBars - yScaleBars(Math.abs(d));})
    .attr('class', 'bars')
    .attr('fill', function (d) { return barColor(d, c);})
    .attr('stroke', function (d) { return barColor(d, c);})
    .attr('stroke-width', strokeWidth);
  }

  this.lastClass = cl;

  //  Axis Labels
  let yLabelBars = bars.append('text')
  .attr('class', 'y axis-label')
  .text('Altitude differece [m]')
  .attr('y', - 50)
  .attr('x', - this.heightBars / 2.0)
  .attr('transform', 'rotate(270)');

  let xLabel = d3.select('.x.axis-label').remove();

  bars.append(function() {return xLabel.node()})
  .attr('y', this.heightBars + 40);
  };

}

function capitFirst(name) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Get the point mean value along all names
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
  });
  return avg;
}

// Transform the json read from d3.csv to a single array
// for a specific name
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
  for (let i = 0; i < arr1.length; i++) {
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
  let intersections = [];

  for (let i = 0; i < sign.length; i++) {
    intersections.push(segmentIntersection(arr1, arr2, sign[i]));
  }

  // add intersection points where the lines meet exactly on one of
  //  the array elements
  arr1.forEach((d,i) => {
    if (arr1[i] - arr2[i] == 0) {
      intersections.push(i);
    }
  });

  // Remove the x = 0 point in case it was one
  // of the intersection points: this is because
  // the gradient always starts at 0 and having 0
  // in the interception would create a redundant
  // gradeint stop point
  intersections.sort(function(a, b){return a - b;});
  return intersections;
}

// Returns an array of the same shape as intersections
// Each value represents the next color to display after
// the intersection
function whichHigher(arr1, arr2, intersections, c) {
  highs = [];
  intersections.forEach( d => {
    let i = Math.ceil(d);
    let diff = arr1[i] - arr2[i];
    while ((i < arr1.length) & (diff == 0)){
      i += 1;
      diff = arr1[i] - arr2[i];
    }
    if (diff >= 0) {
      highs.push(c[0]);
    } else if (diff < 0) {
      highs.push(c[1]);
    }
  });

  return highs;
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

function main() {
  var chart = new svgChart();
  chart.drawCurves();
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
          });
      });
  });
}

main();
