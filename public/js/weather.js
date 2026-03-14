// Handles weather data rendering and emits location context for map/attractions modules.
document.addEventListener('DOMContentLoaded', async () => {
        const params = new URLSearchParams(window.location.search);
        const city = params.get('city')?.trim();

        const cityNameEl = document.getElementById('cityName');
        const dateTimeEl = document.getElementById('dateTime');
        const weatherIconEl = document.getElementById('weatherIcon');
        const weatherTextEl = document.getElementById('weatherText');
        const tempEl = document.getElementById('temperature');
        const statHumidityEl = document.getElementById('statHumidity');
        const statWindEl = document.getElementById('statWind');
        const statFeelsEl = document.getElementById('statFeelsLike');
        const statPressureEl = document.getElementById('statPressure');
        const statusBannerEl = document.getElementById('statusBanner');
        const locationMetaEl = document.getElementById('locationMeta');

        if (!city) {
                statusBannerEl.textContent = 'No city selected. Please search for a destination first.';
                statusBannerEl.classList.add('is-error');
                return;
        }

        cityNameEl.textContent = `Loading ${city}...`;
        statusBannerEl.textContent = 'Fetching latest weather and destination insights...';

        try {
                const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
                const payload = await response.json();

                if (!response.ok) {
                        throw new Error(payload.error || payload.details || 'Unable to load weather data.');
                }

                // Render primary weather hero information.
                cityNameEl.textContent = `${payload.city}, ${payload.country}`;
                weatherTextEl.textContent = `${payload.weather.main} · ${payload.weather.description}`;
                tempEl.textContent = `${Math.round(payload.metrics.temperatureC)}°C`;
                weatherIconEl.src = `https://openweathermap.org/img/wn/${payload.weather.icon}@2x.png`;
                weatherIconEl.alt = payload.weather.description;

                // Render KPI chips.
                statHumidityEl.textContent = `${payload.metrics.humidity}%`;
                statWindEl.textContent = `${payload.metrics.windKmh} km/h`;
                statFeelsEl.textContent = `${Math.round(payload.metrics.feelsLikeC)}°C`;
                statPressureEl.textContent = `${payload.metrics.pressure} hPa`;

                // Build local destination date/time using city timezone offset.
                const localDate = getLocalDate(payload.timezoneOffsetSeconds);
                dateTimeEl.textContent = localDate.toLocaleString(undefined, {
                        dateStyle: 'full',
                        timeStyle: 'short'
                });

                // Provide polished destination metadata panel.
                const sunrise = unixToLocalTime(payload.sun.sunrise, payload.timezoneOffsetSeconds);
                const sunset = unixToLocalTime(payload.sun.sunset, payload.timezoneOffsetSeconds);

                locationMetaEl.innerHTML = `
                        <li><span>Coordinates</span><strong>${payload.coordinates.lat}, ${payload.coordinates.lon}</strong></li>
                        <li><span>Sunrise</span><strong>${sunrise}</strong></li>
                        <li><span>Sunset</span><strong>${sunset}</strong></li>
                        <li><span>Observed</span><strong>${new Date(payload.observedAt * 1000).toLocaleTimeString()}</strong></li>
                `;

                statusBannerEl.textContent = 'Destination intelligence updated successfully.';
                statusBannerEl.classList.remove('is-error');

                // Broadcast resolved location to the map/attractions script.
                window.dispatchEvent(new CustomEvent('wanderlite:location-ready', {
                        detail: {
                                city: payload.city,
                                country: payload.country,
                                lat: payload.coordinates.lat,
                                lon: payload.coordinates.lon
                        }
                }));
        } catch (error) {
                statusBannerEl.textContent = error.message;
                statusBannerEl.classList.add('is-error');
                cityNameEl.textContent = city;
                console.error('Weather loading failed:', error);
        }
});

/**
 * Compute a date object adjusted to destination timezone.
 * @param {number} offsetSeconds
 * @returns {Date}
 */
function getLocalDate(offsetSeconds = 0) {
        const now = new Date();
        const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcMs + offsetSeconds * 1000);
}

/**
 * Convert UNIX timestamp to user-readable local time.
 * @param {number} unixSeconds
 * @param {number} offsetSeconds
 * @returns {string}
 */
function unixToLocalTime(unixSeconds, offsetSeconds = 0) {
        const utcMs = unixSeconds * 1000;
        const localMs = utcMs + offsetSeconds * 1000;
        return new Date(localMs).toUTCString().split(' ')[4];
}
