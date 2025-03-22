<script setup lang="ts">
import CurrentWeather from '../components/weather/CurrentWeather.vue'
import CurrentWeatherDetails from '../components/weather/CurrentWeatherDetails.vue'
import PageInfo from '@/components/layout/PageInfo.vue'
import TemperatureChart from '../components/weather/TemperatureChart.vue'
import PrecipitationChart from '../components/weather/PrecipitationChart.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { storeToRefs } from 'pinia'
import HourlyForecast from '@/components/weather/HourlyForecast.vue'

// Get the weather store
const weatherStore = useWeatherStore()
const {
  currentWeather,
  locationName,
  formattedDate,
  formattedTime,
  weatherDetails,
  hourlyForecast,
  isLoading,
  error,
  temperatureUnit,
} = storeToRefs(weatherStore)

// Local state for navigation
const selectedTab = ref('current')
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
const hourlyTemps = computed(() => {
  if (!hourlyForecast.value || hourlyForecast.value.length === 0) return []
  return hourlyForecast.value.map(hour => hour.temp)
})

const timeLabels = computed(() => {
  if (!hourlyForecast.value || hourlyForecast.value.length === 0) return []
  return hourlyForecast.value.map(hour => hour.time)
})

// Placeholder precipitation data (since API doesn't provide it directly)
const precipData = computed(() => {
  if (!hourlyForecast.value || hourlyForecast.value.length === 0) return []
  // Simply return an array of zeros matching the hourly data length
  return new Array(hourlyForecast.value.length).fill(0)
})

// Load data on component mount if not already loaded
onMounted(() => {
  if (!currentWeather.value) {
    weatherStore.fetchWeatherData(locationName.value)
  }
})
</script>

<template>
  <div class="home-view">
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

    <div v-else-if="currentWeather">
      <!-- Current weather components -->
      <CurrentWeather :weather="currentWeather" :unit="unit" />
      <CurrentWeatherDetails :details="weatherDetails" />

      <HourlyForecast :hourlyData="hourlyForecast" :unit="unit" />

      <!-- Chart components -->
      <TemperatureChart
        v-if="hourlyForecast && hourlyForecast.length > 0"
        :tempData="hourlyTemps"
        :timeLabels="timeLabels"
        :temperatureUnit="unit"
        title="Today's Temperature"
      />

      <PrecipitationChart
        v-if="hourlyForecast && hourlyForecast.length > 0"
        :chartData="precipData"
        :timeLabels="timeLabels"
        timeUnit="hourly"
        title="Today's Precipitation"
      />
    </div>
  </div>
</template>

<style scoped>
.home-view {
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

.location-info {
  margin-bottom: var(--spacing-lg);
}

.location-info h1 {
  font-size: 1.8rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.favorite-icon {
  color: #ccc;
  cursor: pointer;
  font-size: 1.5rem;
}

.date-info {
  color: var(--color-text-light);
  margin: var(--spacing-sm) 0 0;
  font-size: 0.9rem;
}

.weather-tabs {
  display: flex;
  margin-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
  position: relative;
  padding-bottom: var(--spacing-sm);
}

.weather-section {
  margin-bottom:var(--spacing-lg);
  transition: opacity 0.3s ease-in-out;
  opacity: 0;
}

.weather-section-enter-active, .weather-section-leave-active {
  opacity: 1;
}

.tab {
  padding: var(--spacing-sm) var(--spacing-md);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-light);
}

.tab.active {
  color: var(--color-primary);
  font-weight: 600;
  border-bottom: 2px solid var(--color-primary);
}

.temperature-units {
  margin-left: auto;
  display: flex;
  align-items: center;
}

.unit-button {
  padding: var(--spacing-sm);
  background: none;
  border: 1px solid var(--color-border);
  cursor: pointer;
  font-size: 0.9rem;
}

.unit-button:first-child {
  border-top-left-radius: var(--border-radius);
  border-bottom-left-radius: var(--border-radius);
}

.unit-button:last-child {
  border-top-right-radius: var(--border-radius);
  border-bottom-right-radius: var(--border-radius);
}

.unit-button.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
</style>
