
// const mapboxToken = 'pk.eyJ1IjoibWlsb3NldmljODEiLCJhIjoiY202ZTF1ZnJjMHplZTJrc29jdnZhcGYwcSJ9.mGrg9ErRCh2YuyBwwBPn0Q';
const mapboxToken = 'pk.eyJ1IjoibWlsb3NldmljODEiLCJhIjoiY202ZHU3OTZxMHc1YTJqcXFhZ3R2eGJzYSJ9.tMMTxXCNz2H5OVLoks72JA'; // DEV
mapboxgl.accessToken = mapboxToken;

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [20.4568, 44.8178], // Initial map center [longitude, latitude]
    zoom: 12,
});

async function displayRoute(name, locations) {

    console.log(`Display route: ${name} - ${locations}`);
    const waypoints = locations;
    const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();

    if (!data.routes.length) {
        alert('No route found.');
        return;
    }

    const route = data.routes[0].geometry;
    const lineColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    map.addLayer({
        id: name,
        type: 'line',
        source: {
            type: 'geojson',
            data: route,
        },
        layout: {
            'line-join': 'round',
            'line-cap': 'round',
        },
        paint: {
            'line-color': lineColor, //  '#ff7e5f',
            'line-width': 4,
        },
    });

    // Add checkbox event listener
    const checkbox = document.getElementById(name);
    checkbox.addEventListener('change', (event) => {
        map.setLayoutProperty(name, 'visibility', event.target.checked ? 'visible' : 'none');
    });

    // Fit the map to the route bounds
    const bounds = route.coordinates.reduce(
        (bounds, coord) => bounds.extend(coord),
        new mapboxgl.LngLatBounds(route.coordinates[0], route.coordinates[0])
    );
    map.fitBounds(bounds, { padding: 20 });
}

function clearRoutes() {
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [20.4568, 44.8178], // Initial map center [longitude, latitude]
        zoom: 12,
    });
}

async function getCountryFromAddress(address) {
    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
        )}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();
    if (data.features.length === 0) {
        throw new Error('No results found for the provided address.');
    }

    const country = data.features[0].context.find(context => context.id.includes('country')).text;
    return country || 'Country not found';
}

const coordinatesCache = {};
async function getCoordinatesCached(location) {

    if (location.lat && location.lon) {
        return [location.lon, location.lat];
    }

    if (coordinatesCache[location]) {
        return coordinatesCache[location];
    }

    console.log(`Look for location: ${location}`);
    const coordinates = await getCoordinates(location);
    coordinatesCache[location] = coordinates;
    return coordinates;
}

async function getCoordinates(location) {
    const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            location
        )}.json?access_token=${mapboxgl.accessToken}`
    );
    const data = await response.json();
    return data.features[0]?.center || null;
}

async function getRouteEstimate(locations) {
    if (locations.length < 2) {
        throw new Error('At least two locations are required');
    }

    try {
        const coordinatesPromises = locations.map(location => getCoordinatesCached(location));
        const coordinates = await Promise.all(coordinatesPromises);

        const coordinatesString = coordinates.map(coord => `${coord[0]},${coord[1]}`).join(';');
        const mapboxUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinatesString}?access_token=${mapboxToken}&overview=false`;

        const response = await fetch(mapboxUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                distance: formatDistance(route.distance), // formatted distance
                duration: formatDuration(route.duration),  // formatted duration
                route: coordinatesString
            };
        } else {
            throw new Error('No route found');
        }
    } catch (error) {
        console.error('Error fetching route from Mapbox:', error);
        throw error;
    }
}

function formatDistance(distance) {
    if (distance >= 1000) {
        return `${(distance / 1000).toFixed(2)} km`;
    } else {
        return `${distance} m`;
    }
}

function formatDuration(duration) {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);

    return `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'm' : ''}`;
}