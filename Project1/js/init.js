let mapOptions = {'centerLngLat': [-118.446743,34.072571],'startingZoomLevel':14}

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/d1f6ba12-c4ca-499f-87bb-f45230f2601d/style.json?key=DgAnlcsmXGhaJHJVy0LQ',
    center: mapOptions.centerLngLat,
    zoom: mapOptions.startingZoomLevel
});

let locationsArray = [];
let allData = [];

function summarizeResponses(){
    let summarizedData = {"Positive": 0, "Neutral": 0, "Negative": 0};
    locationsArray.forEach(location => {
        summarizedData["Positive"] += location.positiveResponses;
        summarizedData["Neutral"] += location.neutralResponses;
        summarizedData["Negative"] += location.negativeResponses;
    });
    return summarizedData; 
}
function addChart(){
    const xValues = ["Positive Responses", "Negative Responses", "Neutral Responses"]
    const yValues = [summarizedData.Positive, summarizedData.Negative, summarizedData.Neutral];
    const barColors = ["green", "red", "yellow"];


new Chart("myChart", {
  type: "pie",
  data: {
    labels: xValues,
    datasets: [{
      backgroundColor: barColors,
      data: yValues
    }]
  },
  options: {
    legend: {display: false},
    title: {
      display: true,
      text: "Students' Sentiment Toward Campus Accessibility"
    },
    hover: {mode: null}
    }
});
}

function countLocation(data){
    let location = data["Based on your answer above, choose a region on campus that makes you feel this way."];
    let accessibility = data["How would you describe your overall feelings regarding accessibility on UCLA's campus? "];
    console.log(accessibility);
    let locationExists = false;
    
    locationsArray.forEach(item => {
        if (item.location === location) {
            if (accessibility == "Positive"){
                item.positiveResponses += 1;
            }
            else if (accessibility == "Neutral"){
                item.neutralResponses += 1;
            }
            else if (accessibility == "Negative"){
                item.negativeResponses += 1;
            }

            item.totalResponses += 1;
            locationExists = true;
        }
    });

    if (!locationExists) {
        let newLocation = { location: location, positiveResponses: 0, neutralResponses: 0, negativeResponses: 0, totalResponses: 1 };
        if (accessibility == "Positive"){
            newLocation.positiveResponses += 1;
        }
        else if (accessibility == "Neutral"){
            newLocation.neutralResponses += 1;
        }
        else if (accessibility == "Negative"){
            newLocation.negativeResponses += 1;
        }
        locationsArray.push(newLocation);
    }
    console.log(locationsArray);
}

function createCards(data){
    console.log('creating cards');
    document.getElementById("contents").innerHTML = "";
    data.forEach(item => {
        console.log(item)
        const newCard = document.createElement("div");
        newCard.className = "card";
        newCard.innerHTML = `<h4>Mobile disability/impairment:</h4>
                            <p>${item[`How would you describe your mobile disability/impairment? `]}</p>
                            <h4>How would you describe your overall feelings regarding accessibility on UCLA\'s campus?</h4>
                            <p>${item[`How would you describe your overall feelings regarding accessibility on UCLA\'s campus? `]}</p>
                            <h4>Explain why:</h4>
                            <p>${item[`Explain why this region makes you feel this way.`]}</p>`;
                             
        ;
        document.getElementById("contents").appendChild(newCard);
    }
    )
}

const dataUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSfnuIWnPJ3APbwzIBZ5HzkL0l1hyyYxOFj2MExy1iu4cr0nS-Q8zLtVk34b0XMumRCuUvzc1Wav9HZ/pub?output=csv"

map.on('load', function() {
    createFilterUI();
    Papa.parse(dataUrl, {
        download: true, 
        header: true, 
        complete: function(results) {
           processData(results.data);
        }
    });
    locationsArray.forEach(location => {
        console.log('location.location');
        console.log(location.location);
    });    
});

let summarizedData;

function processData(results) {
    results.forEach(data => {
        countLocation(data)
        allData.push(data);
        summarizedData = summarizeResponses();
        addChart();
    })
}

function getColor(location){
    let positive = location.positiveResponses || 0;
    let neutral = location.neutralResponses || 0;
    let negative = location.negativeResponses || 0;
    
    if (positive >= neutral && positive >= negative){
        return "#00FF00";
    }
    else if (neutral >= positive && neutral >= negative){
        return "#FFFF00F";
    }
    else if (negative >= positive && negative >= neutral){
        return "#FF0000";
    }
    else{
        return "#000000";
    }
}

function assignColorForLocations(location){
    console.log("hey this location is: ", location);
};

function processPolygon(results){
    map.addSource('polygon', {
        'type': 'geojson',
        'data': results
    });

    let locationColors = {};
    locationsArray.forEach(location => assignColorForLocations(location));
    locationsArray.forEach(location => {
        locationColors[location.location] = getColor(location);
    });
    
    let locationColorPairs = Object.entries(locationColors).flat();

    map.addLayer({
        'id': 'polygon',
        'type': 'fill',
        'source': 'polygon',
        'layout': {},
        'paint': {
            'fill-color': [
                'match',
                ['get', 'location'], 
                ...locationColorPairs,
                '#888888' 
            ],
            'fill-opacity': 0.5
        }
    });
    map.on('click','polygon', function(event){
        hideChart()
        const properties = event.features[0].properties;
        let clickedLocation = properties.location;
        let clickedLocationData = allData.filter(location => location['Based on your answer above, choose a region on campus that makes you feel this way.'] == clickedLocation);
        createCards(clickedLocationData);
        leftcontent.style.display = "block";
        let locationDescription = getLocationDescription(clickedLocation);
        let readableDataObject = getReadableLocationData(clickedLocation);
        let countMessages = ` Positive Responses: ${readableDataObject["Positive Responses"]},<br>Negative Responses: ${readableDataObject["Negative Responses"]},<br>Neutral Responses: ${readableDataObject["Neutral Responses"]}`
        let message = `<h1>${clickedLocation}</h1><h2 style="background-color:white,color:black">${countMessages}</h2> <p style="background-color:white,color:black"> ${locationDescription}</p>`
        new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(message)
            .addTo(map);
    })
    
    map.on('mouseenter', 'polygon', function() {
        map.getCanvas().style.cursor = 'pointer';
    }
    );
    map.on('mouseleave', 'polygon', function() {
        map.getCanvas().style.cursor = '';
    });
};

function hideChart(){
    document.getElementById("myChart").style.display = "none";
}

function showChart(){
    document.getElementById("myChart").style.display = "block";
    document.getElementById("leftcontent").style.display = "none";
}

const locationDescription = {
    "The Hill":"This area of campus is frequented by students going to the dorms and dining halls on campus.",
    "North Campus":"This area of campus is frequented by students taking social science and humanities classes.",
    "South Campus":"This area of campus is frequented by students taking physical and life science classes.",

}

let readableLocationsKeys = {
    "positiveResponses": "Positive Responses",
    "neutralResponses": "Neutral Responses",
    "negativeResponses": "Negative Responses",
}

function getReadableLocationData(location){
    let readableLocationData = {"Positive Responses": 0, "Neutral Responses": 0, "Negative Responses": 0};
    console.log(location);
    let alllocation = locationsArray.filter(thislocation => thislocation.location == location);
    let thisLocation = alllocation[0];
    console.log(thisLocation);
    if (thisLocation.positiveResponses){
        readableLocationData["Positive Responses"] = thisLocation.positiveResponses;
    }
    if (thisLocation.neutralResponses){
        readableLocationData["Neutral Responses"] = thisLocation.neutralResponses;
    }
    if (thisLocation.negativeResponses){
        readableLocationData["Negative Responses"] = thisLocation.negativeResponses;
    }
    
    console.log(readableLocationData);
    return readableLocationData;
}
function getLocationDescription(location){
    return locationDescription[location];
}

function createCheckboxForCategory (category, filterGroup) {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'auto 1fr';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    const label = document.createElement('label');
    label.textContent = category;
    const markerLegend = document.createElement('div');
    markerLegend.className = `marker marker-${category}`;
    container.appendChild(markerLegend);
    container.appendChild(label);
    filterGroup.appendChild(container);
}

function createFilterUI() {
    const categories = ["Negative", "Positive", "Neutral"];
    const filterGroup = document.getElementById('filter-group') || document.createElement('div');
    filterGroup.setAttribute('id', 'filter-group');
    filterGroup.className = 'filter-group';
    document.getElementById("legend").appendChild(filterGroup);
    categories.forEach(category => {
        createCheckboxForCategory(category, filterGroup);
    });
}

function toggleMarkersVisibility(category, isVisible) {
    const markers = document.querySelectorAll(`.marker-${category}`);
    markers.forEach(marker => {
        marker.style.display = isVisible ? '' : 'none';
    });
}

setTimeout(() =>{
    runTheLoopOnTimeout();
},2500);

function runTheLoopOnTimeout(){
    fetch("campusucla.geojson")
        .then(response => response.json())
        .then(data => {            
            processPolygon(data);
    });
}

let modal = document.getElementById("myModal");
let btn = document.getElementById("myBtn");
let span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
    modal.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function() {
    modal.style.display = "block";
});

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

