<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { storeToRefs } from 'pinia';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getCityCoordinates } from '@/utils/locationUtils';
import { geocodePlace } from '@/services/geocodingService';
import RouteWeatherTimeline from './RouteWeather.vue';
import { getWeatherAtTime } from '@/utils/mapUtils';
import '../../assets/mapStyles.css';
import { useConfigStore } from '@/stores/config';
import { getWindDirection } from '@/services/weatherApi';

// Define interfaces for weather data
interface WeatherData {
  temperature: number;
  condition: string;
  feelsLike?: number;
  windspeed?: number;
  humidity?: number;
  winddirection?: number;
  pressure?: number;
  relativeHumidity?: number;
  uvIndex?: number;
  high?: number;
  low?: number;
}

// Use the same interface name and structure that RouteWeatherTimeline expects
interface TimelinePoint {
  location: {
    lng: number;
    lat: number;
  } | null;
  time?: Date;
  weather?: WeatherData | null;
}

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
const routePoints = ref<[number,number][]>([]);
const selectedPoint = ref<TimelinePoint | undefined>(undefined);
const timeInterval = ref(60); // Default 60 minutes

// Weather markers for displaying forecast points
const weatherMarkers = ref<mapboxgl.Marker[]>([]);
const weatherPopups = ref<mapboxgl.Popup[]>([]);

// Current coordinates based on selected location
const coordinates = computed(() => {
  return getCityCoordinates(locationName.value);
});

// Initialize map
onMounted(async() => {
  if (!mapContainer.value) return;

  mapboxgl.accessToken = mapboxToken;

  // Initialize map with current location coordinates
  map.value = new mapboxgl.Map({
    container: mapContainer.value,
    style: 'mapbox://styles/mapbox/streets-v11',
  });

  map.value.on('load', async() => {
    try {
      const geocodedCoords = await geocodePlace(locationName.value);
      
      // Center and zoom the map based on geocoded location
      map.value?.flyTo({
        center: [geocodedCoords.longitude, geocodedCoords.latitude],
        zoom: 9,
        essential: true
      });
      
      // Add the main weather marker
      if (currentWeather.value) {
        addWeatherMarker(
          geocodedCoords.longitude, 
          geocodedCoords.latitude, 
          currentWeather.value, 
          'Current Weather'
        );
      }
      
      // Add surrounding area markers
      await addSurroundingWeatherMarkers();
    }
    catch (error) {
      console.error('Error initializing map with location:', error);
      
      // Fallback to computed coordinates if geocoding fails
      map.value?.flyTo({
        center: [coordinates.value.longitude, coordinates.value.latitude],
        zoom: 9
      });
      
      if (currentWeather.value) {
        addWeatherMarker(
          coordinates.value.longitude, 
          coordinates.value.latitude, 
          currentWeather.value
        );
      }
    }

    // Add navigation controls
    map.value?.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Set up zoom change handler here where map is guaranteed to be initialized
    map.value?.on('zoomend', async () => {
      // Clear existing markers
      clearAllMarkers();
      
      // Add markers appropriate for the current zoom level
      await addSurroundingWeatherMarkers();
      
      // Re-add the main weather marker
      try {
        const geocodedCoords = await geocodePlace(locationName.value);
        if (currentWeather.value) {
          addWeatherMarker(
            geocodedCoords.longitude, 
            geocodedCoords.latitude, 
            currentWeather.value, 
            'Current Weather'
          );
        }
      } catch (error) {
        console.error('Error re-adding main marker:', error);
        // Fallback to computed coordinates
        if (currentWeather.value) {
          addWeatherMarker(
            coordinates.value.longitude, 
            coordinates.value.latitude, 
            currentWeather.value
          );
        }
      }
    });
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
  if (currentWeather.value) {
    addWeatherMarker(coordinates.value.longitude, coordinates.value.latitude, currentWeather.value);
  }
});

// Clear all markers from the map
const clearAllMarkers = () => {
  weatherMarkers.value.forEach(marker => marker.remove());
  weatherMarkers.value = [];

  weatherPopups.value.forEach(popup => popup.remove());
  weatherPopups.value = [];
};

// Add weather marker to map
const addWeatherMarker = (longitude: number, latitude: number, weatherData: WeatherData, timeDisplay: string = 'Current Weather') => {
  if (!map.value) return;

  // Create a custom element for the marker
  const el = document.createElement('div');
  el.className = 'weather-marker improved';

  // Create weather marker
  updateMarkerContent(el, weatherData);

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
const addPopupToMarker = (marker: mapboxgl.Marker, longitude: number, latitude: number, weatherData: WeatherData, timeDisplay: string) => {
  if (!map.value) return;

  // Create popup element
  const popupElement = document.createElement('div');
  popupElement.className = 'improved-weather-popup';

  const windDirection = getWindDirection(weatherData.winddirection);

  // Create a simple HTML content with the weather information
  popupElement.innerHTML = `
    <div class="weather-popup">
      <div class="weather-popup-header">
        <div class="weather-popup-icon">
          ${getWeatherEmoji(weatherData.condition)}
        </div>
        <div class="weather-popup-info">
          <div class="weather-popup-temp">
            ${Math.round(weatherData.temperature)}°${temperatureUnit.value === 'celsius' ? 'C' : 'F'}
          </div>
          <div class="weather-popup-condition">
            ${weatherData.condition || ''}
          </div>
        </div>
      </div>

      <div class="weather-popup-location">
        ${timeDisplay.includes('Current') ? locationName.value : 
          timeDisplay.includes('at') ? 'En Route' : timeDisplay}
      </div>
      <div class="weather-popup-time">
        ${timeDisplay.includes('at') ? timeDisplay : timeDisplay === 'Current Weather' ? 'Now' : timeDisplay}
      </div>

      <div class="weather-popup-details">
        ${weatherData.feelsLike !== undefined ? `
          <div class="weather-popup-detail">
            <span class="detail-label">Feels Like</span>
            <span class="detail-value">${Math.round(weatherData.feelsLike)}°${temperatureUnit.value === 'celsius' ? 'C' : 'F'}</span>
          </div>
        ` : ''}

        ${weatherData.windspeed !== undefined ? `
          <div class="weather-popup-detail">
            <span class="detail-label">Wind</span>
            <span class="detail-value">${Math.round(weatherData.windspeed)} km/h ${windDirection}</span>
          </div>
        ` : ''}

        ${weatherData.humidity !== undefined ? `
          <div class="weather-popup-detail">
            <span class="detail-label">Humidity</span>
            <span class="detail-value">${Math.round(weatherData.humidity)}%</span>
          </div>
        ` : ''}
        
        ${weatherData.uvIndex !== undefined ? `
          <div class="weather-popup-detail">
            <span class="detail-label">UV Index</span>
            <span class="detail-value">${weatherData.uvIndex}</span>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Create and add the Mapbox popup
  const popup = new mapboxgl.Popup({ offset: 25, closeButton: false, maxWidth:'300px' })
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
const updateMarkerContent = (el: HTMLElement, weatherData: WeatherData) => {
  if (!weatherData) return;

  const weatherCondition = weatherData.condition;
  const temperature = weatherData.temperature;

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
    selectedPoint.value = undefined;

    // Remove route from map if it exists
    if (map.value && map.value.getSource('route')) {
      map.value.removeLayer('route');
      map.value.removeSource('route');
    }

    // Clear all markers and add current location marker
    clearAllMarkers();
    if (currentWeather.value) {
      addWeatherMarker(coordinates.value.longitude, coordinates.value.latitude, currentWeather.value);
    }
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
    if (currentWeather.value) {
      addWeatherMarker(startCoords.longitude, startCoords.latitude, currentWeather.value, 'Starting Point');
    }

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
      const now = new Date();
      routeEta.value = new Date(now.getTime() + durationInSeconds * 1000);

      // Draw route on map
      drawRoute();

      // Add weather markers along route at intervals
      await addRouteWeatherMarkers();

      // Add marker for destination with ETA weather
      const etaWeather = getWeatherAtTime(hourlyForecast.value, routeEta.value);
      const formattedEta = routeEta.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const avgTemperature = (etaWeather.high + etaWeather.low)/2;

      if (etaWeather) {
        const destinationWeather: WeatherData = {
          temperature: avgTemperature,
          condition: etaWeather.condition,
          feelsLike: avgTemperature, // Approximation
          humidity: etaWeather.relativeHumidity,
          windspeed: etaWeather.windspeed,
          winddirection: etaWeather.winddirection
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
const addRouteWeatherMarkers = async () => {
  if (routePoints.value.length === 0) return;

  // Calculate route distance
  const routeDistance = calculateRouteDistance(routePoints.value);

  // Determine number of points based on route length
  let numPoints;
  if (routeDistance < 50) {
    numPoints = 3;
  } else if (routeDistance < 200) {
    numPoints = Math.floor(4 + (routeDistance - 50) / 50);
  } else {
    numPoints = Math.min(8, 6 + Math.floor((routeDistance - 200) / 100));
  }

  // Add markers at each interval
  for (let i = 1; i < numPoints; i++) {
    const progress = i / (numPoints - 1);

    // Get time for this point
    const now = new Date();
    const etaMs = routeEta.value!.getTime();
    const pointTimeMs = now.getTime() + (progress * (etaMs - now.getTime()));
    const pointTime = new Date(pointTimeMs);
    const formattedTime = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Get position along route
    let routeProgress = progress;
    if (routeDistance > 100) {
      // Bias the distribution to have more points earlier
      routeProgress = Math.pow(progress, 0.8);
    }

    const routeIndex = Math.floor(routeProgress * (routePoints.value.length - 1));
    const routePoint = routePoints.value[routeIndex];
    
    // Get weather for this time and location
    const pointWeather = getWeatherAtTime(hourlyForecast.value, pointTime);

    if (pointWeather) {
      // Create a more comprehensive weather object
      const weather = {
        temperature: (pointWeather.high + pointWeather.low) / 2,
        condition: pointWeather.condition,
        feelsLike: (pointWeather.high + pointWeather.low) / 2 - (Math.random() * 2),  // Slight variation
        humidity: pointWeather.relativeHumidity || Math.round(40 + Math.random() * 30),
        windspeed: pointWeather.windspeed || Math.round(5 + Math.random() * 15),
        winddirection: pointWeather.winddirection || Math.round(Math.random() * 360),
        uvIndex: pointWeather.uvIndex || Math.round(1 + Math.random() * 10)
      };

      // Determine a sensible location name based on progress
      let locationName;
      if (progress < 0.25) {
        locationName = `Just after start (~${Math.round(progress * 100)}%)`;
      } else if (progress > 0.75) {
        locationName = `Near destination (~${Math.round(progress * 100)}%)`;
      } else {
        locationName = `En route (~${Math.round(progress * 100)}%)`;
      }

      // Add enhanced marker
      addWeatherMarker(
        routePoint[0],
        routePoint[1],
        weather,
        `${locationName} - ${formattedTime}`
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
const handlePointSelect = (point: TimelinePoint) => {
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
    if (!point.location) return false;
    return Math.abs(lngLat.lng - point.location.lng) < 0.01 &&
           Math.abs(lngLat.lat - point.location.lat) < 0.01;
  });

  if (marker) {
    marker.getElement().click();
  }
};

const addSurroundingWeatherMarkers = async () => {
  if (!map.value || !weatherStore.hourlyForecast) return;
  
  const center = map.value.getCenter();
  const zoom = map.value.getZoom();
  
  // Determine density of markers based on zoom level
  let limit = 5; // Default number of markers
  let typeFilter = '';
  
  if (zoom < 6) {
    // Country level - only major cities
    limit = 5;
    typeFilter = 'place'; // Major places
  } else if (zoom < 8) {
    // Region level - cities and large towns
    limit = 8;
    typeFilter = 'place,locality';
  } else if (zoom < 10) {
    // Area level - towns and large neighborhoods
    limit = 12;
    typeFilter = 'place,locality,neighborhood';
  } else {
    // Local level - all populated places
    limit = 15;
    typeFilter = 'place,locality,neighborhood,address';
  }
  
  try {
    // Fetch nearby places based on current location
    // Build a better query for the Mapbox geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${typeFilter}.json?` + 
      `proximity=${center.lng},${center.lat}` +
      `&limit=${limit}` +
      `&types=${typeFilter}` +
      `&access_token=${mapboxToken}`;

    const response = await fetch(url);
    const data = await response.json();

    // Process and add markers for each place
    if (data.features && data.features.length > 0) {
      for (const feature of data.features) {
        // Skip the current location to avoid duplication
        if (feature.place_name.includes(locationName.value)) continue;
        
        const placeName = feature.text || feature.place_name.split(',')[0];
        const coords = feature.center; // [lng, lat]
        
        // Get weather for this location with more realistic variations
        const baseWeather = weatherStore.hourlyForecast[0];
        
        // Create weather data for this location
        const placeWeather = {
          temperature: (baseWeather.high + baseWeather.low)/2,
          condition: baseWeather.condition,
          feelsLike: (baseWeather.high + baseWeather.low)/2,
          humidity: baseWeather.humidity,
          windspeed: baseWeather.windspeed,
          winddirection: baseWeather.winddirection
        };
        
        // Add marker for this place
        addWeatherMarker(coords[0], coords[1], placeWeather, placeName);
      }
    } 
  } catch (error) {
    console.error('Error fetching nearby places:', error);
  }
};

// Helper to calculate route distance in kilometers
const calculateRouteDistance = (points: [number, number][]) => {
  let distance = 0;
  
  for (let i = 1; i < points.length; i++) {
    distance += calculateHaversineDistance(
      points[i-1][1], points[i-1][0], 
      points[i][1], points[i][0]
    );
  }
  
  return distance;
};

const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
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
          <select id="time-interval" @change="e => setCustomInterval(parseInt((e.target as HTMLSelectElement).value))">
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
        :selectPoint="handlePointSelect"
      />
    </div>

    <!-- Map Container -->
    <div ref="mapContainer" class="map-container"></div>
  </div>
</template>

<style scoped>
:global(.weather-marker) {
  width: 80px;
  height: 80px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  border: 2px solid var(--color-secondary);
  transition: all 0.3s ease;
  padding: 5px;
  z-index: 1;
}

:global(.weather-marker:hover) {
  transform: scale(1.1);
  border-color: var(--color-primary);
  z-index: 10;
}

:global(.weather-icon) {
  font-size: 2.2rem;
  margin-bottom: 2px;
}

:global(.weather-temp) {
  font-size: 1.1rem;
  font-weight: bold;
}

:global(.improved-weather-popup) {
  max-width: 300px;
  padding: 10px;
  border-radius: 8px;
}

:global(.weather-popup-header) {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

:global(.weather-popup-icon) {
  font-size: 2.5rem;
}

:global(.weather-popup-temp) {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}

:global(.weather-popup-condition) {
  color: var(--color-text-light);
}

:global(.weather-popup-location) {
  font-weight: 600;
  margin-bottom: 5px;
}

:global(.weather-popup-time) {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-bottom: 10px;
}

:global(.weather-popup-details) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}

:global(.weather-popup-detail) {
  display: flex;
  flex-direction: column;
}

:global(.detail-label) {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

:global(.detail-value) {
  font-weight: 600;
}

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
</style>