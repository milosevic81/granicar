document.getElementById('generate').addEventListener('click', generateLinks);

async function generateLinks() {

  clearRoutes();
  const locationA = document.getElementById('locationA').value;
  const locationB = document.getElementById('locationB').value;
  const travelDirection = document.querySelector('input[name="travel-direction"]:checked').value;

  if (!locationA || !locationB) {
    alert('Please fill in all inputs.');
    return;
  }

  const linksContainer = document.getElementById('links');
  linksContainer.innerHTML = '';

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
      <th>Show</th>
    </tr>
  `;

  table.appendChild(thead);
  table.appendChild(tbody);
  linksContainer.appendChild(table);

  const countryA = await getCountryFromAddress(locationA);
  const countryB = await getCountryFromAddress(locationB);

  const countryKey = travelDirection === 'direction-a-b'
    ? `${countryA}-${countryB}`
    : `${countryB}-${countryA}`;

  const crossings = borderCrossings[countryKey];
  if (crossings) {
    for (const crossing of crossings) {
      const link = travelDirection === 'direction-a-b'
        ? generateGoogleMapsLink(locationA, locationB, crossing)
        : generateGoogleMapsLink(locationB, locationA, crossing);
      const routeName = `${locationA}-${crossing.name}-${locationB}`;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${locationA}</td>
        <td>${crossing.name}</td>
        <td>${locationB}</td>
        <td>${countryKey}</td>
        <td>Loading...</td>
        <td>Loading...</td>
        <td><a href="${link}" target="_blank">Link</a></td>
        <td><input type="checkbox" id="${routeName}" checked></td>
      `;
      tbody.appendChild(row);

      getRouteEstimate([locationA, crossing, locationB]).then(estimate => {
        row.cells[4].textContent = estimate.distance;
        row.cells[5].textContent = estimate.duration;
        displayRoute(routeName, estimate.route);
      }).catch(error => {
        row.cells[4].textContent = 'Error';
        row.cells[5].textContent = 'Error';
      });
    }
  } else {
    const message = document.createElement('p');
    message.textContent = `No border crossings available for ${countryKey}.`;
    linksContainer.appendChild(message);
  }
}

function generateGoogleMapsLink(from, to, crossing) {
  const base = 'https://www.google.com/maps/dir/';
  const route = `${base}${encodeURIComponent(from)}/${crossing.lat},${crossing.lon}/${encodeURIComponent(to)}`;
  return route;
}
