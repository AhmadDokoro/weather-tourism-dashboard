// Wait for the DOM to load before running the script
document.addEventListener("DOMContentLoaded", ()=>{
                // Get city name from URL query string
                const param = new URLSearchParams(window.location.search);
                const city = param.get("city");

                // Fetch weather data from backend API (which proxies OpenWeatherMap)
                fetch(`/weather?city=${encodeURIComponent(city)}`)
                .then(res => res.json())
                .then(data => {
                        // Update weather icon
                        document.querySelector(".weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                        // Update weather description
                        document.querySelector(".description").innerHTML = data.weather[0].description;
                        // Update city name
                        document.querySelector(".weather-info h2").innerHTML = data.name;
                        // Update temperature (convert from Kelvin to Celsius)
                        document.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp - 273.15)}\u00b0C`; // if you don't set &units=metric
                        // Update weather details (humidity, wind, feels like, pressure)
                        document.querySelector(".details").innerHTML = `
                        <div class=\"detail-item\">Humidity: ${data.main.humidity}%</div>
                        <div class=\"detail-item\">Wind: ${(data.wind.speed * 3.6).toFixed(1)} km/h</div>
                        <div class=\"detail-item\">Feels like: ${Math.round(data.main.feels_like - 273.15)}\u00b0C</div>
                        <div class=\"detail-item\">Pressure: ${data.main.pressure} hPa</div>
`;

                })
                // Handle errors in fetching weather data
                .catch(err =>{
                        console.error("Error fectching weather data ",err);
                })
        });
