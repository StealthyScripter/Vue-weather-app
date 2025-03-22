<!-- WeatherPopup.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { formatTemperature } from '@/utils/temperatureConverter';

const props = defineProps<{
  weather: {
    temperature: number;
    condition: string;
    feelsLike?: number;
    humidity?: number;
    windspeed?: number;
    winddirection?: number;
    pressure?: number;
  };
  location: string;
  time: string;
  unit: string;
}>();

// Get appropriate weather icon based on condition
const weatherIcon = computed(() => {
  if (!props.weather.condition) return '☀️';

  const lowerCondition = props.weather.condition.toLowerCase();

  if (lowerCondition.includes('clear')) return '☀️';
  if (lowerCondition.includes('partly cloudy')) return '⛅';
  if (lowerCondition.includes('cloud')) return '☁️';
  if (lowerCondition.includes('fog')) return '🌫️';
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return '🌧️';
  if (lowerCondition.includes('shower')) return '🌦️';
  if (lowerCondition.includes('snow')) return '❄️';
  if (lowerCondition.includes('thunder')) return '⛈️';

  return '☀️'; // Default
});

// Format temperature with unit
const formattedTemp = computed(() => {
  return formatTemperature(props.weather.temperature, props.unit);
});

// Format feels like temperature with unit
const formattedFeelsLike = computed(() => {
  if (props.weather.feelsLike === undefined) return '-';
  return formatTemperature(props.weather.feelsLike, props.unit);
});

// Format wind speed with appropriate unit
const formattedWindSpeed = computed(() => {
  if (props.weather.windspeed === undefined) return '-';
  return `${Math.round(props.weather.windspeed)} km/h`;
});

// Get wind direction as compass direction
const windDirection = computed(() => {
  if (props.weather.winddirection === undefined) return '-';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(props.weather.winddirection / 45) % 8;
  return directions[index];
});

// Format humidity with percentage
const formattedHumidity = computed(() => {
  if (props.weather.humidity === undefined) return '-';
  return `${Math.round(props.weather.humidity)}%`;
});

// Determine if this is a route point
const isRoutePoint = computed(() => {
  return props.time.includes('at') && !props.time.includes('Current');
});
</script>

<template>
  <div class="weather-popup">
    <div class="weather-popup-header">
      <div class="weather-popup-icon">
        {{ weatherIcon }}
      </div>
      <div class="weather-popup-info">
        <div class="weather-popup-temp">{{ formattedTemp }}</div>
        <div class="weather-popup-condition">{{ weather.condition }}</div>
      </div>
    </div>

    <div class="weather-popup-location" :class="{ 'route-point': isRoutePoint }">{{ location }}</div>
    <div class="weather-popup-time">{{ time }}</div>

    <div class="weather-popup-details">
      <div class="weather-popup-detail" v-if="weather.feelsLike !== undefined">
        <span class="detail-label">Feels Like</span>
        <span class="detail-value">{{ formattedFeelsLike }}</span>
      </div>

      <div class="weather-popup-detail" v-if="weather.windspeed !== undefined">
        <span class="detail-label">Wind</span>
        <span class="detail-value">{{ formattedWindSpeed }} {{ windDirection }}</span>
      </div>

      <div class="weather-popup-detail" v-if="weather.humidity !== undefined">
        <span class="detail-label">Humidity</span>
        <span class="detail-value">{{ formattedHumidity }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-popup {
  padding: 5px;
  min-width: 220px;
}

.weather-popup-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 10px;
}

.weather-popup-icon {
  font-size: 2.5rem;
}

.weather-popup-temp {
  font-size: 1.8rem;
  font-weight: bold;
  line-height: 1;
}

.weather-popup-condition {
  color: var(--color-text-light);
}

.weather-popup-location {
  font-weight: 600;
  margin-bottom: 5px;
}

.weather-popup-location.route-point {
  color: var(--color-secondary);
}

.weather-popup-time {
  color: var(--color-text-light);
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.weather-popup-details {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
  border-top: 1px solid var(--color-border);
  padding-top: 10px;
}

.weather-popup-detail {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 0.8rem;
  color: var(--color-text-light);
}

.detail-value {
  font-weight: 600;
}

@media (max-width: 480px) {
  .weather-popup-details {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
