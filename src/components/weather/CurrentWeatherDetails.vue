<script setup lang="ts">
interface WeatherDetails {
  wind: {
    speed: number;
    direction: string;
  };
  humidity: number;
  uvIndex: number;
  pressure: number;
}

defineProps<{
  details: WeatherDetails | null
}>();
</script>

<template>
  <div v-if="details" class="weather-card weather-details">
    <div class="details-grid">
      <div class="detail-item">
        <div class="detail-icon">
          <!-- Wind icon -->
          <span class="detail-emoji">💨</span>
        </div>
        <div class="detail-data">
          <div class="detail-value">{{ Math.round(details.wind.speed) }} km/h</div>
          <div class="detail-label">{{ details.wind.direction }}</div>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <!-- Humidity icon -->
          <span class="detail-emoji">💧</span>
        </div>
        <div class="detail-data">
          <div class="detail-value">{{ Math.round(details.humidity) }}%</div>
          <div class="detail-label">Humidity</div>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <!-- UV index icon -->
          <span class="detail-emoji">☀️</span>
        </div>
        <div class="detail-data">
          <div class="detail-value">{{ Math.round(details.uvIndex) }}</div>
          <div class="detail-label">UV Index</div>
        </div>
      </div>

      <div class="detail-item">
        <div class="detail-icon">
          <!-- Pressure icon -->
          <span class="detail-emoji">📊</span>
        </div>
        <div class="detail-data">
          <div class="detail-value">{{ Math.round(details.pressure) }} hPa</div>
          <div class="detail-label">Pressure</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.weather-details {
  margin-top: var(--spacing-md);
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-md);
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--spacing-md);
}

.detail-icon {
  margin-bottom: var(--spacing-sm);
  color: var(--color-secondary);
}

.detail-emoji {
  font-size: 1.8rem;
}

.detail-value {
  font-size: 1.3rem;
  font-weight: 600;
}

.detail-label {
  font-size: 0.9rem;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
