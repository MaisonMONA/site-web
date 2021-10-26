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
const color = d3.scaleOrdinal(["art", "lieu", "patrimoine", "autre"], ["#FBE900", "#B4B7DD", "#E97FC8", "#010202"]) 

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
        .attr("r", "3px")
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
    //d3.json('https://picasso.iro.umontreal.ca/~mona/api/artworks'),
    //d3.json('https://picasso.iro.umontreal.ca/~mona/api/places'),
    //d3.json('https://data.montreal.ca/dataset/41fcc790-e328-44be-bcbf-73556fa0bc32/resource/b0a6cfa4-ad77-4f5b-bd1b-050fe233a31f/download/patrimoinelpc.geojson'),
    d3.json('https://data.montreal.ca/dataset/00bd85eb-23aa-4669-8f1b-ba9a000e3dd8/resource/e9b0f927-8f75-458c-8fda-b5da65cc8b73/download/limadmin.geojson'),
    d3.json('../data/artworks.json'),
    d3.json('../data/places.json'),
    d3.json('../data/patrimoine-centroid.geojson')
  ]).then(([geomtl, art, lieu, pat]) => {


//créer un dataset avec toutes les données à cartographier
    var dataMONA = [];

    console.log(lieu.data[0])
    console.log(art.data[0])
    console.log(pat.features[0])
    lieu.data.shift();

    art.data.forEach(a => {
        a.typeMONA = "art"
        dataMONA.push(a)
    });

    lieu.data.forEach(l => {
        l.typeMONA = "lieu"
        dataMONA.push(l)
    });  
    
    const startid = dataMONA.length
    var i = 1;

    //normalisation des données externes
    pat.features.forEach(p => {
        p.id = startid + i;
        p.title = p.properties.Nom;
        p.location = {
            lat: p.geometry.coordinates[1],
            lng: p.geometry.coordinates[0]
        }
        p.category = {
            fr: "patrimoine - ville de Montréal",
            en: "Montreal city heritage"
        };    
        p.typeMONA = "patrimoine";

        dataMONA.push(p)
        i++;
    })
    console.log(dataMONA)

    map(geomtl, dataMONA);

  }).catch(function(error) {
    console.log(error);
  });


