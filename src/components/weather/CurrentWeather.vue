<script setup lang="ts">
import { formatTemperature } from '@/utils/temperatureConverter';

interface WeatherData {
  temperature: number;
  condition: string;
  feelsLike: number;
  high?: number;
  low?: number;
  windspeed?: number;
  winddirection?: number;
  relativeHumidity?: number;
  pressure?: number;
  uvIndex?: number;
}

defineProps<{
  weather: WeatherData,
  unit: string
}>();

// Function to get appropriate weather icon based on condition
const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();

  if (lowerCondition.includes('clear')) return '☀️';
  if (lowerCondition.includes('partly cloudy')) return '⛅';
  if (lowerCondition.includes('cloud')) return '☁️';
  if (lowerCondition.includes('fog')) return '🌫️';
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return '🌧️';
  if (lowerCondition.includes('shower')) return '🌦️';
  if (lowerCondition.includes('snow')) return '❄️';
  if (lowerCondition.includes('thunder')) return '⛈️';

  // Default
  return '☀️';
};
</script>

<template>
  <div class="weather-card current-weather">
    <div class="weather-main">
      <div class="weather-icon-container">
        <div class="weather-icon">
          <span class="weather-emoji">{{ getWeatherIcon(weather.condition) }}</span>
        </div>
      </div>
      <div class="weather-data">
        <div class="temperature">
          <span class="current-temp">{{ formatTemperature(weather.temperature, unit) }}</span>
          <p>{{ weather.condition }}</p>
        </div>
        <div class="condition">
          <div class="temperature-range" v-if="weather.high !== undefined && weather.low !== undefined">
            <span class="high-temp">↑ {{ Math.round(weather.high) }}°{{ unit }}</span>
            <span class="low-temp">↓ {{ Math.round(weather.low) }}°{{ unit }}</span>
          </div>
          <p class="feels-like">Feels like {{ formatTemperature(weather.feelsLike, unit) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.current-weather {
  display: flex;
  flex-direction: column;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.weather-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
}

.weather-emoji {
  font-size: 4rem;
}

.weather-data {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
}

.temperature {
  display: flex;
  flex-direction: column;
}

.current-temp {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
}

.temperature-range {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.high-temp {
  color: #e53e3e;
}

.low-temp {
  color: #3182ce;
}

.condition {
  display: flex;
  flex-direction: column;
  font-size: 1.1rem;
}

.condition p {
  margin: 0;
}

.feels-like {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .weather-main {
    flex-direction: column;
    text-align: center;
  }

  .weather-data {
    flex-direction: column;
    width: 100%;
  }
}
</style>
