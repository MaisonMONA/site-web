/*
Test de cartographie des données MONA
LMK, Maison MONA, projet patrimoine
*/

var margin = {top: 20, right: 30, bottom: 30, left: 80},
width = 1500 - margin.left - margin.right,
height = 900 - margin.top - margin.bottom;

const svgCarte = d3.select("#carte")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.style("background", "lightblue");;
const container = svgCarte.append('g')

//geo
var proj = d3.geoConicConformal();
const path = d3.geoPath();

//couleurs des points
const color = d3.scaleOrdinal(["art", "lieu", "patrimoine", "autre"], ["#FAE800", "#612B8D", "#FE7E61", "#010202"]) 

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

function showDetails (d){
    console.log(d.typeMONA)
    var title;
    var contenu;
  
    if (d.typeMONA == "art"){
        title = d.title.fr;
        
        var cat =""
        d.categories.fr.forEach(c => cat = cat + c + " ")
       
        contenu = `
                <p>${d.artist}</p>
                <p>${d.produced_at.substr(0,10)}</p>
                <p>${cat.concat("; ").concat(d.accessibilities_fr)}</p>
                <p>${d.place_fr.concat("; ").concat(d.address)}</p>
                <p>${d.description_fr ? d.description_fr : ""}</p>
                <a href="${d.url? d.url.fr : ""}" target="_blank">web</a>
                `  
    }
  
    d3.select("#info").html(`
      <h3 style="background-color: ${color(d.typeMONA)}">${title}</h3>
      <code>${contenu}</code>
    `)
  }

function map (geo, routes, poly, dataM){

    proj.center([61.85, 47.37])
        .scale(9000)
        .fitSize([width, height], poly);

    path.projection(proj);


//îles
    container.selectAll("path")
        .data(geo.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('fill', 'lightgrey')

// poly 

 //routes
    container.selectAll("path")
    .data(routes.features)
    .enter().append("path")
    .attr("d", d => path(d))
    .attr('stroke', 'white')
    .attr('fill', 'none')   

//art    
    var circles = container.selectAll("circle");

    circles
        .data(dataM)
        .enter()
        .append("circle")
        .attr('class', 'city-circle')
        .attr("cx", d => proj([d.location.lng, d.location.lat])[0])
        .attr("cy", d => proj([d.location.lng, d.location.lat])[1])
        .attr("id", d => d.id)
        .attr("r", "6px")
        .attr("fill", d => color(d.typeMONA))
        .attr("opacity", 1)
        .on("mouseover", function(d) {
            //Quand on passe la souris sur un point, affiche le nom du pays et les occurrences dans tooltip
            console.log(d)
            let text;
            switch (d.typeMONA){

                case "art":
                    text = String(d.title.fr).concat(" | ")
                    d.categories.fr.forEach(cat => text = text + " " + cat)
                    break;
                
                case "lieu":
                    text = String(d.title)
                    text = text + " " + d.category.fr
                    break;

                case "patrimoine":
                    text = String(d.title)
                    d.functions.fr.forEach(cat => text = text + " " + cat)
                    break;

            }

            showToolTip(text, proj([d.location.lng, d.location.lat]))
          }) 
        .on("click", d => showDetails(d))   

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
    d3.json('../data/iles_outline.geojson'),
    d3.json('../data/cap_routesOSM.geojson'),
    d3.json('../data/iles_art_2023-06-30.json'),
    d3.json('../data/cap_poly.geojson'),
  ]).then(([geo, routes, iles, poly]) => {


//créer un dataset avec toutes les données à cartographier
    var dataMONA = [];

    iles.forEach(i => {
        i.typeMONA = "art"
        if (i.title_fr =="")
            i.title = {fr: i.address}
        else 
            i.title = {fr: i.title_fr}
        i.artists = [i.artistes]
        i.produced_at = String(i.produced_at)
        i.categories ={
            fr: [i.categories_fr]
        }
        var geoloc = i.geoloc.split(",")
        i.location = { lat: geoloc[0], lng: geoloc[1] }
        dataMONA.push(i)
    })

    console.log(dataMONA)

    
    map(geo, routes, poly, dataMONA);

  }).catch(function(error) {
    console.log(error);
  });


