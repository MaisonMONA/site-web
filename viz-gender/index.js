/*
Test de cartographie des données MONA
LMK, Maison MONA, projet patrimoine
*/

var margin = {top: 20, right: 30, bottom: 30, left: 80},
width = 1500 - margin.left - margin.right,
height = 900 - margin.top - margin.bottom;

const svgCarte = d3.select("#carte")    
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom);
const container = svgCarte.append('g')

//geo
var proj = d3.geoConicConformal();
const path = d3.geoPath();

//couleurs des points
const color = d3.scaleOrdinal().domain(["woman", "non binary", "man", "mixed", "collective", "unknown"]).range(["#AA244F", "#5DD39E", "#000007", "#FDDB00", "#FDDB00", "#E8E9EB"])

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
/*
function showDetails (d){
    
    title = d.title.fr;
    var artistes = "";
    d.artists.forEach(a => artistes = artistes.concat(a.name).concat(" "));
    var cat =""
    d.categories.fr.forEach(c => cat = cat + c + " ")

    contenu = `
            <p>${artistes}</p>
            <p>${d.produced_at.substr(0,10)}</p>
            <p>${cat}</p>
            <a href="${d.url? d.url.fr : ""}" target="_blank">web</a>
                `
      
    d3.select("#info").html(`
      <h3 style="background-color: ${color(d.typeMONA)}">${title}</h3>
      <code>${contenu}</code>
    `)
  }
*/
function map (geoMTL, geobaseMTL, dataM){

    proj.center([-73.5878, 45.5088]) // Center on Montreal
        .scale(1000)
        .fitSize([width, height], geoMTL);

    path.projection(proj);

//layer réseau routier MTL
    container.selectAll("path")
        .data(geobaseMTL.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('stroke', 'lightgrey')
        .attr('fill', 'none')    

    var circles = container.selectAll("circle");

    circles
        .data(dataM)
        .enter()
        .append("circle")
        .attr('class', 'city-circle')
        .attr("cx", d => proj([d.geolocation.lng, d.geolocation.lat])[0])
        .attr("cy", d => proj([d.geolocation.lng, d.geolocation.lat])[1])
        .attr("id", d => d.id)
        .attr("r", "3px")
        .attr("fill", d => color(d.gender))
        .attr("opacity", 1)
        .on("mouseover", function(d) {
            //Quand on passe la souris sur un point, affiche le nom du pays et les occurrences dans tooltip
            console.log(d)
            let text = String(d.title).concat(" | ")

            showToolTip(text, proj([d.geolocation.lng, d.geolocation.lat]))
          }) 
        //  .on("click", d => showDetails(d))   

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
    d3.json('../data/MTLarrondissements.geojson'),
    d3.json('../data/MTLgeobase.json'),
    d3.json('../data/artworks_reconciliation_workshopDHNB.json')
  ]).then(([geomtl, geobasemtl, art,]) => {

    map(geomtl, geobasemtl, art.sort((a, b) => {
        return a.gender - b.gender;
    }));

  }).catch(function(error) {
    console.log(error);
  });


