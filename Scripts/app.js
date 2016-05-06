/*
	D3 Visualization of Protein domains from Uniprot

  This uses a precompiled csv file containing all the major elements from Uniprot needed to visualize the domains. This plot will show the domains in a linear fashion with the ability to mark a specific location.
*/

//Setup width of chart and bar height
var width = 1000;

//Init starting pixel location
var start_x = 20;

//Spacer for x margin
var spacer = 20;

//Read domain data
//d3.csv('Input/domain_data.csv')
//d3.csv('Input/test_single.csv')
d3.csv('Input/test_multiple.csv')
//d3.csv('Input/test_na.csv')
//d3.csv("Input/test_mini.csv")
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
    var annot_evidence = d3.select("form");

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

    //Detects the different transcripts element from options
    d3.select(".transcript").on('change', function(){
        console.log(this.value);
        update_transcript(this.value);
    });

    //Init the element to display the gene being searched for
    var gene_title = d3.selectAll("form").append("p");

    //Update the graph based on transcript
    function update_transcript(transcript_input){
      //Clear entries
      clearGraph(false);

      /*
        Prep chart
      */

      //Prepare all the major elements of the chart such as scaling and line to intersect protein location
      var scale = prep_chart(rows);

      /*
        Annotate data about gene name/UniprotID/Reviewed/Evidence
      */
      
      //Find the gene name
      var geneids = rows.filter(function(d){return d["UniprotID"] == transcript_input})
                        .map(function(d){return d["GENENAME"]})     

      //Move to set to get unique uniprot id
      var geneid_set = new Set();
      geneids.map(function(d){geneid_set.add(d)});
      curr_gene = Array.from(geneid_set);
      curr_gene = curr_gene[0];

      //Filters out the uniprotID
      var uniprotIDs = rows.filter(function(d){return d["UniprotID"] == transcript_input})
                           .map(function(d){return d["UniprotID"]})     

      //Move to set to get unique uniprot id
      var uniprotId = new Set();
      uniprotIDs.map(function(d){uniprotId.add(d)});
      uniprotIDs = Array.from(uniprotId);

      //Filters out based on uniprot id from prior
      var evidence = new Array();

      //Checks each protein id for evidence
      uniprotIDs.map(function(e){
        var evidence_array = rows.filter(function(d){return d.UniprotID == e})
                                         .map(function(d){return d.Evidence})

        //Create new array and set to take in the evidence
        var single_evid = new Set();
        evidence_array.map(function(d){single_evid.add(d)});
        single_evid.forEach(function(v){evidence.push(v)});  
      });
      
      //Checks each protein id for review
      var review = new Array();
      uniprotIDs.map(function(e){
        //Filters out based on uniprot id from prior
        var review_array = rows.filter(function(d){return d.UniprotID == e})
                                 .map(function(d){return d.Reviewed})

        //Create new array and set to take in the evidence
        var single_review = new Set();
        review_array.map(function(d){single_review.add(d)});
        single_review.forEach(function(v){review.push(v)});  
      });

      //Create the options for the transcript dropdown
      d3.select('.transcript').selectAll('option')
        .data(uniprotIDs) // Data join, find keys from mapped keys
        .enter() // Enter data selection
        .append('option') // Append to options
        .attr('value', function (d) {return d}) // Add name to option
        .attr("id", function(d) {return d})
        .text(function(d){return d})

      /*
        Annotate page with information about the domain/transcripts
      */
      
      //Shows current gene
      append_gene(curr_gene);

      //Shows transcript evidence
      append_transcript(evidence);

      //Shows the type of review this transcript has
      append_transcript(review);

      //Shows the uniprotID
      append_uniprotID(uniprotIDs);

      /*
        Builds the domains on the lines
      */

      //Builds based on entry
      buildDomains(transcript_input, scale);

    }

    //Clears entries
    function clearGraph(all = true){
      d3.selectAll("rect").remove(); //Clean svg on entry
      d3.selectAll("line").remove(); //Clean lines on entry
      d3.selectAll(".annot").remove(); //Clean text on entry
      if(all == true){
        d3.selectAll(".transcript option").remove(); //Clean text on entry
      }
    }

    //Appends current gene
    function append_gene(genename){
      annot_gene.append("p")
                .text(genename)
                .attr("class", "annot")
    }

    //Appends transcript evidence
    function append_transcript(transcript){
      annot_evidence.append("p")
                    .text(transcript)
                    .attr("class", "annot")
    }

    //Appends type of review
    function append_review(review){
      annot_review.append("p")
                  .text(review)
                  .attr("class", "annot")
    }

    //Appends uniprotID
    function append_uniprotID(uniprotid){
      annot_uniprot.append("p")
                   .text(uniprotid)
                   .attr("class", "annot")
    }

    //Builds the domains on the line
    function buildDomains(data, scale){
      //Builds based on entry
      domains.append("rect")
             .filter(function(d){return d.UniprotID == data})
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


    //Prepares all the prepartory phases of the graph such as returning the scale, finding the max, as well as drawing the intersecting line/horizontal line
    function prep_chart(rows){
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

      //Draw line 0 to max protein lengthtranscript
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


      //Updates the position of x1 and x2 for the protein location search
      function update_protein(nValue){
        protein_loc.attr("x1", scale(nValue + spacer))
                   .attr("x2", scale(nValue + spacer)) 
      }

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

        return(scale);
    }

    //Update the gene name to be displayed
    function update_gene_name(gene_input){
      //Clear entries
      clearGraph();
           
      /*
        Prep chart
      */

      //Prep the lines as well as get the scale
      var scale = prep_chart(rows);


      /*
        Annotate data about gene name/UniprotID/Reviewed/Evidence
      */

      //Filter to check if a gene is the same as the input value
      function contain_gene(gene){
        return(gene == gene_input);
      }

      //Filters current gene
      var curr_gene = d3.keys(genenames);
      curr_gene = curr_gene.filter(contain_gene);

      //Filters out the uniprotID
      var uniprotIDs = rows.filter(function(d){return d.GENENAME.toLowerCase() == gene_input.toLowerCase()})
                             .map(function(d){return d.UniprotID})     

      //Move to set to get unique uniprot id
      var uniprotId = new Set();
      uniprotIDs.map(function(d){uniprotId.add(d)});
      uniprotIDs = Array.from(uniprotId);

      //Filters out based on uniprot id from prior
      var evidence = new Array();

      //Checks each protein id for evidence
      uniprotIDs.map(function(e){
        var evidence_array = rows.filter(function(d){return d.UniprotID == e})
                                         .map(function(d){return d.Evidence})

        //Create new array and set to take in the evidence
        var single_evid = new Set();
        evidence_array.map(function(d){single_evid.add(d)});
        single_evid.forEach(function(v){evidence.push(v)});  
      });
  
      //Checks each protein id for review
      var review = new Array();
      uniprotIDs.map(function(e){
        //Filters out based on uniprot id from prior
        var review_array = rows.filter(function(d){return d.UniprotID == e})
                                 .map(function(d){return d.Reviewed})

        //Create new array and set to take in the evidence
        var single_review = new Set();
        review_array.map(function(d){single_review.add(d)});
        single_review.forEach(function(v){review.push(v)});  
      });

      //Create the options for the transcript dropdown
      d3.select('.transcript').selectAll('option')
        .data(uniprotIDs) // Data join, find keys from mapped keys
        .enter() // Enter data selection
        .append('option') // Append to options
        .attr('value', function (d) {return d}) // Add name to option
        .attr("id", function(d) {return d})
        .text(function(d){return d})

      /*
        Annotate page with information about the domain/transcripts
      */
        
      //Shows current gene
      append_gene(curr_gene[0]);

      //Shows transcript evidence
      append_transcript(evidence[0]);

      //Shows the type of review this transcript has
      append_review(review[0]);

      //Shows the uniprotID
      append_uniprotID(uniprotIDs[0]);

      /*
        Builds the domains on the lines
      */

      buildDomains(uniprotIDs[0], scale);


    }

  });

