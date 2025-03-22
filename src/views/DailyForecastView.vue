<script setup lang="ts">
import PageInfo from '@/components/layout/PageInfo.vue'
import TemperatureChart from '@/components/weather/TemperatureChart.vue'
import PrecipitationChart from '@/components/weather/PrecipitationChart.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { storeToRefs } from 'pinia'

// Get the weather store
const weatherStore = useWeatherStore()
const {
  dailyForecast,
  locationName,
  formattedDate,
  formattedTime,
  isLoading,
  error,
  temperatureUnit
} = storeToRefs(weatherStore)

// Local state for navigation
const selectedTab = ref('daily')
const unit = ref(temperatureUnit.value === 'celsius' ? 'C' : 'F')

// Watch for changes to the unit
watch(unit, (newUnit) => {
  weatherStore.setTemperatureUnit(newUnit === 'C' ? 'celsius' : 'fahrenheit')
})

// Watch for changes to temperature unit in store
watch(temperatureUnit, (newUnit) => {
  unit.value = newUnit === 'celsius' ? 'C' : 'F'
})

// Extract data for charts
const tempMaxData = computed(() => {
  if (!dailyForecast.value || dailyForecast.value.length === 0) return []
  return dailyForecast.value.map(day => day.high)
})

const tempMinData = computed(() => {
  if (!dailyForecast.value || dailyForecast.value.length === 0) return []
  return dailyForecast.value.map(day => day.low)
})

const dayLabels = computed(() => {
  if (!dailyForecast.value || dailyForecast.value.length === 0) return []
  return dailyForecast.value.map(day => day.day)
})

// Placeholder precipitation data (since API doesn't provide it directly)
const precipData = computed(() => {
  if (!dailyForecast.value || dailyForecast.value.length === 0) return []
  // Simply return an array of zeros matching the daily data length
  return new Array(dailyForecast.value.length).fill(0)
})

// Get weather icon based on condition text
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

// Load data on component mount if not already loaded
onMounted(() => {
  if (!dailyForecast.value || dailyForecast.value.length === 0) {
    weatherStore.fetchWeatherData(locationName.value)
  }
})
</script>

<template>
  <div class="daily-view">
    <PageInfo
      :location="locationName"
      :date="formattedDate"
      :lastUpdated="formattedTime"
      :selectedTab="selectedTab"
      :unit="unit"
      @update:selectedTab="selectedTab = $event"
      @update:unit="unit = $event"
    />

    <div v-if="isLoading" class="loading-state">
      <p>Loading weather data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else-if="dailyForecast && dailyForecast.length > 0">
      <!-- 7-Day Forecast cards -->
      <div class="weather-card">
        <h2>7-Day Weather Forecast</h2>
        <div class="forecast-container">
          <div v-for="(day, index) in dailyForecast" :key="index" class="day-card">
            <div class="day-name">{{ day.day }}</div>
            <div class="weather-icon">
              {{ getWeatherIcon(day.condition) }}
            </div>
            <div class="temperature">
              <span class="temp-max">{{ Math.round(day.high) }}°{{ unit }}</span>
              <span class="temp-min">{{ Math.round(day.low) }}°{{ unit }}</span>
            </div>
            <div class="weather-description">{{ day.condition }}</div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <TemperatureChart
        :tempData="tempMaxData"
        :timeLabels="dayLabels"
        :temperatureUnit="unit"
        title="7-Day High Temperature"
      />

      <TemperatureChart
        :tempData="tempMinData"
        :timeLabels="dayLabels"
        :temperatureUnit="unit"
        title="7-Day Low Temperature"
      />

      <PrecipitationChart
        :chartData="precipData"
        :timeLabels="dayLabels"
        timeUnit="daily"
        title="7-Day Precipitation"
      />
    </div>
  </div>
</template>

<style scoped>
.daily-view {
  padding: var(--spacing-md) 0;
}

.loading-state, .error-state {
  padding: var(--spacing-lg);
  text-align: center;
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  margin-bottom: var(--spacing-md);
}

.error-state {
  color: #e53e3e;
}

.weather-card {
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.forecast-container {
  display: flex;
  overflow-x: auto;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
}

.day-card {
  min-width: 120px;
  background-color: var(--color-background);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.day-name {
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
}

.weather-icon {
  font-size: 2rem;
  margin: var(--spacing-sm) 0;
}

.temperature {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.temp-max {
  font-weight: bold;
  color: #e03e3e;
}

.temp-min {
  color: #3e7be0;
}

.weather-description {
  font-size: 0.9rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-sm);
}

@media (max-width: 768px) {
  .forecast-container {
    padding-bottom: var(--spacing-sm);
  }

  .day-card {
    min-width: 110px;
  }
}

@media (max-width: 480px) {
  .day-card {
    min-width: 100px;
  }
}
</style>
