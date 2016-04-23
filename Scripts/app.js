/*
	D3 Visualization of Protein domains from Uniprot
*/

//Setup width of chart and bar height
var width = 420,
    barHeight = 20;

//Create scale for the chart
var x = d3.scale.linear()
    .range([0, width]);

//Create the svg .chart element in #chart-div with width of width
var chart = d3.select("#chart-div").append("svg").classed("chart", true).attr("width", width);

//Read domain data
d3.csv('Input/domain_data.csv')
  .row(function (d) { return d })
  .get(function (error, rows) {
    
    //Creates array containing genename to numbers of genename
    var nest = d3.nest()
      .key(function(d) {return d.GENENAME})
      .map(rows);

    //Create the options for the datalist
    d3.select('datalist').selectAll('option')
      .data(d3.keys(nest)) // Data join, find keys from mapped nested array
      .enter() // Enter data selection
      .append('option') // Append to options
      .attr('value', function (d) { return d; }); // Add name to option
  });