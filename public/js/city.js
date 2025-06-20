// OpenCage API Key for geocoding city names
const apiKey = '623b34626fdb4f8a87ef67595adb4c6c';
// Geoapify API Key for fetching attractions
const geoapifyKey = '7f76114dce444a039689d479242acf5b';
// Get city name from URL query parameters
const params = new URLSearchParams(window.location.search);
const city = params.get('city');


// Log to help with debugging
console.log("City JS is running...");
console.log("City:", city);

// Default attraction type for initial load
const DEFAULT_ATTRACTION_TYPE = 'tourism.sights';
let map; // Leaflet map instance


// Set up event listener for attraction type dropdown
// When user selects a new type, fetch new attractions for the current map center
document.addEventListener('DOMContentLoaded', () => {
  const selector = document.getElementById('attractionType');
  if (selector) {
    selector.addEventListener('change', () => {
      const selectedType = selector.value;
      if (map) {
        const center = map.getCenter();
        fetchAttractions(center.lat, center.lng, selectedType);
      }
    });
  }
});

async function fetchLocation(city) {
  try {
    // Fetch city coordinates from OpenCage API
    const res = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(city)}&key=${apiKey}`);
    const data = await res.json();
    const result = data.results[0];

    if (result) {
      const lat = result.geometry.lat;
      const lng = result.geometry.lng;

      // Display city info above the map
      document.getElementById('result').innerHTML = `
        <p><strong>City:</strong> ${city}</p>
        <p><strong>Formatted Address:</strong> ${result.formatted}</p>
        <p><strong>Latitude:</strong> ${lat}</p>
        <p><strong>Longitude:</strong> ${lng}</p>
        <p><strong>Country:</strong> ${result.components.country}</p>
        <p><strong>Timezone:</strong> ${result.annotations.timezone.name}</p>
      `;

      // Initialize Leaflet map centered on city
      map = L.map('map').setView([lat, lng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '\u00a9 OpenStreetMap contributors'
      }).addTo(map);

      // Add marker for the city
      L.marker([lat, lng]).addTo(map).bindPopup(result.formatted).openPopup();

      // Fetch and display attractions for the city
      const selector = document.getElementById('attractionType');
      const initialType = selector?.value || DEFAULT_ATTRACTION_TYPE;
      fetchAttractions(lat, lng, initialType);
    } else {
      // No results found for city
      document.getElementById('result').innerHTML = `<p>No results found.</p>`;
    }
  } catch (err) {
    // Show error if fetch fails
    console.error(err);
    document.getElementById('result').innerHTML = `<p>Error fetching data: ${err.message}</p>`;
    document.getElementById('places').innerHTML = '';
  }
}

//fetch attractions 
async function fetchAttractions(lat, lon, category = DEFAULT_ATTRACTION_TYPE) {
  try {
    const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=circle:${lon},${lat},5000&limit=5&apiKey=${geoapifyKey}`;
    const res = await fetch(url);
    const data = await res.json();

    console.log("Geoapify response:", data);

    if (!data.features.length) throw new Error('No places found');

    // Clear existing markers 
    const html = data.features.map((f) => {
      const prop = f.properties;
      const attractionLat = f.geometry.coordinates[1];
      const attractionLon = f.geometry.coordinates[0];
      const popupContent = prop.name || 'Unnamed Attraction';

      L.marker([attractionLat, attractionLon])
        .addTo(map)
        .bindPopup(popupContent);

      return `
        <div style="margin-bottom: 10px;">
          <ul>
            <li>
              <a href="#" onclick="zoomToAttraction(${attractionLat}, ${attractionLon}); return false;" 
                 style="text-decoration:none; color:#007BFF;">
                ${popupContent}
              </a>
            </li>
          </ul>
        </div>`;
    }).join('');

    document.getElementById('places').innerHTML = `<h2>Top Attractions Nearby</h2>${html}`;
  } catch (err) {
    console.error(err);
    document.getElementById('places').innerHTML = `<p>Error loading attractions.</p>`;
  }
}

function zoomToAttraction(lat, lon) {
  map.setView([lat, lon], 16);
}

if (city) {
  fetchLocation(city);
} else {
  document.getElementById('result').innerHTML = `<p>No city provided.</p>`;
  document.getElementById('places').innerHTML = '';
}

