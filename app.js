// Core modules and dependencies.
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env.
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

// External API keys are now kept server-side only.
const weatherApiKey = process.env.WEATHER_API_KEY;
const geoapifyApiKey = process.env.GEOAPIFY_API_KEY;
const hasValidGeoapifyKey = /^[a-f0-9]{32}$/i.test((geoapifyApiKey || '').trim());

// Basic middleware: JSON parser, CORS, static assets.
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Utility helpers ----------

/**
 * Build an URL with query string values.
 * @param {string} base
 * @param {Record<string, string | number | undefined>} params
 * @returns {string}
 */
function buildUrl(base, params) {
  const url = new URL(base);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/**
 * Fetch JSON with timeout and structured error handling.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function fetchJson(url, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();

    if (!response.ok) {
      const message = data?.message || data?.error || 'Upstream API request failed.';
      throw new Error(message);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Fetch JSON via POST for APIs like Overpass that expect body payloads.
 * @param {string} url
 * @param {string} body
 * @param {number} timeoutMs
 * @returns {Promise<any>}
 */
async function postJson(url, body, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body,
      signal: controller.signal
    });

    const data = await response.json();

    if (!response.ok) {
      const message = data?.message || data?.error || 'Upstream API POST request failed.';
      throw new Error(message);
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Compute approximate distance between two coordinates in meters.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number}
 */
function haversineMeters(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Convert UI category to Overpass filter expression.
 * @param {string} category
 * @returns {string}
 */
function mapCategoryToOverpassFilter(category) {
  const mapping = {
    'tourism.sights': '"tourism"~"attraction|viewpoint|theme_park|zoo"',
    'tourism.museum': '"tourism"="museum"',
    'leisure.park': '"leisure"~"park|garden|nature_reserve"',
    entertainment: '"amenity"~"cinema|theatre|arts_centre"',
    'catering.restaurant': '"amenity"~"restaurant|cafe|fast_food"'
  };

  return mapping[category] || mapping['tourism.sights'];
}

/**
 * Fetch attractions from Overpass API as fallback provider.
 * @param {number} lat
 * @param {number} lon
 * @param {string} category
 * @param {number} limit
 * @returns {Promise<Array<{name:string,category:string,distanceMeters:number,address:string,lat:number,lon:number}>>}
 */
async function fetchOverpassAttractions(lat, lon, category, limit) {
  const filter = mapCategoryToOverpassFilter(category);
  const radius = 7000;

  const query = `
    [out:json][timeout:25];
    (
      node[${filter}](around:${radius},${lat},${lon});
      way[${filter}](around:${radius},${lat},${lon});
      relation[${filter}](around:${radius},${lat},${lon});
    );
    out center tags;
  `;

  const data = await postJson('https://overpass-api.de/api/interpreter', `data=${encodeURIComponent(query)}`);

  const normalized = (data.elements || [])
    .map((element) => {
      const elementLat = element.lat ?? element.center?.lat;
      const elementLon = element.lon ?? element.center?.lon;
      const tags = element.tags || {};

      if (typeof elementLat !== 'number' || typeof elementLon !== 'number') {
        return null;
      }

      const street = tags['addr:street'] || '';
      const city = tags['addr:city'] || '';
      const address = [street, city].filter(Boolean).join(', ') || 'Address unavailable';

      return {
        name: tags.name || 'Local attraction',
        category,
        distanceMeters: haversineMeters(lat, lon, elementLat, elementLon),
        address,
        lat: elementLat,
        lon: elementLon
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);

  return normalized;
}

// ---------- Page routes ----------

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/landingPage.html'));
});

app.get('/home', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/search', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public/search.html'));
});

// ---------- API routes ----------

// Weather data route (dynamic and normalized).
app.get('/api/weather', async (req, res) => {
  const city = req.query.city?.toString().trim();

  if (!city) {
    return res.status(400).json({ error: 'City query is required.' });
  }

  if (!weatherApiKey) {
    return res.status(500).json({ error: 'Missing WEATHER_API_KEY in environment configuration.' });
  }

  const url = buildUrl('https://api.openweathermap.org/data/2.5/weather', {
    q: city,
    appid: weatherApiKey,
    units: 'metric'
  });

  try {
    const data = await fetchJson(url);

    return res.json({
      city: data.name,
      country: data.sys?.country,
      coordinates: {
        lat: data.coord?.lat,
        lon: data.coord?.lon
      },
      weather: {
        main: data.weather?.[0]?.main,
        description: data.weather?.[0]?.description,
        icon: data.weather?.[0]?.icon
      },
      metrics: {
        temperatureC: data.main?.temp,
        feelsLikeC: data.main?.feels_like,
        humidity: data.main?.humidity,
        windKmh: Number(((data.wind?.speed || 0) * 3.6).toFixed(1)),
        pressure: data.main?.pressure
      },
      sun: {
        sunrise: data.sys?.sunrise,
        sunset: data.sys?.sunset
      },
      timezoneOffsetSeconds: data.timezone,
      observedAt: data.dt
    });
  } catch (error) {
    const statusCode = /not found/i.test(error.message) ? 404 : 502;
    return res.status(statusCode).json({
      error: 'Unable to fetch weather right now.',
      details: error.message
    });
  }
});

// Geocode route powered by OpenWeather Geocoding API.
app.get('/api/geocode', async (req, res) => {
  const city = req.query.city?.toString().trim();

  if (!city) {
    return res.status(400).json({ error: 'City query is required.' });
  }

  if (!weatherApiKey) {
    return res.status(500).json({ error: 'Missing WEATHER_API_KEY in environment configuration.' });
  }

  const url = buildUrl('https://api.openweathermap.org/geo/1.0/direct', {
    q: city,
    limit: 1,
    appid: weatherApiKey
  });

  try {
    const data = await fetchJson(url);
    const location = data?.[0];

    if (!location) {
      return res.status(404).json({ error: 'No matching location found.' });
    }

    return res.json({
      city: location.name,
      state: location.state || null,
      country: location.country,
      lat: location.lat,
      lon: location.lon,
      displayName: [location.name, location.state, location.country].filter(Boolean).join(', ')
    });
  } catch (error) {
    return res.status(502).json({
      error: 'Unable to fetch geocoding data right now.',
      details: error.message
    });
  }
});

// Attractions route powered by Geoapify Places API.
app.get('/api/attractions', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const category = req.query.category?.toString() || 'tourism.sights';
  const limit = Math.min(Number(req.query.limit) || 8, 15);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return res.status(400).json({ error: 'Valid lat and lon query parameters are required.' });
  }

  try {
    // Primary provider: Geoapify when API key exists.
    if (hasValidGeoapifyKey) {
      const url = buildUrl('https://api.geoapify.com/v2/places', {
        categories: category,
        filter: `circle:${lon},${lat},7000`,
        bias: `proximity:${lon},${lat}`,
        limit,
        apiKey: geoapifyApiKey
      });

      const data = await fetchJson(url);
      const items = (data.features || []).map((feature) => {
        const [itemLon, itemLat] = feature.geometry?.coordinates || [null, null];
        const prop = feature.properties || {};

        return {
          name: prop.name || 'Unnamed place',
          category: prop.categories?.[0] || category,
          distanceMeters: prop.distance || null,
          address: prop.formatted || 'Address unavailable',
          lat: itemLat,
          lon: itemLon
        };
      });

      return res.json({
        category,
        provider: 'Geoapify',
        count: items.length,
        items
      });
    }

    // Fallback provider: Overpass API (no key required).
    const fallbackItems = await fetchOverpassAttractions(lat, lon, category, limit);
    return res.json({
      category,
      provider: 'OpenStreetMap Overpass',
      count: fallbackItems.length,
      items: fallbackItems
    });
  } catch (error) {
    // Final fallback attempt with Overpass if Geoapify call failed unexpectedly.
    try {
      const fallbackItems = await fetchOverpassAttractions(lat, lon, category, limit);
      return res.json({
        category,
        provider: 'OpenStreetMap Overpass',
        count: fallbackItems.length,
        items: fallbackItems
      });
    } catch (fallbackError) {
      return res.status(502).json({
        error: 'Unable to fetch attractions right now.',
        details: fallbackError.message || error.message
      });
    }
  }
});

// Live exchange conversion route powered by Frankfurter API.
app.get('/api/exchange', async (req, res) => {
  const from = req.query.from?.toString().toUpperCase();
  const to = req.query.to?.toString().toUpperCase();
  const amount = Number(req.query.amount);

  if (!from || !to || Number.isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: "Missing or invalid 'from', 'to', or 'amount' parameter." });
  }

  try {
    const url = buildUrl('https://api.frankfurter.app/latest', {
      from,
      to
    });

    const data = await fetchJson(url);
    const rate = data?.rates?.[to];

    if (!rate) {
      return res.status(404).json({ error: `Currency pair not supported: ${from} → ${to}` });
    }

    const converted = Number((amount * rate).toFixed(2));

    return res.json({
      from,
      to,
      amount: Number(amount.toFixed(2)),
      rate: Number(rate.toFixed(6)),
      converted,
      date: data.date,
      provider: 'Frankfurter'
    });
  } catch (error) {
    return res.status(502).json({
      error: 'Unable to fetch exchange rate right now.',
      details: error.message
    });
  }
});

// Legacy route preserved for backward compatibility.
app.get('/weather', (req, res) => {
  const city = req.query.city;
  return res.redirect(`/api/weather?city=${encodeURIComponent(city || '')}`);
});

// Global fallback error handler.
app.use((err, _req, res, _next) => {
  console.error('Unexpected server error:', err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

// Start server.
app.listen(port, () => {
  console.log(`WanderLite server running on http://localhost:${port}`);
});