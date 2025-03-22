<template>
  <div class="weather-card">
    <h2 class="weather-title">7-Day Weather Forecast</h2>

    <div v-if="loading" class="loading">Loading weather data...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="forecast-container">
      <div v-for="(day, index) in forecast" :key="index" class="day-card">
        <div class="day-name">{{ formatDate(day.date) }}</div>
        <div class="weather-icon">
          <img :src="getWeatherIconSrc(day.weatherCode)" :alt="day.description" />
        </div>
        <div class="temperature">
          <span class="temp-max">{{ formatTemp(day.tempMax) }}</span>
          <span class="temp-min">{{ formatTemp(day.tempMin) }}</span>
        </div>
        <div class="weather-description">{{ day.description }}</div>
        <div class="precipitation" v-if="day.precipitationSum > 0">
          <span>{{ day.precipitationSum }}mm</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import weatherService from '../../services/weatherApi';

// Define the forecast day interface inline
interface ForecastDay {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  description: string;
}

export default defineComponent({
  name: 'WeatherForecast',

  setup() {
    const forecast = ref<ForecastDay[]>([]);
    const loading = ref(true);
    const error = ref<string | null>(null);
    const city = ref('Raleigh');
    const temperatureUnit = ref<'celsius' | 'fahrenheit'>('fahrenheit');

    const tempUnitSymbol = computed(() => {
      return temperatureUnit.value === 'celsius' ? 'C' : 'F';
    });

    const fetchWeatherForCity = async () => {
      try {
        loading.value = true;
        error.value = null;

        // Get the appropriate unit string for the API
        const unitStr = temperatureUnit.value === 'celsius' ? 'celsius' : 'fahrenheit';

        // Fetch weather data
        const data = await weatherService.getWeatherByCity(city.value, unitStr);

        // Process daily forecast
        forecast.value = weatherService.processDailyForecast(data);

        loading.value = false;
      } catch (err) {
        error.value = `Error fetching weather data: ${err instanceof Error ? err.message : String(err)}`;
        loading.value = false;
      }
    };

    const updateTemperatureUnit = () => {
      // Refetch data with the new temperature unit
      fetchWeatherForCity();
    };

    const formatDate = (dateString: string): string => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const formatTemp = (temp: number): string => {
      return `${Math.round(temp)}°${tempUnitSymbol.value}`;
    };

    const getWeatherIconSrc = (code: number): string => {
      // Get the icon name from the weather code
      const iconName = weatherService.getWeatherIconForCode(code);

      // Map icon names to image paths
      const iconMap: Record<string, string> = {
        'clear': 'https://cdn.weatherapi.com/weather/64x64/day/113.png',
        'cloudy': 'https://cdn.weatherapi.com/weather/64x64/day/119.png',
        'fog': 'https://cdn.weatherapi.com/weather/64x64/day/143.png',
        'rain': 'https://cdn.weatherapi.com/weather/64x64/day/176.png',
        'snow': 'https://cdn.weatherapi.com/weather/64x64/day/179.png',
        'showers': 'https://cdn.weatherapi.com/weather/64x64/day/302.png',
        'thunderstorm': 'https://cdn.weatherapi.com/weather/64x64/day/200.png'
      };

      return iconMap[iconName] || 'https://cdn.weatherapi.com/weather/64x64/day/113.png';
    };

    // Fetch data on component creation
    onMounted(() => {
      fetchWeatherForCity();
    });

    return {
      forecast,
      loading,
      error,
      city,
      temperatureUnit,
      tempUnitSymbol,
      fetchWeatherForCity,
      updateTemperatureUnit,
      getWeatherIconSrc,
      formatDate,
      formatTemp
    };
  }
});
</script>

<style scoped>
.weather-card {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}
.weather-title {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}
.location-search {
  display: flex;
  margin-bottom: 20px;
  justify-content: center;
}
.city-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  width: 60%;
  font-size: 16px;
}
.search-btn {
  padding: 8px 16px;
  background-color: #4a6fa5;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 16px;
}
.search-btn:hover {
  background-color: #3a5a80;
}
.temp-unit-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  gap: 20px;
}
.unit-label {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.forecast-container {
  display: flex;
  overflow-x: auto;
  gap: 12px;
  padding-bottom: 10px;
}
.day-card {
  min-width: 120px;
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.day-name {
  font-weight: bold;
  margin-bottom: 8px;
}
.weather-icon {
  width: 64px;
  height: 64px;
  margin: 10px 0;
}
.weather-icon img {
  width: 100%;
  height: 100%;
}
.temperature {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.temp-max {
  font-weight: bold;
  color: #e03e3e;
}
.temp-min {
  color: #3e7be0;
}
.weather-description {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
}
.precipitation {
  font-size: 14px;
  color: #3e7be0;
}
.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}
.error {
  color: #e03e3e;
}
</style>
