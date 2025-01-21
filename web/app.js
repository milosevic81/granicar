document.getElementById('generate').addEventListener('click', generateLinks);

async function generateLinks() {
  const from = document.getElementById('from').value;
  const to = document.getElementById('to').value;
  const travelDirection = document.querySelector('input[name="travel-direction"]:checked').value;
  const neighboringCountry = document.getElementById('neighboring-countries').value;

  if (!from || !to || !neighboringCountry) {
    alert('Please fill in all inputs and make a selection.');
    return;
  }

  const borderCrossings = await fetchBorderCrossings();

  const linksContainer = document.getElementById('links');
  linksContainer.innerHTML = '';

  const countryKey = travelDirection === 'from-serbia' 
    ? `Srbija-${neighboringCountry}` 
    : `${neighboringCountry}-Srbija`;

  const crossings = borderCrossings[countryKey];
  if (crossings) {
    crossings.forEach(crossing => {
      const link = generateGoogleMapsLink(from, to, crossing.map);
      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.textContent = `Route via ${crossing.name} (${countryKey})`;
      linksContainer.appendChild(anchor);
    });
  } else {
    const message = document.createElement('p');
    message.textContent = `No border crossings available for ${countryKey}.`;
    linksContainer.appendChild(message);
  }
}

function generateGoogleMapsLink(from, to, crossing) {
  const base = 'https://www.google.com/maps/dir/';
  return `${base}${encodeURIComponent(from)}/${encodeURIComponent(crossing)}/${encodeURIComponent(to)}`;
}

async function fetchBorderCrossings() {
  try {
    const response = await fetch('border_crossings.json');
    if (!response.ok) {
      throw new Error('Failed to load border crossings data.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching border crossings:', error);
    return {};
  }
}
