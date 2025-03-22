<!-- WeatherMap.vue -->
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { storeToRefs } from 'pinia';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getCityCoordinates } from '@/utils/locationUtils';
import { geocodePlace } from '@/services/geocodingService';
import WeatherPopup from './WeatherPopup.vue';
import RouteWeatherTimeline from './RouteWeather.vue';
import { getWeatherAtTime } from '@/utils/mapUtils';
import '../../assets/mapStyles.css';
import { useConfigStore } from '@/stores/config';

// Initialize the weather store
const weatherStore = useWeatherStore();
const {
  currentWeather,
  hourlyForecast,
  locationName,
  temperatureUnit
} = storeToRefs(weatherStore);

// Map configuration
const mapContainer = ref<HTMLElement | null>(null);
const map = ref<mapboxgl.Map | null>(null);
const configStore = useConfigStore();
const mapboxToken = configStore.mapboxToken;

if (!mapboxToken) {
  console.error('Mapbox token is missing. Please set VITE_MAPBOX_TOKEN in your .env file.')
}

// Navigation state
const isNavigationMode = ref(false);
const startLocation = ref('');
const endLocation = ref('');
const routeEta = ref<Date | null>(null);
const routePoints = ref<any[]>([]);
const selectedPoint = ref<any>(null);
const timeInterval = ref(60); // Default 60 minutes

// Weather markers for displaying forecast points
const weatherMarkers = ref<mapboxgl.Marker[]>([]);
const weatherPopups = ref<mapboxgl.Popup[]>([]);

// Current coordinates based on selected location
const coordinates = computed(() => {
  return getCityCoordinates(locationName.value);
});

// Initialize map
onMounted(() => {
  if (!mapContainer.value) return;

  mapboxgl.accessToken = mapboxToken;

  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v11',
    center: [coordinates.value.longitude, coordinates.value.latitude],
    zoom: 9
  });

  map.value.on('load', () => {
    addWeatherMarker(coordinates.value.longitude, coordinates.value.latitude, currentWeather.value);

    // Add navigation controls
    map.value?.addControl(new mapboxgl.NavigationControl(), 'top-right');
  });
});

// Watch for location changes
watch(() => locationName.value, () => {
  if (!map.value) return;

  // Update map center when location changes
  map.value.flyTo({
    center: [coordinates.value.longitude, coordinates.value.latitude],
    zoom: 9,
    essential: true
  });

  // Clear all markers and add current location marker
  clearAllMarkers();
  addWeatherMarker(coordinates.value.longitude, coordinates.value.latitude, currentWeather.value);
});

// Clear all markers from the map
const clearAllMarkers = () => {
  weatherMarkers.value.forEach(marker => marker.remove());
  weatherMarkers.value = [];

  weatherPopups.value.forEach(popup => popup.remove());
  weatherPopups.value = [];
};

// Add weather marker to map
const addWeatherMarker = (longitude: number, latitude: number, weatherData: any, timeDisplay: string = 'Current Weather') => {
  if (!map.value) return;

  // Create a custom element for the marker
  const el = document.createElement('div');
  el.className = 'weather-marker';

  // Create weather icon and details
  if (weatherData) {
    updateMarkerContent(el, weatherData);
  }

  // Create new marker
  const marker = new mapboxgl.Marker(el)
    .setLngLat([longitude, latitude])
    .addTo(map.value);

  // Store marker for later reference
  weatherMarkers.value.push(marker);

  // Add popup to the marker
  if (weatherData) {
    addPopupToMarker(marker, longitude, latitude, weatherData, timeDisplay);
  }

  return marker;
};

// Add popup to a marker
const addPopupToMarker = (marker: mapboxgl.Marker, longitude: number, latitude: number, weatherData: any, timeDisplay: string) => {
  if (!map.value) return;

  // Create popup element
  const popupElement = document.createElement('div');

  // Instead of creating a Vue app, we'll create a simple HTML content for the popup
  // Create a simple HTML content with the weather information
  popupElement.innerHTML = `
    <div class="weather-popup">
      <div class="weather-popup-header">
        <div class="weather-popup-icon" style="font-size: 2.5rem;">
          ${getWeatherEmoji(weatherData.condition)}
        </div>
        <div class="weather-popup-info">
          <div class="weather-popup-temp" style="font-size: 1.8rem; font-weight: bold; line-height: 1;">
            ${Math.round(weatherData.temperature)}°${temperatureUnit.value === 'celsius' ? 'C' : 'F'}
          </div>
          <div class="weather-popup-condition" style="color: var(--color-text-light);">
            ${weatherData.condition || ''}
          </div>
        </div>
      </div>

      <div class="weather-popup-location" style="font-weight: 600; margin-bottom: 5px;">
        ${timeDisplay.includes('Current') ? locationName.value : 'En Route'}
      </div>
      <div class="weather-popup-time" style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">
        ${timeDisplay}
      </div>

      <div class="weather-popup-details" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        ${weatherData.feelsLike !== undefined ? `
          <div class="weather-popup-detail" style="display: flex; flex-direction: column;">
            <span class="detail-label" style="font-size: 0.8rem; color: #666;">Feels Like</span>
            <span class="detail-value" style="font-weight: 600;">${Math.round(weatherData.feelsLike)}°${temperatureUnit.value === 'celsius' ? 'C' : 'F'}</span>
          </div>
        ` : ''}

        ${weatherData.windspeed !== undefined ? `
          <div class="weather-popup-detail" style="display: flex; flex-direction: column;">
            <span class="detail-label" style="font-size: 0.8rem; color: #666;">Wind</span>
            <span class="detail-value" style="font-weight: 600;">${Math.round(weatherData.windspeed)} km/h</span>
          </div>
        ` : ''}

        ${weatherData.humidity !== undefined ? `
          <div class="weather-popup-detail" style="display: flex; flex-direction: column;">
            <span class="detail-label" style="font-size: 0.8rem; color: #666;">Humidity</span>
            <span class="detail-value" style="font-weight: 600;">${Math.round(weatherData.humidity)}%</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Create and add the Mapbox popup
  const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
    .setLngLat([longitude, latitude])
    .setDOMContent(popupElement);

  // Store popup for later reference
  weatherPopups.value.push(popup);

  // Show popup when marker is clicked
  marker.getElement().addEventListener('click', () => {
    popup.addTo(map.value!);
  });

  return popup;
};

// Update marker content with weather info
const updateMarkerContent = (el: HTMLElement, weatherData: any) => {
  if (!weatherData) return;

  let weatherCondition = weatherData.condition;
  let temperature = weatherData.temperature;

  // Format temperature based on unit
  const tempUnit = temperatureUnit.value === 'celsius' ? 'C' : 'F';
  const formattedTemp = `${Math.round(temperature)}°${tempUnit}`;

  // Get emoji for weather condition
  const weatherEmoji = getWeatherEmoji(weatherCondition);

  // Create HTML content for marker
  el.innerHTML = `
    <div class="weather-icon">${weatherEmoji}</div>
    <div class="weather-temp">${formattedTemp}</div>
  `;
};

// Get emoji for weather condition
const getWeatherEmoji = (condition: string) => {
  if (!condition) return '☀️';

  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('clear')) return '☀️';
  if (lowerCondition.includes('partly cloudy')) return '⛅';
  if (lowerCondition.includes('cloud')) return '☁️';
  if (lowerCondition.includes('fog')) return '🌫️';
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return '🌧️';
  if (lowerCondition.includes('shower')) return '🌦️';
  if (lowerCondition.includes('snow')) return '❄️';
  if (lowerCondition.includes('thunder')) return '⛈️';

  return '☀️'; // Default
};

// Toggle navigation mode
const toggleNavigationMode = () => {
  isNavigationMode.value = !isNavigationMode.value;

  // Reset route data when turning off navigation
  if (!isNavigationMode.value) {
    startLocation.value = '';
    endLocation.value = '';
    routeEta.value = null;
    routePoints.value = [];
    selectedPoint.value = null;

    // Remove route from map if it exists
    if (map.value && map.value.getSource('route')) {
      map.value.removeLayer('route');
      map.value.removeSource('route');
    }

    // Clear all markers and add current location marker
    clearAllMarkers();
    addWeatherMarker(coordinates.value.longitude, coordinates.value.latitude, currentWeather.value);
  }
};

// Set custom interval for route points
const setCustomInterval = (minutes: number) => {
  timeInterval.value = minutes;
};

// Calculate route between locations
const calculateRoute = async () => {
  if (!map.value || !startLocation.value || !endLocation.value) return;

  try {
    // Clear existing markers
    clearAllMarkers();

    // Get coordinates for start and end locations using the geocoding service
    const startCoords = await geocodePlace(startLocation.value);
    const endCoords = await geocodePlace(endLocation.value);

    // Add marker for current location
    addWeatherMarker(startCoords.longitude, startCoords.latitude, currentWeather.value, 'Starting Point');

    // Call Mapbox Directions API to get route
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoords.longitude},${startCoords.latitude};${endCoords.longitude},${endCoords.latitude}?steps=true&geometries=geojson&access_token=${mapboxToken}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];

      // Store route geometry points
      routePoints.value = route.geometry.coordinates;

      // Calculate ETA based on current time plus duration
      const durationInSeconds = route.duration;
      const durationInMinutes = Math.round(durationInSeconds / 60);
      const now = new Date();
      routeEta.value = new Date(now.getTime() + durationInSeconds * 1000);

      // Draw route on map
      drawRoute();

      // Add weather markers along route at intervals
      await addRouteWeatherMarkers(durationInMinutes);

      // Add marker for destination with ETA weather
      const etaWeather = getWeatherAtTime(hourlyForecast.value, routeEta.value);
      const formattedEta = routeEta.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (etaWeather) {
        const destinationWeather = {
          temperature: etaWeather.temp,
          condition: etaWeather.condition,
          feelsLike: etaWeather.temp // Approximation
        };

        addWeatherMarker(
          endCoords.longitude,
          endCoords.latitude,
          destinationWeather,
          `Arrival at ${formattedEta}`
        );
      }
    }
  } catch (error) {
    console.error('Error calculating route:', error);
  }
};

// Add weather markers along route at regular intervals
const addRouteWeatherMarkers = async (durationInMinutes: number) => {
  if (routePoints.value.length === 0) return;

  // Determine number of points based on duration and interval
  const numPoints = Math.ceil(durationInMinutes / timeInterval.value);

  // Don't add too many points
  const actualPoints = Math.min(numPoints, 6);

  if (actualPoints <= 1) return;

  // Add markers at each interval
  for (let i = 1; i < actualPoints; i++) {
    const progress = i / actualPoints;

    // Get time for this point
    const now = new Date();
    const etaMs = routeEta.value!.getTime();
    const pointTimeMs = now.getTime() + (progress * (etaMs - now.getTime()));
    const pointTime = new Date(pointTimeMs);
    const formattedTime = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get position along route
    const routeIndex = Math.floor(progress * (routePoints.value.length - 1));
    const routePoint = routePoints.value[routeIndex];

    // Get weather for this time
    const pointWeather = getWeatherAtTime(hourlyForecast.value, pointTime);

    if (pointWeather) {
      const markerWeather = {
        temperature: pointWeather.temp,
        condition: pointWeather.condition,
        feelsLike: pointWeather.temp // Approximation
      };

      // Add marker at this point
      addWeatherMarker(
        routePoint[0],
        routePoint[1],
        markerWeather,
        `Weather at ${formattedTime}`
      );
    }
  }
};

// Draw route on map
const drawRoute = () => {
  if (!map.value || routePoints.value.length === 0) return;

  // Remove previous route if it exists
  if (map.value.getSource('route')) {
    map.value.removeLayer('route');
    map.value.removeSource('route');
  }

  // Add route source and layer
  map.value.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: routePoints.value
      }
    }
  });

  map.value.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: {
      'line-join': 'round',
      'line-cap': 'round'
    },
    paint: {
      'line-color': '#4a6fa5',
      'line-width': 8
    }
  });

  // Fit map to show entire route
  const bounds = new mapboxgl.LngLatBounds();
  routePoints.value.forEach(point => {
    bounds.extend([point[0], point[1]]);
  });

  map.value.fitBounds(bounds, {
    padding: 50
  });
};

// Handle selection of a point from the timeline
const handlePointSelect = (point: any) => {
  if (!map.value || !point.location) return;

  selectedPoint.value = point;

  // Fly to the selected point
  map.value.flyTo({
    center: [point.location.lng, point.location.lat],
    zoom: 10,
    essential: true
  });

  // Find relevant marker and trigger its click event
  const marker = weatherMarkers.value.find(m => {
    const lngLat = m.getLngLat();
    return Math.abs(lngLat.lng - point.location.lng) < 0.01 &&
           Math.abs(lngLat.lat - point.location.lat) < 0.01;
  });

  if (marker) {
    marker.getElement().click();
  }
};
</script>

<template>
  <div class="weather-map-container">
    <!-- Map Controls -->
    <div class="map-controls">
      <div class="toggle-nav">
        <button @click="toggleNavigationMode" :class="{ active: isNavigationMode }">
          {{ isNavigationMode ? 'Exit Navigation' : 'Start Navigation' }}
        </button>
      </div>

      <!-- Navigation Form -->
      <div v-if="isNavigationMode" class="nav-form">
        <div class="input-group">
          <label for="start-location">Start:</label>
          <input
            type="text"
            id="start-location"
            v-model="startLocation"
            placeholder="Enter start location"
          >
        </div>

        <div class="input-group">
          <label for="end-location">Destination:</label>
          <input
            type="text"
            id="end-location"
            v-model="endLocation"
            placeholder="Enter destination"
          >
        </div>

        <div class="input-group">
          <label for="time-interval">Interval (min):</label>
          <select id="time-interval" @change="setCustomInterval(parseInt($event.target.value))">
            <option value="30">30 min</option>
            <option value="60" selected>1 hour</option>
            <option value="120">2 hours</option>
          </select>
        </div>

        <button @click="calculateRoute" class="route-btn">Get Route</button>
      </div>

      <!-- Route Weather Timeline -->
      <RouteWeatherTimeline
        v-if="isNavigationMode && routeEta && routePoints.length > 0"
        :routePoints="routePoints"
        :etaTime="routeEta"
        :routeDuration="routeEta ? (routeEta.getTime() - new Date().getTime()) / 60000 : 0"
        :timeInterval="timeInterval"
        @selectPoint="handlePointSelect"
      />
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
.weather-map-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.map-container {
  flex: 1;
  width: 100%;
  min-height: 500px;
  border-radius: var(--border-radius);
  overflow: hidden;
}

.map-controls {
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow);
}

.toggle-nav {
  margin-bottom: var(--spacing-md);
}

.toggle-nav button {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-secondary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 600;
}

.toggle-nav button.active {
  background-color: var(--color-primary);
}

.nav-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.input-group {
  flex: 1;
  min-width: 200px;
}

.input-group label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.input-group input, .input-group select {
  width: 100%;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
}

.route-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background-color: var(--color-secondary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  align-self: flex-end;
}

/* Weather marker styling */
:global(.weather-marker) {
  width: 70px;
  height: 70px;
  background-color: white;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  border: 2px solid var(--color-secondary);
  transition: all 0.3s ease;
}

:global(.weather-marker:hover) {
  transform: scale(1.1);
  border-color: var(--color-primary);
}

:global(.weather-icon) {
  font-size: 2rem;
}

:global(.weather-temp) {
  font-size: 1rem;
  font-weight: bold;
}
</style>
