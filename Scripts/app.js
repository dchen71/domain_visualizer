/*
	D3 Visualization of Protein domains from Uniprot
*/

//Setup width of chart and bar height
var width = 1000;

//Init starting pixel location
var start_x = 20;

//Spacer for x margin
var spacer = 20;

//Create scale for x in the chart
var x = d3.scale.linear()
    .range([0, width]);

//Create the svg .chart element in #chart-div with width of width
var chart = d3.select("#chart-div").append("svg").classed("chart", true).attr("width", width);

//Read domain data
//d3.csv('Input/domain_data.csv')
d3.csv('Input/test_single.csv')
//d3.csv('Input/test_multiple.csv')
//d3.csv('Input/test_na.csv')
  .row(function (d) { return d })
  .get(function (error, rows) {
    
    //Error message
    if(error){
      console.log(error);
      d3.select("body").append("p").text("Error loading csv");
    };


    //Creates array containing unique genename to numbers of genename
    var genenames = d3.nest()
                      .key(function(d) {return d.GENENAME})
                      .map(rows);

    //Create the options for the datalist
    d3.select('datalist').selectAll('option')
      .data(d3.keys(genenames)) // Data join, find keys from mapped nested array
      .enter() // Enter data selection
      .append('option') // Append to options
      .attr('value', function (d) { return d; }) // Add name to option
      .attr("id", function(d) {return d});

    //Draw line 0 to max protein length
    var domain_length = chart.append("line")
                             .attr("x1", 20)
                             .attr("y1", 100)
                             .attr("x2", width) //Will want to change this to max dist of whatever gene
                             .attr("y2", 100)
                             .style("stroke", "rgb(255,0,0)")
                             .style("stroke-width", 2)
                    

    d3.select("body").data(rows).enter().append("p").text(function(d){return (d["GENENAME"] + " " + d["Start"]) + " " + d["End"];})

    /*
      Want to create boxes interspaced between max distance of 1000 and probably have it scaled based on the boxes
    */

    //Create tooltip
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<div class='toop'>" + 
                  "<p><strong>Features:</strong> <span>" + "d.Features" + "</span></p>" +
                  "<p><strong>Description:</strong> <span>" + "d.Description" + "</span></p>" +
                  "<p><strong>Start/End:</strong> <span>" + "d.Start" + "-" + "d.End" + "</span></p>" +
                "</div>";
      })

    chart.call(tip)

    //Manually building 1st entry
    chart.append("rect")
         .attr("x", 465 + spacer)
         .attr("y", 75)
         .attr("width", 552-465) 
         .attr("height", 50)
         .style("stroke", "rgb(255,0,0)")
         .style("stroke-width", 2)
         .on('mouseover', tip.show)
         .on('mouseout', tip.hide)


    //Find the gene element from datalist
    d3.select("input[list=gene]").on('input', function(){
        console.log(this.value);
    });

    //Find the #loc element and take the value of it on input
    d3.select("#loc")
      .attr("max", 1000)
      .on("input", function(){
        if(isNaN(parseInt(this.value))){ //Parses and checks if this is a string or not
          update_protein(0);
        } 
        else {
          if(this.value > 1000){ //Checks to make sure that it is in the limit
            update_protein(500);
          }
          else{
            update_protein(+this.value);
          }
        }
        
      });

    //Draw line cutting into specified area
    var protein_loc = chart.append("line")
                           .attr("x1", start_x)
                           .attr("y1", 50)
                           .attr("x2", start_x) 
                           .attr("y2", 150)
                           .style("stroke", "rgb(255,0,0)")
                           .style("stroke-width", 2)

    //Updates the position of x1 and x2 for the protein location search
    function update_protein(nValue){
      protein_loc.attr("x1", nValue + spacer)
                 .attr("x2", nValue + spacer) 
    }

  });

