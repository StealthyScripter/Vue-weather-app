<!-- RouteWeatherTimeline.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { useWeatherStore } from '@/stores/weather';
import { storeToRefs } from 'pinia';
import { getWeatherAtTime } from '@/utils/mapUtils';
import { formatTemperature } from '@/utils/temperatureConverter';

const props = defineProps<{
  routePoints: any[];
  etaTime: Date | null;
  routeDuration: number; // in minutes
  timeInterval: number; // in minutes, default 60
}>();

// Get the weather store
const weatherStore = useWeatherStore();
const { hourlyForecast, temperatureUnit } = storeToRefs(weatherStore);

// Generate timeline points based on route duration and interval
const timelinePoints = computed(() => {
  if (!props.etaTime || props.routeDuration <= 0) {
    return [];
  }

  const points = [];
  const now = new Date();
  const etaMs = props.etaTime.getTime();
  const startMs = now.getTime();
  const durationMs = etaMs - startMs;

  // Calculate number of points based on duration and interval
  const numPoints = Math.ceil(props.routeDuration / props.timeInterval);

  // Create a point for each interval
  for (let i = 0; i <= numPoints; i++) {
    const progress = i / numPoints;
    const pointTimeMs = startMs + (durationMs * progress);
    const pointTime = new Date(pointTimeMs);

    // Calculate position along route
    const routeIndex = Math.floor(progress * (props.routePoints.length - 1));
    const routePoint = props.routePoints[routeIndex];

    // Get weather for this time
    const weather = getWeatherAtTime(hourlyForecast.value, pointTime);

    points.push({
      time: pointTime,
      formattedTime: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      location: routePoint ? { lng: routePoint[0], lat: routePoint[1] } : null,
      weather: weather,
      progress: Math.round(progress * 100)
    });
  }

  return points;
});

// Weather condition icon mapping
const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition?.toLowerCase() || '';

  if (lowerCondition.includes('clear')) return '☀️';
  if (lowerCondition.includes('partly cloudy')) return '⛅';
  if (lowerCondition.includes('cloud')) return '☁️';
  if (lowerCondition.includes('fog')) return '🌫️';
  if (lowerCondition.includes('rain')) return '🌧️';
  if (lowerCondition.includes('shower')) return '🌦️';
  if (lowerCondition.includes('snow')) return '❄️';
  if (lowerCondition.includes('thunder')) return '⛈️';

  return '☁️'; // Default
};

// Format temperature with unit
const formatTemp = (temp: number) => {
  return formatTemperature(temp, temperatureUnit.value === 'celsius' ? 'C' : 'F');
};

// Emit for selecting a specific forecast point
const emit = defineEmits<{
  (e: 'selectPoint', point: any): void;
}>();

const selectPoint = (point: any) => {
  emit('selectPoint', point);
};
</script>

<template>
  <div class="route-timeline">
    <h3>Weather Along Route</h3>

    <div class="timeline-cards">
      <div
        v-for="(point, index) in timelinePoints"
        :key="index"
        class="timeline-card"
        @click="selectPoint(point)"
      >
        <div class="timeline-time">{{ point.formattedTime }}</div>
        <div class="timeline-progress">{{ point.progress }}%</div>
        <div class="timeline-weather">
          <div class="weather-icon" v-if="point.weather?.condition">
            {{ getWeatherIcon(point.weather.condition) }}
          </div>
          <div class="weather-temp" v-if="point.weather?.temp !== undefined">
            {{ formatTemp(point.weather.temp) }}
          </div>
          <div class="weather-condition" v-if="point.weather?.condition">
            {{ point.weather.condition }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.route-timeline {
  background-color: var(--color-card);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  box-shadow: var(--shadow);
}

h3 {
  margin-top: 0;
  margin-bottom: var(--spacing-md);
  font-size: 1.2rem;
}

.timeline-cards {
  display: flex;
  overflow-x: auto;
  gap: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  scrollbar-width: thin;
}

.timeline-card {
  min-width: 120px;
  background-color: var(--color-background);
  border-radius: var(--border-radius);
  padding: var(--spacing-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s ease;
  border: 1px solid var(--color-border);
}

.timeline-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.timeline-time {
  font-weight: bold;
  margin-bottom: var(--spacing-sm);
}

.timeline-progress {
  font-size: 0.8rem;
  color: var(--color-text-light);
  margin-bottom: var(--spacing-sm);
}

.timeline-weather {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.weather-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
}

.weather-temp {
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 4px;
}

.weather-condition {
  font-size: 0.9rem;
  color: var(--color-text-light);
}
</style>
