import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getWeatherByCity, getWeatherCodeDescription } from '../services/weatherApi'
import { formatHour } from '@/utils/dateFormatter'

// Define interfaces for better type safety
interface CurrentWeather {
  temperature: number;
  condition: string;
  feelsLike: number;
  windspeed: number;
  winddirection: number;
  pressure: number;
  relativeHumidity: number;
  uvIndex: number;
  high?: number;
  low?: number;
}

interface HourlyForecast {
  time: string;
  temp: number;
  icon: number;
  condition: string;
}

interface DailyForecast {
  day: string;
  high: number;
  low: number;
  icon: number;
  condition: string;
}

interface WeatherDetails {
  wind: {
    speed: number;
    direction: string;
  };
  humidity: number;
  uvIndex: number;
  pressure: number;
}

// Helper function to safely convert to number
function toNumber(value: string | number | undefined): number {
  if (value === undefined) return 0;
  return typeof value === 'string' ? parseFloat(value) : value;
}

export const useWeatherStore = defineStore('weather', () => {
  const currentWeather = ref<CurrentWeather | null>(null)
  const hourlyForecast = ref<HourlyForecast[]>([])
  const dailyForecast = ref<DailyForecast[]>([])
  const locationName = ref('Raleigh, NC, USA')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdated = ref<Date | null>(null)
  const temperatureUnit = ref<'celsius' | 'fahrenheit'>('celsius')

  const formattedDate = computed(() => {
    const now = new Date()
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  })

  const formattedTime = computed(() => {
    return lastUpdated.value ? lastUpdated.value.toLocaleTimeString('en-US') : 'N/A'
  })

  const weatherDetails = computed<WeatherDetails | null>(() => {
    if (!currentWeather.value) return null

    return {
      wind: {
        speed: currentWeather.value.windspeed,
        direction: getWindDirection(currentWeather.value.winddirection)
      },
      humidity: currentWeather.value.relativeHumidity,
      uvIndex: currentWeather.value.uvIndex,
      pressure: currentWeather.value.pressure
    }
  })

  const highTemperature = computed(() => {
    if (!dailyForecast.value.length) return null
    return dailyForecast.value[0].high
  })

  const lowTemperature = computed(() => {
    if (!dailyForecast.value.length) return null
    return dailyForecast.value[0].low
  })

  // Helper functions
  function getWindDirection(degrees: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(degrees / 45) % 8
    return directions[index]
  }

  async function fetchWeatherData(city: string) {
    isLoading.value = true
    error.value = null

    try {
      const data = await getWeatherByCity(city, temperatureUnit.value)

      // Process current weather
      if (data.current) {
        currentWeather.value = {
          temperature: toNumber(data.current.temperature_2m),
          condition: getWeatherCodeDescription(toNumber(data.current.weathercode)),
          feelsLike: toNumber(data.current.apparent_temperature || data.current.temperature_2m),
          windspeed: toNumber(data.current.wind_speed_10m),
          winddirection: toNumber(data.current.wind_direction_10m),
          pressure: toNumber(data.current.pressure_msl),
          relativeHumidity: toNumber(data.current.relative_humidity_2m),
          uvIndex: 0 // Will be updated from daily data
        }
      }

      // Process hourly forecast
      if (data.hourly && data.hourly.time && data.hourly.temperature_2m && data.hourly.weathercode) {
        const times = Array.isArray(data.hourly.time) ? data.hourly.time : [];
        const temps = Array.isArray(data.hourly.temperature_2m) ? data.hourly.temperature_2m : [];
        const codes = Array.isArray(data.hourly.weathercode) ? data.hourly.weathercode : [];

        const hourlyData= times.map((time, index) => {
          const displayTime = index === 0 ? "Now" : formatHour(time);

          return {
            time: displayTime,
            temp: toNumber(temps[index]),
            icon: toNumber(codes[index]),
            condition: getWeatherCodeDescription(toNumber(codes[index]))
    };
            }).slice(0, 24); // Next 24 hours

        hourlyForecast.value = hourlyData;
      }

      // Process daily forecast
      if (data.daily && data.daily.time && data.daily.temperature_2m_max &&
          data.daily.temperature_2m_min && data.daily.weathercode) {
        const dates = data.daily.time as string[];
        const maxTemps = data.daily.temperature_2m_max as number[];
        const minTemps = data.daily.temperature_2m_min as number[];
        const codes = data.daily.weathercode as number[];
        const uvIndices = data.daily.uv_index_max as number[] || [];

        const dailyData = [];
        for (let i = 0; i < dates.length; i++) {
          const date = new Date(dates[i]);
          const day = date.toLocaleDateString('en-US', { weekday: 'short' });

          dailyData.push({
            day,
            high: toNumber(maxTemps[i]),
            low: toNumber(minTemps[i]),
            icon: toNumber(codes[i]),
            condition: getWeatherCodeDescription(toNumber(codes[i]))
          });
        }

        dailyForecast.value = dailyData;

        // Update UV index in current weather if available from daily data
        if (currentWeather.value && uvIndices.length > 0) {
          currentWeather.value.uvIndex = toNumber(uvIndices[0]);
        }

        // Update high/low in current weather
        if (currentWeather.value && maxTemps.length > 0 && minTemps.length > 0) {
          currentWeather.value.high = toNumber(maxTemps[0]);
          currentWeather.value.low = toNumber(minTemps[0]);
        }
      }

      locationName.value = city
      lastUpdated.value = new Date()
    } catch (err) {
      console.error('Error fetching weather data:', err)
      error.value = err instanceof Error ? err.message : 'Failed to fetch weather data'
    } finally {
      isLoading.value = false
    }
  }

  function setTemperatureUnit(unit: 'celsius' | 'fahrenheit') {
    if (temperatureUnit.value !== unit) {
      temperatureUnit.value = unit
      // Refetch data with new unit if we already have data
      if (currentWeather.value) {
        fetchWeatherData(locationName.value)
      }
    }
  }

  //Format hour
  function formatHour(time: string | number): string {
    const date = new Date(time);
    const hours = date.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${formattedHours} ${ampm}`;
  }

  // Initialize with default location
  fetchWeatherData(locationName.value)

  return {
    currentWeather,
    hourlyForecast,
    dailyForecast,
    locationName,
    isLoading,
    error,
    lastUpdated,
    formattedDate,
    formattedTime,
    weatherDetails,
    highTemperature,
    lowTemperature,
    temperatureUnit,
    fetchWeatherData,
    setTemperatureUnit
  }
})
