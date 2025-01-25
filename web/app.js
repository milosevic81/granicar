document.getElementById('generate').addEventListener('click', generateLinks);

async function generateLinks() {
  const locationA = document.getElementById('locationA').value;
  const locationB = document.getElementById('locationB').value;
  const travelDirection = document.querySelector('input[name="travel-direction"]:checked').value;

  if (!locationA || !locationB ) {
    alert('Please fill in all inputs.');
    return;
  }
  
  const linksContainer = document.getElementById('links');
  linksContainer.innerHTML = '';

  const countryA = await getCountryFromAddress(locationA);
  const countryB = await getCountryFromAddress(locationB);

  const countryKey = travelDirection === 'direction-a-b'
    ? `${countryA}-${countryB}` 
    : `${countryB}-${countryA}`;

  const crossings = borderCrossings[countryKey];
  if (crossings) {
    crossings.forEach(crossing => {
      const link = travelDirection === 'direction-a-b'
        ? generateGoogleMapsLink(locationA, locationB, crossing.map)
        : generateGoogleMapsLink(locationB, locationA, crossing.map);
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.textContent = `Route via ${crossing.name} (${countryKey})`;
      linksContainer.appendChild(anchor);
      // TODO get estimated duration and distance for route
    });
  } else {
    const message = document.createElement('p');
    message.textContent = `No border crossings available for ${countryKey}.`;
    linksContainer.appendChild(message);
  }
}

function generateGoogleMapsLink(from, to, crossing) {
  // const base = 'https://www.google.com/maps/dir/';
  // const base = 'maps://maps.google.com/maps/dir/';
  // return `${base}${encodeURIComponent(from)}/${encodeURIComponent(crossing)}/${encodeURIComponent(to)}`;  
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(to)}&waypoints=${encodeURIComponent(crossing)}`;  
}

async function getCountryFromAddress(address) {
  const baseUrl = 'https://nominatim.openstreetmap.org/search';
  const queryParams = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: '1',
      'accept-language': 'en', // Change 'en' to your preferred language code
  });

  try {
      const response = await fetch(`${baseUrl}?${queryParams}`, {
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


