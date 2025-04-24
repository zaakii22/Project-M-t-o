// Configuration
const API_KEY = 'e947d99e519bde3bada70e2d95ddf476'; // Clé API de test (remplacez par la vôtre)
let isCelsius = true;
let currentCity = null;
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

// Éléments DOM
const elements = {
  loader: document.getElementById('loader'),
  error: document.getElementById('errorMessage'),
  location: document.getElementById('location'),
  date: document.getElementById('date'),
  temp: document.getElementById('temp'),
  weatherIcon: document.getElementById('weatherIcon'),
  description: document.getElementById('description'),
  humidity: document.getElementById('humidity'),
  wind: document.getElementById('wind'),
  feelsLike: document.getElementById('feelsLike'),
  pressure: document.getElementById('pressure'),
  forecast: document.getElementById('forecast'),
  favoritesList: document.getElementById('favoritesList'),
  cityInput: document.getElementById('cityInput'),
  searchBtn: document.getElementById('searchBtn'),
  locationBtn: document.getElementById('locationBtn'),
  toggleUnitBtn: document.getElementById('toggleUnitBtn'),
  favoriteBtn: document.getElementById('favoriteBtn')
};

// Événements
elements.searchBtn.addEventListener('click', searchWeather);
elements.locationBtn.addEventListener('click', getLocationWeather);
elements.toggleUnitBtn.addEventListener('click', toggleUnit);
elements.favoriteBtn.addEventListener('click', toggleFavorite);
elements.cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchWeather();
});

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
  updateFavoritesList();
  // Charger la dernière ville visitée ou Casablanca par défaut
  const lastCity = localStorage.getItem('lastCity') || 'Casablanca';
  getWeather(lastCity);
});

// Fonctions principales
async function getWeather(city) {
  try {
    showLoader();
    hideError();
    
    const unit = isCelsius ? 'metric' : 'imperial';
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=${unit}&lang=fr&appid=${API_KEY}`
    );
    
    if (!response.ok) throw new Error('Ville non trouvée');
    
    const data = await response.json();
    currentCity = data.name;
    
    // Mettre à jour l'interface
    updateCurrentWeather(data);
    await getForecast(data.coord.lat, data.coord.lon);
    
    // Sauvegarder la dernière ville
    localStorage.setItem('lastCity', currentCity);
    updateBackground(data.weather[0].main);
    
    // Mettre à jour le bouton favori
    updateFavoriteButton();
    
  } catch (error) {
    showError(error.message);
  } finally {
    hideLoader();
  }
}

async function getForecast(lat, lon) {
  try {
    const unit = isCelsius ? 'metric' : 'imperial';
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${unit}&lang=fr&appid=${API_KEY}`
    );
    
    if (!response.ok) throw new Error('Erreur lors de la récupération des prévisions');
    
    const data = await response.json();
    updateForecast(data.list);
    
  } catch (error) {
    console.error('Forecast Error:', error);
  }
}

function updateCurrentWeather(data) {
  elements.location.textContent = data.name + ', ' + data.sys.country;
  
  const now = new Date();
  elements.date.textContent = now.toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  elements.temp.textContent = Math.round(data.main.temp) + '°' + (isCelsius ? 'C' : 'F');
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
  elements.weatherIcon.alt = data.weather[0].description;
  elements.description.textContent = data.weather[0].description;
  elements.humidity.textContent = data.main.humidity + '%';
  elements.wind.textContent = Math.round(data.wind.speed * 3.6) + ' km/h';
  elements.feelsLike.textContent = Math.round(data.main.feels_like) + '°';
  elements.pressure.textContent = data.main.pressure + ' hPa';
}

function updateForecast(forecastData) {
  elements.forecast.innerHTML = '';
  
  // Grouper par jour (on prend une prévision par jour vers midi)
  const dailyForecasts = {};
  forecastData.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    const hour = new Date(item.dt * 1000).getHours();
    
    // On prend la prévision la plus proche de midi (12h)
    if (hour >= 11 && hour <= 13 && !dailyForecasts[date]) {
      dailyForecasts[date] = item;
    }
  });
  
  // Afficher les 5 prochains jours
  Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
    const forecast = dailyForecasts[date];
    const dayName = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
    
    const forecastCard = document.createElement('div');
    forecastCard.className = 'forecast-card';
    forecastCard.innerHTML = `
      <div class="day">${capitalizeFirstLetter(dayName)}</div>
      <img class="forecast-icon" src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].description}">
      <div class="temps">
        <span class="max-temp">${Math.round(forecast.main.temp_max)}°</span>
        <span class="min-temp">${Math.round(forecast.main.temp_min)}°</span>
      </div>
      <p>${forecast.weather[0].description}</p>
    `;
    
    elements.forecast.appendChild(forecastCard);
  });
}

function updateBackground(weatherCondition) {
  const backgrounds = {
    Clear: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1494548162494-384bba4ab999?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
    Clouds: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
    Rain: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1438449805896-28a666819a20?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
    Snow: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1491002052546-bf38f186af56?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")',
    Thunderstorm: 'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1492011221367-f47e3ccd77a0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")'
  };
  
  const newBackground = backgrounds[weatherCondition] || 
    'linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url("https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80")';
  
  document.body.style.backgroundImage = newBackground;
}

// Fonctions utilitaires
function searchWeather() {
  const city = elements.cityInput.value.trim();
  if (!city) {
    showError('Veuillez entrer une ville');
    return;
  }
  getWeather(city);
}

function getLocationWeather() {
  if (!navigator.geolocation) {
    showError('La géolocalisation n\'est pas supportée par votre navigateur');
    return;
  }
  
  showLoader();
  navigator.geolocation.getCurrentPosition(
    position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${isCelsius ? 'metric' : 'imperial'}&lang=fr&appid=${API_KEY}`)
        .then(res => res.json())
        .then(data => {
          currentCity = data.name;
          elements.cityInput.value = currentCity;
          updateCurrentWeather(data);
          getForecast(lat, lon);
          updateBackground(data.weather[0].main);
          updateFavoriteButton();
        })
        .catch(error => {
          showError('Erreur lors de la récupération des données');
          console.error(error);
        })
        .finally(() => {
          hideLoader();
        });
    },
    error => {
      showError('Impossible d\'obtenir votre position. Vérifiez les permissions.');
      hideLoader();
    }
  );
}

function toggleUnit() {
  isCelsius = !isCelsius;
  elements.toggleUnitBtn.textContent = isCelsius ? '°C/°F' : '°F/°C';
  
  if (currentCity) {
    getWeather(currentCity);
  }
}

function toggleFavorite() {
  if (!currentCity) return;
  
  const index = favorites.indexOf(currentCity);
  if (index === -1) {
    favorites.push(currentCity);
  } else {
    favorites.splice(index, 1);
  }
  
  localStorage.setItem('favorites', JSON.stringify(favorites));
  updateFavoriteButton();
  updateFavoritesList();
}

function updateFavoriteButton() {
  if (!currentCity) return;
  
  const isFavorite = favorites.includes(currentCity);
  elements.favoriteBtn.innerHTML = isFavorite ? 
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" viewBox="0 0 16 16"><path d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z"/></svg>' : 
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/></svg>';
}

function updateFavoritesList() {
  elements.favoritesList.innerHTML = '';
  
  favorites.forEach(city => {
    const favoriteItem = document.createElement('div');
    favoriteItem.className = 'favorite-item';
    favoriteItem.textContent = city;
    favoriteItem.addEventListener('click', () => {
      elements.cityInput.value = city;
      getWeather(city);
    });
    
    elements.favoritesList.appendChild(favoriteItem);
  });
}

function showLoader() {
  elements.loader.style.display = 'block';
}

function hideLoader() {
  elements.loader.style.display = 'none';
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.style.display = 'block';
}

function hideError() {
  elements.error.style.display = 'none';
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}