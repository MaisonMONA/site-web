/*
Test de cartographie des données MONA
*/
var margin = {top: 20, right: 30, bottom: 30, left: 80},
  width = 1250 - margin.left - margin.right,
  height = 700 - margin.top - margin.bottom;

const svgCarte = d3.select("#carte")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const container = svgCarte.append('g')

var proj = d3.geoConicConformal();
const path = d3.geoPath();

const color = d3.scaleOrdinal(["art", "lieu", "pat", "autre"], ["#FBE900", "#B4B7DD", "#E97FC8", "#010202"]) 



function map (geojson, dataM){

    proj.center([-73.5878, 45.5088]) // Center on Montreal
        .scale(1000)
        .fitSize([width, height], geojson);

    path.projection(proj);



//layer départements
    container.selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('stroke', 'black')
        .attr('fill', 'none')      
        


    var circles = container.selectAll("circle").data(dataM)

    console.log("lat: " + (dataM[0].location.lat))
    console.log("proj: " + proj([dataM[0].location.lat, dataM[0].location.lng]))

    circles.enter()
        .append("circle")
        .attr('class', 'city-circle')
        .attr("cx", d => proj([d.location.lng, d.location.lat])[0])
        .attr("cy", d => proj([d.location.lng, d.location.lat])[1])
        .attr("id", d => d.id)
        .attr("r", "2px")
        .attr("fill", d => color(d.type))
        .attr("opacity", 1)   

//zoom sur l'image
    svgCarte.call(
        d3.zoom().on(
            "zoom", 
            () => {
            container.attr('transform', d3.event.transform)
            }
        )
    )    
    return container.node();
}




Promise.all([
    //d3.json('https://picasso.iro.umontreal.ca/~mona/api/artworks'),
    //d3.json('https://picasso.iro.umontreal.ca/~mona/api/places'),
    //d3.json('https://data.montreal.ca/dataset/41fcc790-e328-44be-bcbf-73556fa0bc32/resource/b0a6cfa4-ad77-4f5b-bd1b-050fe233a31f/download/patrimoinelpc.geojson'),
    d3.json('https://data.montreal.ca/dataset/00bd85eb-23aa-4669-8f1b-ba9a000e3dd8/resource/e9b0f927-8f75-458c-8fda-b5da65cc8b73/download/limadmin.geojson'),
    d3.json('../data/artworks.json'),
    d3.json('../data/places.json')
  ]).then(([geomtl, art, lieu]) => {


//créer un dataset avec toutes les données à cartographier
    var dataMONA = [];

  
    lieu.data.forEach(l => {
        l.type="lieu"
        dataMONA.push(l)
    });  
    art.data.forEach(a => {
        a.type="art"
        dataMONA.push(a)
    });
    console.log(dataMONA)

    map(geomtl, dataMONA);

  }).catch(function(error) {
    console.log(error);
  });


