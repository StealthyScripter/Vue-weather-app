<script setup lang="ts">
import { formatTemperature } from '@/utils/temperatureConverter';

interface HourlyItem {
  time: string;
  temp: number;
  icon: number | string;
  condition?: string;
}

defineProps<{
  hourlyData: Array<HourlyItem>,
  unit: string
}>();

// Function to get the appropriate icon component
const getWeatherIcon = (icon: string | number) => {
  // If icon is a weather code number
  if (typeof icon === 'number') {
    // Map weather codes to emoji
    if (icon === 0 || icon === 1) return '☀️'; // Clear
    if (icon === 2) return '⛅'; // Partly cloudy
    if (icon === 3) return '☁️'; // Cloudy
    if (icon >= 45 && icon <= 48) return '🌫️'; // Fog
    if (icon >= 51 && icon <= 67) return '🌧️'; // Rain
    if (icon >= 71 && icon <= 77) return '❄️'; // Snow
    if (icon >= 80 && icon <= 82) return '🌦️'; // Showers
    if (icon >= 85 && icon <= 86) return '❄️'; // Snow
    if (icon >= 95) return '⛈️'; // Thunderstorm
    return '☁️'; // Default
  }

  // If icon is a string (icon name)
  const iconMap: Record<string, string> = {
    'clear': '☀️',
    'cloudy': '☁️',
    'partly-cloudy': '⛅',
    'fog': '🌫️',
    'rain': '🌧️',
    'showers': '🌦️',
    'snow': '❄️',
    'thunderstorm': '⛈️'
  };

  return iconMap[icon] || '☁️';
}
</script>

<template>
  <div class="weather-card hourly-forecast">
    <h2>24h Forecast</h2>

    <div class="forecast-grid">
      <div v-for="(hour, index) in hourlyData" :key="index" class="forecast-item">
        <div class="forecast-time">{{ hour.time }}</div>
        <div class="forecast-icon">
          {{ getWeatherIcon(hour.icon) }}
        </div>
        <div class="forecast-temp">{{ formatTemperature(hour.temp, unit) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hourly-forecast {
  margin-top: var(--spacing-md);
}

.forecast-grid {
  display: flex;
  overflow-x: auto;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) 0;
}

.forecast-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius);
  min-width: 80px;
  transition: transform 0.2s ease;
}

.forecast-time {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.forecast-icon {
  font-size: 1.5rem;
  margin: var(--spacing-sm) 0;
}

.forecast-temp {
  font-weight: 600;
}

@media (max-width: 480px) {
  .forecast-item {
    min-width: 70px;
  }
}
</style>
