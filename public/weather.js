document.getElementById('fetch-weather-btn').addEventListener('click', () => {
    const city = document.getElementById('city').value;
    if (city) {
        fetch(`https://productivityapp-f6q9.onrender.com/weather/data?city=${city}`)
            .then(response => response.json())
            .then(data => {
                const { main, weather, wind, sys, coord, rain } = data;
                
                // Extracting weather details for the last 3 hours
                const weatherInfo = `
                    <h3>Weather in ${city} (Last 3 Hours)</h3>
                    <p>Temperature: ${main.temp}°C</p>
                    <p>Feels Like: ${main.feels_like}°C</p>
                    <p>Description: ${weather[0].description}</p>
                    <p>Icon: <img src="https://openweathermap.org/img/wn/${weather[0].icon}.png" alt="${weather[0].description}" /></p>
                    <p>Humidity: ${main.humidity}%</p>
                    <p>Pressure: ${main.pressure} hPa</p>
                    <p>Wind Speed: ${wind.speed} m/s</p>
                    <p>Country: ${sys.country}</p>
                    <p>Coordinates: Latitude - ${coord.lat}, Longitude - ${coord.lon}</p>
                    <p>Rain Volume (last 3 hours): ${rain ? rain['3h'] : 'No rain'}</p>
                `;
                
                document.getElementById('weather-info').innerHTML = weatherInfo;

                // Initialize the map with the city's coordinates
                const map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 10,
                    center: { lat: coord.lat, lng: coord.lon }
                });

                const marker = new google.maps.Marker({
                    position: { lat: coord.lat, lng: coord.lon },
                    map: map,
                    title: `Location of ${city}`
                });
            })
            .catch(() => {
                alert('Failed to fetch weather data');
            });
    } else {
        alert('Please enter a city name');
    }
});

function initMap() {
    const map = new google.maps.Map(document.getElementById('map'), {
        zoom: 10,
        center: { lat: 0, lng: 0 }
    });

    const marker = new google.maps.Marker({
        position: { lat: 0, lng: 0 },
        map: map,
        title: 'Location'
    });
}
