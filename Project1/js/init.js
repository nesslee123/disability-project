let mapOptions = {'centerLngLat': [-118.4472777,34.0709459],'startingZoomLevel':15}

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/d1f6ba12-c4ca-499f-87bb-f45230f2601d/style.json?key=DgAnlcsmXGhaJHJVy0LQ',
    center: mapOptions.centerLngLat,
    zoom: mapOptions.startingZoomLevel
});

let locationsArray = [];
let allData = [];
function countLocation(data){
    let location = data["Based on your answer above, choose a region on campus that makes you feel this way."];
    let accessibility = data["How would you describe your overall feelings regarding accessibility on UCLA's campus? "];
    console.log(accessibility);
    // How would you describe your overall feelings regarding accessibility on UCLA's campus? 
    // we are going to create an array of objects, where location is the key
    // and then if the location exists, we will add one to the count
    // and if it doesn't exist we will add the new key
    let locationExists = false;

    // Loop through the array to find the location using .forEach()
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

            // If location exists, increment the count
            item.totalResponses += 1;
            locationExists = true;
        }
    });

    // If location does not exist, add a new object with count 1
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

function addMarker(data) {
    let longitude = data['lng'];
    let latitude = data['lat'];
    let accessibleLocation = data["What location on UCLA's campus do you find most accessible?"];
    let cleanedLocation = accessibleLocation.toLowerCase().trim().replace(" ", "");
    console.log("not cleaned is: ", accessibleLocation, "and cleaned is ", cleanedLocation);
    // probably you want to use the location that you set in the survey (north, south campus, the hill, etc.)
    countLocation(cleanedLocation);

    let barrierFaced = data["Can you remember a situation where you faced a barrier to accessibility on UCLA's campus? "];
    let whyAccessible = data['Why do you feel this way?    '];
    let describeBarrier = data['Can you please describe the barrier you faced? '];
    let accessView = data["Do you feel as if this barrier affects your view of UCLA's campus being accessible?"];
    let describeView = data['Why do you feel this way? '];
    let disability = data['How would you describe your mobile disability/impairment? '];
    let category = barrierFaced == "Yes" ? "FacedBarrier" : "NoBarrierFaced";
    let popup_message;
    if (barrierFaced == "Yes"){
        popup_message = `<h2>Most Accessible Location On Campus: ${accessibleLocation}</h2> <p>Why Do You Feel This Is The Most Accessible Location?: ${whyAccessible}</p> <h3>Barrier Faced On Campus: ${describeBarrier}</h3> <h4>Does this barrier affect your view of campus accessibility?: ${accessView}</h4> <p>Why Do You Feel This Affects Your View?: ${describeView}</p> <h5>How would you describe your mobile disability/impairment?: ${disability}</h5>`
    }
    else{
        popup_message = `<h2>Most Accessible Location On Campus: ${accessibleLocation}</h2> <p>Why Do You Feel This Is The Most Accessible Location?: ${whyAccessible}</p> <h3>Currently, Have Not Faced A Barrier On Campus</h3> <h4>How would you describe your mobile disability/impairment?: ${disability}</h4>`
    }

    const newMarkerElement = document.createElement('div');

    newMarkerElement.className = `marker marker-${category}`;
    
    new maplibregl.Marker({element:newMarkerElement})
            .setLngLat([longitude, latitude])
            .setPopup(new maplibregl.Popup()
                .setHTML(popup_message))
            .addTo(map)
        createButtons(latitude,longitude,accessibleLocation);       
}

function createButtons(lat,lng,title){
    if (!title){
        return;
    }

    const newButton = document.createElement("button");
    newButton.id = "button"+title; 
    newButton.innerHTML = title;
    newButton.setAttribute("lat",lat);
    newButton.setAttribute("lng",lng);
    newButton.addEventListener('click', function(){
        map.flyTo({
            center: [lng,lat],
        })
    })
    document.getElementById("contents").appendChild(newButton);
}

function createCards(data){
    console.log('creating cards');
    document.getElementById("contents").innerHTML = "";
    data.forEach(item => {
        const newCard = document.createElement("div");
        newCard.className = "card";
        newCard.innerHTML = `<h2>${item[`Timestamp`]}</h2>`;
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
            // 1. get all the current survey data
           processData(results.data);
        }
    });
    // wait for the process to finish
    locationsArray.forEach(location => {
        console.log('location.location');
        console.log(location.location);
    });    
});



function processData(results) {
    results.forEach(data => {
        countLocation(data)
        allData.push(data);
    })
}

function getColor(location){
    let positive = location.positiveResponses || 0;
    let neutral = location.neutralResponses || 0;
    let negative = location.negativeResponses || 0;
    
    // if the value is positive, return green
    if (positive >= neutral && positive >= negative){
        return "#00FF00";
    }
    // if the value is mostly neutral, return yellow
    else if (neutral >= positive && neutral >= negative){
        return "#FFFF00";
    }
    // if the value is mostly negative, return red
    else if (negative >= positive && negative >= neutral){
        return "#FF0000";
    }
    // this default color
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

    // this will be the final colors of the polygons
    let locationColors = {};
    // THIS IS WHERE IT SEPaRATES
    locationsArray.forEach(location => assignColorForLocations(location));
    locationsArray.forEach(location => {
        locationColors[location.location] = getColor(location);
    });
    
    let locationColorPairs = Object.entries(locationColors).flat();

    // this will the polygon all one color! BOOO!
    // you need to you fill-it (paint) with the counts
    // from locations in the `locationsArray`
    map.addLayer({
        'id': 'polygon',
        'type': 'fill',
        'source': 'polygon',
        'layout': {},
        'paint': {
            'fill-color': [
                'match',
                ['get', 'location'], // Assuming 'location' is a property in your GeoJSON features
                ...locationColorPairs,
                '#888888' // Default color if no match is found
            ],
            'fill-opacity': 0.5
        }
    });
    map.on('click','polygon', function(event){
        const properties = event.features[0].properties;
        // what is the location that was clicked?
        let clickedLocation = properties.location;
        let clickedLocationData = allData.find(location => location['Based on your answer above, choose a region on campus that makes you feel this way.'] == clickedLocation);
        createCards([clickedLocationData]);

        new maplibregl.Popup()
            .setLngLat(event.lngLat)
            .setHTML(`<h2>${properties.location}</h2>`)
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

function createCheckboxForCategory (category,filterGroup) {
    const container = document.createElement('div');
    container.style.display = 'grid';
    container.style.gridTemplateColumns ='auto auto 1fr';
    container.style.alignItems = 'center';
    container.style.gap = '8px';

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = category;
    input.checked = true;

    const label = document.createElement('label');
    label.setAttribute('for', category);
    label.textContent = category;

    const markerLegend = document.createElement('div');
    markerLegend.className = `marker marker-${category}`;

    container.appendChild(input);
    container.appendChild(label);
    container.prepend(markerLegend);

    filterGroup.appendChild(container);

    input.addEventListener('change', function(event) {
        toggleMarkersVisibility(category, event.target.checked);
    });
}

function createFilterUI() {
    const categories = ["FacedBarrier", "NoBarrierFaced"];
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
},2000);

function runTheLoopOnTimeout(){
    fetch("campusucla.geojson")
        .then(response => response.json())
        .then(data => {
            // 2. style the polygon with the survey data
            
            processPolygon(data);
    });
}