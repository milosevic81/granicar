
const nominatimSearch = 'https://nominatim.openstreetmap.org/search';

async function getCountryFromAddress(address) {
    const queryParams = new URLSearchParams({
        q: address,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        'accept-language': 'en', // Change 'en' to your preferred language code
    });

    try {
        const response = await fetch(`${nominatimSearch}?${queryParams}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Granicar/1.0 (admin@granicar.com)', // TODO app's name and email
                'Referer': 'https://granicar.com', // TODO website or app URL if applicable
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.length === 0) {
            throw new Error('No results found for the provided address.');
        }

        const country = data[0]?.address?.country || 'Country not found';
        return country;
    } catch (error) {
        console.error('Error fetching country data:', error);
        return 'Error retrieving country';
    }
}


const coordinatesCache = {};
async function getCoordinates(location) {
    
    if (location.lat && location.lon) {
        return {
            lat: location.lat,
            lon: location.lon
        };
    }
    
    if (coordinatesCache[location]) {
        return coordinatesCache[location];
    }

    console.log(`Look for location: ${location}`);
    const coordinates = await getCoordinatesOsm(location);
    coordinatesCache[location] = coordinates;
    return coordinates;
}

async function getCoordinatesOsm(location) {
    const geocodeUrl = nominatimSearch + `?q=${encodeURIComponent(location)}&format=json&limit=1`;

    try {
        const response = await fetch(geocodeUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data && data.length > 0) {

            console.log(`Locations for ${location}: ${data[0].lat}, ${data[0].lon}`);
            const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${data[0].lat},${data[0].lon}`;
            console.log(`Google Maps link for ${location}: ${googleMapsLink}`);

            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        } else {
            throw new Error(`No coordinates found for location: ${location}`);
        }
    } catch (error) {
        console.error('Error fetching coordinates from OSM:', error);
        throw error;
    }
}

async function getRouteEstimateOsm(locations) {
    if (locations.length < 2) {
        throw new Error('At least two locations are required');
    }

    try {
        const coordinatesPromises = locations.map(location => getCoordinates(location));
        const coordinates = await Promise.all(coordinatesPromises);

        const coordinatesString = coordinates.map(coord => `${coord.lon},${coord.lat}`).join(';');
        const osmUrl = `https://router.project-osrm.org/route/v1/driving/${coordinatesString}?overview=false`;

        const response = await fetch(osmUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        if (data && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                distance: formatDistance(route.distance), // formatted distance
                duration: formatDuration(route.duration)  // formatted duration
            };
        } else {
            throw new Error('No route found');
        }
    } catch (error) {
        console.error('Error fetching route from OSM:', error);
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
