// This module manages map rendering + attraction list UX.
const DEFAULT_ATTRACTION_TYPE = 'tourism.sights';

let map;
let cityMarker;
let attractionLayer;
let currentLocation;

const attractionTypeEl = document.getElementById('attractionType');
const attractionsStatusEl = document.getElementById('attractionsStatus');
const attractionsListEl = document.getElementById('attractionsList');

// Wait for weather.js to resolve the destination coordinates.
window.addEventListener('wanderlite:location-ready', async (event) => {
  currentLocation = event.detail;
  initializeMap(currentLocation);
  await loadAttractions(currentLocation.lat, currentLocation.lon, attractionTypeEl.value);
});

// React to attraction category changes without reloading the page.
attractionTypeEl.addEventListener('change', async () => {
  if (!currentLocation) return;
  await loadAttractions(currentLocation.lat, currentLocation.lon, attractionTypeEl.value);
});

/**
 * Initialize map only once and refresh city marker as needed.
 * @param {{city:string,country:string,lat:number,lon:number}} location
 */
function initializeMap(location) {
  if (!map) {
    map = L.map('map', { zoomControl: true }).setView([location.lat, location.lon], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    attractionLayer = L.layerGroup().addTo(map);
  } else {
    map.setView([location.lat, location.lon], 12);
  }

  if (cityMarker) {
    cityMarker.remove();
  }

  cityMarker = L.marker([location.lat, location.lon])
    .addTo(map)
    .bindPopup(`${location.city}, ${location.country}`)
    .openPopup();
}

/**
 * Fetch attractions from backend and render map/list states.
 * @param {number} lat
 * @param {number} lon
 * @param {string} category
 */
async function loadAttractions(lat, lon, category = DEFAULT_ATTRACTION_TYPE) {
  try {
    attractionsStatusEl.textContent = 'Loading curated attractions...';
    attractionsStatusEl.classList.remove('is-error');
    attractionsListEl.innerHTML = '';

    const query = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      category,
      limit: '8'
    });

    const response = await fetch(`/api/attractions?${query.toString()}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || payload.details || 'Attractions are currently unavailable.');
    }

    attractionLayer.clearLayers();

    if (!payload.items.length) {
      attractionsStatusEl.textContent = 'No attractions found for this category. Try another filter.';
      attractionsListEl.innerHTML = '<li class="placeholder">No places to show yet.</li>';
      return;
    }

    payload.items.forEach((item) => {
      const marker = L.marker([item.lat, item.lon]).bindPopup(`<strong>${item.name}</strong><br/>${item.address}`);
      attractionLayer.addLayer(marker);
    });

    attractionsListEl.innerHTML = payload.items.map((item) => {
      const distance = item.distanceMeters ? `${Math.round(item.distanceMeters)} m away` : 'Distance unavailable';
      const mapLink = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`;

      return `
        <li class="attraction-card">
          <div>
            <h4>${item.name}</h4>
            <p>${item.address}</p>
            <small>${distance}</small>
          </div>
          <div class="attraction-actions">
            <button class="ghost-btn" data-lat="${item.lat}" data-lon="${item.lon}">View on map</button>
            <a class="ghost-link" href="${mapLink}" target="_blank" rel="noopener noreferrer">Open in Maps</a>
          </div>
        </li>
      `;
    }).join('');

    const provider = payload.provider ? ` via ${payload.provider}` : '';
    attractionsStatusEl.textContent = `${payload.count} attractions found${provider}.`;
  } catch (error) {
    attractionsStatusEl.textContent = `${error.message} Try switching category or searching another nearby city.`;
    attractionsStatusEl.classList.add('is-error');
    attractionsListEl.innerHTML = '<li class="placeholder">Could not load attractions right now.</li>';
    console.error('Attractions loading failed:', error);
  }
}

// Delegate click events for dynamically-rendered attraction map buttons.
attractionsListEl.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-lat][data-lon]');
  if (!button || !map) return;

  const lat = Number(button.dataset.lat);
  const lon = Number(button.dataset.lon);
  map.setView([lat, lon], 16, { animate: true });
});

