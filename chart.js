function areaChart() {
  var data1 = [0.0, 1.0, 5.0, 3.0, 7.0, 4.0, 5.0, 8.0];
  var data2 = [0.0, 3.0, 4.0, 6.0, 9.0, 10.0, 2.0, 6.0];
  var datas = [data1, data2];
  var maxY = d3.max([d3.max(data1), d3.max(data2)]);

  var margin = { top: 50, right: 50, bottom: 50, left: 50 };
  var width = window.innerWidth - margin.left - margin.right; // Use the window's width
  var height = window.innerHeight - margin.top - margin.bottom; // Use the window's height

  var xScale = d3.scaleLinear()
  .domain([0, data1.length - 1])
  .range([0, width]);

  var yScale = d3.scaleLinear()
  .domain([0, maxY])
  .range([height, 0]);

  var line = d3.line()
  .x(function (d, i) {return xScale(i); }) // set the x values for the line generator
  .y(function (d) { return yScale(d); }); // set the y values for the line generator

  var svg = d3.select('body')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

  // 3. Call the x axis in a group tag
  svg.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

  // 4. Call the y axis in a group tag
  svg.append('g')
  .attr('class', 'axis')
  .call(d3.axisLeft(yScale));

  // reshape data array
  var dataLong = [];
  for (var i = 0; i < datas[0].length; i++) {
    dataLong.push([]);
  }

  datas.forEach(function (d) {
    for (var i = 0; i < d.length; i++) {
      dataLong[i].push([d[i]]);
    }
  });

  var area = d3.area()
  .x(function (d, i) { return xScale(i);})
  .y1(function (d) { return yScale(d[1]);})
  .y0(function (d) { return yScale(d[0]);});

  var drawarea = svg.append('path')
  .datum(dataLong)
  .attr('d', area)
  .attr('class', 'area');

  var graph = svg.append('g')
  .selectAll('graph')
  .data(datas)
  .enter()
  .append('g')
  .attr('class', function (d, i) {return 'line' + (i + 1);});

  graph.append('path')
  .attr('d', function (d) {return line(d);}); // 11. Calls the line generator
}

areaChart();
