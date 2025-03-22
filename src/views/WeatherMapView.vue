<!-- WeatherMapView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { storeToRefs } from 'pinia';
import PageInfo from '@/components/layout/PageInfo.vue';
import WeatherMap from '@/components/map/WeatherMap.vue';

// Get the weather store
const weatherStore = useWeatherStore();
const {
  locationName,
  formattedDate,
  formattedTime,
  isLoading,
  error,
  temperatureUnit,
} = storeToRefs(weatherStore);

// Local state for navigation
const selectedTab = ref('map-view');
const unit = ref(temperatureUnit.value === 'celsius' ? 'C' : 'F');

// Watch for changes to the unit
const updateUnit = (newUnit: string) => {
  weatherStore.setTemperatureUnit(newUnit === 'C' ? 'celsius' : 'fahrenheit');
  unit.value = newUnit;
};

// Load weather data on component mount if not already loaded
onMounted(() => {
  if (!weatherStore.currentWeather) {
    weatherStore.fetchWeatherData(locationName.value);
  }
});
</script>

<template>
  <div class="map-view">
    <PageInfo
      :location="locationName"
      :date="formattedDate"
      :lastUpdated="formattedTime"
      :selectedTab="selectedTab"
      :unit="unit"
      @update:selectedTab="selectedTab = $event"
      @update:unit="updateUnit($event)"
    />

    <div v-if="isLoading" class="loading-state">
      <p>Loading weather data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
    </div>

    <div v-else class="weather-map-wrapper">
      <WeatherMap />
    </div>
  </div>
</template>

<style scoped>
.map-view {
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

.weather-map-wrapper {
  height: 70vh;
  min-height: 500px;
}
</style>
