document.getElementById('generate').addEventListener('click', generateLinks);

async function generateLinks() {
  const locationA = document.getElementById('locationA').value;
  const locationB = document.getElementById('locationB').value;
  const travelDirection = document.querySelector('input[name="travel-direction"]:checked').value;

  if (!locationA || !locationB) {
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

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    thead.innerHTML = `
      <tr>
        <th>From</th>
        <th>Via</th>
        <th>To</th>
        <th>Countries</th>
        <th>Distance</th>
        <th>Duration</th>
        <th>Link</th>
      </tr>
    `;

    for (const crossing of crossings) {
      const link = travelDirection === 'direction-a-b'
        ? generateGoogleMapsLink(locationA, locationB, crossing.map)
        : generateGoogleMapsLink(locationB, locationA, crossing.map);

      const estimate = await getRouteEstimateOsm([locationA, crossing.map, locationB]);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${locationA}</td>
        <td>${crossing.name}</td>
        <td>${locationB}</td>
        <td>${countryKey}</td>
        <td>${estimate.distance}</td>
        <td>${estimate.duration}</td>
        <td><a href="${link}" target="_blank">Link</a></td>
      `;
      tbody.appendChild(row);
    }

    table.appendChild(thead);
    table.appendChild(tbody);
    linksContainer.appendChild(table);
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
