const MAPBOX_TOKEN = 'pk.eyJ1IjoibWlsb3NldmljODEiLCJhIjoiY202ZTF1ZnJjMHplZTJrc29jdnZhcGYwcSJ9.mGrg9ErRCh2YuyBwwBPn0Q';
mapboxgl.accessToken = MAPBOX_TOKEN;

const INITIAL_CENTER = [20.4568, 44.8178];
const INITIAL_ZOOM = 12;

let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
});

async function displayRoute(routeName, locations) {
    console.log(`Displaying route: ${routeName} - ${locations}`);

    const waypoints = locations.join(';');
    const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!data.routes.length) {
            alert('No route found.');
            return;
        }

        const routeGeometry = data.routes[0].geometry;
        addRouteLayer(routeName, routeGeometry);
        fitMapToRoute(routeGeometry);
    } catch (error) {
        console.error('Error fetching route:', error);
    }
}

function addRouteLayer(routeName, geometry) {
    const lineColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    
    map.addLayer({
        id: routeName,
        type: 'line',
        source: { type: 'geojson', data: geometry },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': lineColor, 'line-width': 4 },
    });

    document.getElementById(routeName)?.addEventListener('change', (event) => {
        map.setLayoutProperty(routeName, 'visibility', event.target.checked ? 'visible' : 'none');
    });
}

function fitMapToRoute(geometry) {
    const bounds = geometry.coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(geometry.coordinates[0], geometry.coordinates[0])
    );
    map.fitBounds(bounds, { padding: 20 });
}

function resetMap() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: INITIAL_CENTER,
        zoom: INITIAL_ZOOM,
    });
}

async function getCountryFromAddress(address) {
    const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!data.features.length) throw new Error('No results found for the provided address.');

    return data.features[0].context.find(ctx => ctx.id.includes('country'))?.text || 'Country not found';
}

const coordinatesCache = {};
async function getCoordinatesCached(location) {
    if (location.lat && location.lon) return [location.lon, location.lat];
    if (coordinatesCache[location]) return coordinatesCache[location];

    console.log(`Fetching coordinates for: ${location}`);
    const coordinates = await getCoordinates(location);
    coordinatesCache[location] = coordinates;
    return coordinates;
}

async function getCoordinates(location) {
    const apiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    return data.features[0]?.center || null;
}

async function getRouteEstimate(locations) {
    if (locations.length < 2) throw new Error('At least two locations are required');
    
    try {
        const coordinates = await Promise.all(locations.map(getCoordinatesCached));
        const waypoints = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
        const apiUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?access_token=${MAPBOX_TOKEN}&overview=false`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        if (data.routes.length === 0) throw new Error('No route found');
        
        const route = data.routes[0];
        return {
            distance: formatDistance(route.distance),
            duration: formatDuration(route.duration),
            route: waypoints
        };
    } catch (error) {
        console.error('Error fetching route from Mapbox:', error);
        throw error;
    }
}

function formatDistance(distance) {
    return distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`;
}

function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm' : ''}`;
}
