
        document.addEventListener("DOMContentLoaded", ()=>{
                const param = new URLSearchParams(window.location.search);
                const city = param.get("city");

                fetch(`/weather?city=${encodeURIComponent(city)}`)
                .then(res => res.json())
                .then(data => {
                        console.log("Weather data: ",data);
                        document.querySelector(".weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                        document.querySelector(".description").innerHTML = data.weather[0].description;
                        document.querySelector(".weather-info h2").innerHTML = data.name;
                        document.querySelector(".temperature").innerHTML = `${Math.round(data.main.temp - 273.15)}°C`; // if you don't set &units=metric
                        document.querySelector(".details").innerHTML = `
                        <div class="detail-item">Humidity: ${data.main.humidity}%</div>
                        <div class="detail-item">Wind: ${(data.wind.speed * 3.6).toFixed(1)} km/h</div>
                        <div class="detail-item">Feels like: ${Math.round(data.main.feels_like - 273.15)}°C</div>
                        <div class="detail-item">Pressure: ${data.main.pressure} hPa</div>
`;

                })

                .catch(err =>{
                        console.error("Error fectching weather data ",err);
                })
        });


        fetch(`/attractions?city=${city}`)
        .then(res => res.json())
        .then(data =>{

        });