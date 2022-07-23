/*
Test de cartographie des données MONA
LMK, Maison MONA, projet patrimoine
*/

var margin = {top: 20, right: 30, bottom: 30, left: 80},
width = 1250 - margin.left - margin.right,
height = 700 - margin.top - margin.bottom;

const svgCarte = d3.select("#carte")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom);
const container = svgCarte.append('g')

//geo
var proj = d3.geoConicConformal();
const path = d3.geoPath();

//couleurs des points
const color = d3.scaleOrdinal(["art", "lieu", "patrimoine", "autre"], ["#FAE800", "#C1C4E4", "#FE7E61", "#010202"]) 

//zone d'information associée à la souris
const tooltip = d3.select("body").append("div")
.attr("class", "tooltip")
.style("position", "absolute")
.style("visibility", "hidden")


function showToolTip (text, coords){
    d3.select(".tooltip")
      .text(text)
      .style("top", coords[1] + "px")
      .style("left", coords[0] + "px")
      .style("visibility", "visible");
}


function map (geojson, geobase, dataM){

    proj.center([-73.5878, 45.5088]) // Center on Montreal
        .scale(1000)
        .fitSize([width, height], geojson);

    path.projection(proj);



//layer départements
    container.selectAll("path")
        .data(geojson.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('stroke', 'grey')
        .attr('fill', 'none')      
        

    container.selectAll("path")
        .data(geobase.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('stroke', 'lightgrey')
        .attr('fill', 'none')    


    console.log("categorie 1: " + (dataM[0].category.fr));
    console.log("categorie 2: " + (dataM[1].category.fr));


    var circles = container.selectAll("circle");

    circles
        .data(dataM)
        .enter()
        .append("circle")
        .attr('class', 'city-circle')
        .attr("cx", d => proj([d.location.lng, d.location.lat])[0])
        .attr("cy", d => proj([d.location.lng, d.location.lat])[1])
        .attr("id", d => d.id)
        .attr("r", "2px")
        .attr("fill", d => color(d.typeMONA))
        .attr("opacity", 1)
        .on("mouseover", function(d) {
            //Quand on passe la souris sur un point, affiche le nom du pays et les occurrences dans tooltip
            console.log(d)
            let text = d.title;
            d.category.fr ? text = text + "\nCatégorie: " + d.category.fr : console.log("pas de catégorie")
            showToolTip(text, proj([d.location.lng, d.location.lat]))
          })   

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
    d3.json('../data/limadmin.geojson'),
    d3.json('../data/geobaseMTL.json'),
    d3.json('../data/artworks_v3_2022-07-22.json'),
    d3.json('../data/places_2022-07-08.json'),
    d3.json('../data/heritages_2022-07-08.json')
  ]).then(([geomtl, geobasemtl, art, lieu, pat]) => {


//créer un dataset avec toutes les données à cartographier
    var dataMONA = [];

    console.log(lieu[0])
    console.log(art[0])
    console.log(pat[0])
    lieu.shift();
    lieu.forEach(l => {
        l.typeMONA = "lieu"
        dataMONA.push(l)
    });  
    art.forEach(a => {
        a.typeMONA = "art"
        dataMONA.push(a)
    });

    pat.forEach(p => {
        p.typeMONA = "patrimoine";

        dataMONA.push(p)

    })
    console.log(dataMONA)

    map(geomtl, geobasemtl, dataMONA);

  }).catch(function(error) {
    console.log(error);
  });


