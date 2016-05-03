/*
	D3 Visualization of Protein domains from Uniprot
*/

/*
1. Build data based on search entry
2. Build data based on multiple transcripts
4. Style
*/

//Setup width of chart and bar height
var width = 1000;

//Init starting pixel location
var start_x = 20;

//Spacer for x margin
var spacer = 20;

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

    /*
      Prep chart
    */

    //Create the svg .chart element in #chart-div with width of width
    var chart = d3.select("#chart-div").append("svg").classed("chart", true).attr("width", width);

    //Shortcut to call element to add domains
    var domains = chart.selectAll('rect')
                       .data(rows)
                       .enter()

    //Shortcut to call element for annotation
    var annot_gene = d3.select("form");
    var annot_review = d3.select('form');
    var annot_uniprot = d3.select("form");
    var anont_evidence = d3.select("form");

    /*
      Unique genenames for datalist
    */

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


    /*
      Mouseover tooltips
    */
                    
    //Create tooltip
    var tip = d3.tip()
      .attr('class', 'd3-tip')
      .offset([-10, 0])
      .html(function(d) {
        return "<div class='tool'>" + 
                  "<p><strong>Features:</strong> <span>" + d.Features + "</span></p>" +
                  "<p><strong>Description:</strong> <span>" + d.Descriptions + "</span></p>" +
                  "<p><strong>Start/End:</strong> <span>" + d.Start + "-" + d.End + "</span></p>" +
                "</div>";
      })

    //Call tooltip
    chart.call(tip)
         
    /*
      Gene search element
    */

    //Find the gene element from datalist
    d3.select("input[list=gene]").on('input', function(){
        update_gene_name(this.value);
    });

    //Init the element to display the gene being searched for
    var gene_title = d3.selectAll("form").append("p");

    //Update the gene name to be displayed
    function update_gene_name(gene_input){
      d3.selectAll("rect").remove(); //Clean svg on entry
      d3.selectAll("line").remove(); //Clean lines on entry
      d3.selectAll(".annot").remove(); //Clean text on entry
      
      if(gene_input != ""){
        gene_title.text("Search for: " + gene_input);
        
        
        /*
          Prep chart
        */

        //Find the max range + 100 of the chart
        var max = d3.max(rows, function(d) { 
          if(d.End != "NA"){
            return +d.End + 100; 
          }
          else{
            return 0;
          }
        });
        
        //Create scale for x in the chart
        var scale = d3.scale.linear()
            .domain([0,5000])
            .range([0, max]) //range will vary on max for subset

        //Draw line 0 to max protein length
        var domain_length = chart.append("line")
                                 .attr("x1", scale(spacer))
                                 .attr("y1", 100)
                                 .attr("x2", width)
                                 .attr("y2", 100)
                                 .style("stroke", "rgb(255,0,0)")
                                 .style("stroke-width", 2)

        //Draw line cutting into specified area
        var protein_loc = chart.append("line")
                               .attr("x1", scale(start_x))
                               .attr("y1", 50)
                               .attr("x2", scale(start_x)) 
                               .attr("y2", 150)
                               .style("stroke", "rgb(255,0,0)")
                               .style("stroke-width", 2)


        /* 
          Location Element
        */

        //Find the #loc element and take the value of it on input
        d3.select("#loc")
          .attr("max", max)
          .on("input", function(){
            if(isNaN(parseInt(this.value))){ //Parses and checks if this is a string or not
              update_protein(0);
            } 
            else {
              if(this.value > max){ //Checks to make sure that it is in the limit
                update_protein(max);
              }
              else{
                update_protein(+this.value);
                console.log(scale(+this.value + spacer));
              }
            }
            
          });


        //Updates the position of x1 and x2 for the protein location search
        function update_protein(nValue){
          protein_loc.attr("x1", scale(nValue + spacer))
                     .attr("x2", scale(nValue + spacer)) 
        }

        /*
          Annotate data about gene name/UniprotID/Reviewed/Evidence
        */

        var curr_gene = d3.keys(genenames);

        var uniprotIDs = d3.nest()
                           .key(function(d) {return d.UniprotID})
                           .map(rows);        
        uniprotIDs = d3.keys(uniprotIDs);

        annot_gene.data(rows)
                  .enter()
                  .append("p")
                  .filter(function(d){return d.GENENAME == gene_input})
                  .text(function(d){return d.GENENAME})
                  .attr("class", "annot")



        anont_evidence.data(rows)
                  .enter()
                  .append("p")
                  .filter(function(d){return d.GENENAME == gene_input})
                  .text(function(d){return d.Evidence})
                  .attr("class", "annot")

        annot_review.data(rows)
                  .enter()
                  .append("p")
                  .filter(function(d){return d.GENENAME == gene_input})
                  .text(function(d){return d.Reviewed})
                  .attr("class", "annot")

        annot_uniprot.data(rows)
                  .enter()
                  .append("p")
                  .filter(function(d){return d.GENENAME == gene_input})
                  .text(function(d){return d.UniprotID})
                  .attr("class", "annot")

        /*
          Builds the domains on the lines
        */


        //Builds based on entry
        domains.append("rect")
               .filter(function(d){return d.GENENAME.toLowerCase() == gene_input.toLowerCase()})
               .attr("x", function(d){
                  if(d.Start == "NA"){
                    return(scale(0))
                  }
                  else{
                    return(scale(parseInt(d.Start) + parseInt(spacer)))
                  }
                })
               .attr("y", 75)
               .attr("width", function(d){
                  if(d.End == "NA"){
                    return(scale(0));
                  }
                  else{
                    return(scale(parseInt(d.End) - parseInt(d.Start)))
                  }
                }) 
               .attr("height", 50)
               .style("stroke", "rgb(255,0,0)")
               .style("stroke-width", 2)
               .on('mouseover', tip.show)
               .on('mouseout', tip.hide)

      }
      else{
        gene_title.text(gene_input);
      }
    }

  });

