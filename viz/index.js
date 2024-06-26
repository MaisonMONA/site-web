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
    }
    else if (d.typeMONA == "lieu"){

        title = d.title;
        contenu = `
                  <p>${d.category.fr}</p>
                  <p>${d.description}</p>`
  
    }
    else if (d.typeMONA == "patrimoine"){
        
        title = d.title;
        contenu = ` <p>${d.functions.fr}</p>
                    <p>${d['sous-usages']}</p>
                    <p>${d.territory}</p>
                    <a href="${d.url? d.url : ""}" target="_blank">rpcq</a>
                  <p>${d.description}</p>
                  <p>${d.synthesis}</p>`
    }
  
  
    d3.select("#info").html(`
      <h3 style="background-color: ${color(d.typeMONA)}">${title}</h3>
      <code>${contenu}</code>
    `)
  }

function map (geoMTL, geobaseMTL, dataM){

    proj.center([-73.5878, 45.5088]) // Center on Montreal
        .scale(1000)
        .fitSize([width, height], geoMTL);

    path.projection(proj);

/*

//layer arrondissements MTL
    container.selectAll("path")
        .data(geoMTL.features)
        .enter().append("path")
        .attr("d", d => path(d))
        .attr('stroke', 'grey')
        .attr('fill', 'none')      
/*       
//layer municipalités QC

    container.selectAll("path")
    .data(geoQC.features)
    .enter().append("path")
    .attr("d", d => path(d))
    .attr('stroke', 'grey')
    .attr('fill', 'none')      
*/
//layer réseau routier MTL
    container.selectAll("path")
        .data(geobaseMTL.features)
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
        .attr("r", "3px")
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
    d3.json('../data/MTLarrondissements.geojson'),
    d3.json('../data/MTLgeobase.json'),
    d3.json('../data/artworks_v3_2022-07-23.json'),
    d3.json('../data/places_2022-07-08.json'),
    d3.json('../data/heritages_2022-07-08.json'),
    d3.json('https://picasso.iro.umontreal.ca/~mona/api/badges'),
  ]).then(([geomtl, geobasemtl, art, lieu, pat, badges]) => {

console.log(badges)
//créer un dataset avec toutes les données à cartographier
    var dataMONA = [];

    console.log("exemple lieu", lieu[0])
    console.log("exemple art", art[0])
    console.log("exemple patrimoine", pat[0])
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


