<template>
  <div class="sunrise-sunset">
    <h3>{{ title }}</h3>
    <div class="sun-info">
      <div class="sun-card sunrise">
        <div class="icon">
          <svg viewBox="0 0 24 24" width="36" height="36" class="sun-icon">
            <path fill="currentColor" d="M3,12H7A5,5 0 0,1 12,7A5,5 0 0,1 17,12H21A1,1 0 0,1 22,13A1,1 0 0,1 21,14H3A1,1 0 0,1 2,13A1,1 0 0,1 3,12M15,12A3,3 0 0,0 12,9A3,3 0 0,0 9,12H15M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M12.71,16.3L15.82,19.41C16.21,19.8 16.21,20.43 15.82,20.82C15.43,21.21 14.8,21.21 14.41,20.82L12,18.41L9.59,20.82C9.2,21.21 8.57,21.21 8.18,20.82C7.79,20.43 7.79,19.8 8.18,19.41L11.29,16.3C11.68,15.91 12.32,15.91 12.71,16.3Z" />
          </svg>
        </div>
        <div class="info">
          <div class="label">Sunrise</div>
          <div class="time">{{ formattedSunrise }}</div>
        </div>
      </div>
      <div class="sun-card sunset">
        <div class="icon">
          <svg viewBox="0 0 24 24" width="36" height="36" class="sun-icon">
            <path fill="currentColor" d="M3,12H7A5,5 0 0,1 12,7A5,5 0 0,1 17,12H21A1,1 0 0,1 22,13A1,1 0 0,1 21,14H3A1,1 0 0,1 2,13A1,1 0 0,1 3,12M15,12A3,3 0 0,0 12,9A3,3 0 0,0 9,12H15M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M12,16A3,3 0 0,0 9,19H15A3,3 0 0,0 12,16M12,19A5,5 0 0,1 7,14H3A1,1 0 0,0 2,15A1,1 0 0,0 3,16H21A1,1 0 0,0 22,15A1,1 0 0,0 21,14H17A5,5 0 0,1 12,19Z" />
          </svg>
        </div>
        <div class="info">
          <div class="label">Sunset</div>
          <div class="time">{{ formattedSunset }}</div>
        </div>
      </div>
      <div class="sun-card day-length">
        <div class="icon">
          <svg viewBox="0 0 24 24" width="36" height="36" class="sun-icon">
            <path fill="currentColor" d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22M19,16.5C19.89,15.85 20.67,15.04 21.28,14.13L20.5,12L21.28,9.87C20.67,8.96 19.89,8.15 19,7.5C18.33,6.73 17.55,6.11 16.69,5.66L16.5,5.75L16.31,5.66C15.45,6.11 14.67,6.73 14,7.5C13.56,8 13.18,8.53 12.84,9.13C12.58,9.57 12.36,10 12.16,10.5C12.06,10.81 11.97,11.12 11.9,11.44C11.81,11.81 11.76,12.19 11.72,12.58C11.67,13.04 11.67,13.5 11.72,13.96C11.76,14.35 11.81,14.73 11.9,15.1C11.97,15.42 12.06,15.73 12.16,16.04C12.36,16.54 12.58,17 12.84,17.43C13.18,18.03 13.56,18.57 14,19.07C14.67,19.83 15.45,20.46 16.31,20.91L16.5,21L16.69,20.91C17.55,20.46 18.33,19.83 19,19.07V16.5M20.03,7.22C20.46,7.63 20.86,8.07 21.21,8.56L19.66,8.36L20.03,7.22M18.06,5.31C18.5,5.69 18.91,6.11 19.28,6.58L18.7,6.42L18.06,5.31M17.74,19.43C18.21,19.03 18.64,18.6 19.03,18.12L18.93,15.91C18.29,16.39 17.57,16.78 16.8,17.06L17.74,19.43M21.22,17.13C20.88,17.62 20.47,18.06 20.04,18.47L20.5,21L21.22,17.13Z" />
          </svg>
        </div>
        <div class="info">
          <div class="label">Day Length</div>
          <div class="time">{{ formattedDayLength }}</div>
        </div>
      </div>
    </div>
    <div v-if="showMultipleDays" class="multi-day-container">
      <table class="sun-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Sunrise</th>
            <th>Sunset</th>
            <th>Day Length</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(day, index) in multiDayData" :key="index">
            <td>{{ formatDate(day.date) }}</td>
            <td>{{ formatTime(day.sunrise) }}</td>
            <td>{{ formatTime(day.sunset) }}</td>
            <td>{{ formatDayLength(day.sunrise, day.sunset) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import type { PropType } from 'vue';

// Define the multiDayData item interface
interface DayData {
  date: string | number | Date;
  sunrise: string | number | Date;
  sunset: string | number | Date;
}

type TimeValueType = string | number | Date | undefined | null;

export default defineComponent({
  name: 'SunriseSunset',
  props: {
    sunrise: {
      type: [String, Number, Date] as PropType<TimeValueType>,
      required: false,
      default: null
    },
    sunset: {
      type: [String, Number, Date] as PropType<TimeValueType>,
      required: false,
      default: null
    },
    title: {
      type: String,
      default: 'Sunrise & Sunset'
    },
    timeFormat: {
      type: String,
      default: '24h',
      validator: (value: string) => ['12h', '24h'].includes(value)
    },
    multiDayData: {
      type: Array as PropType<DayData[]>,
      default: () => []
    },
    showMultipleDays: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    formattedSunrise() {
      return this.sunrise ? this.formatTime(this.sunrise) : '--:--';
    },
    formattedSunset() {
      return this.sunset ? this.formatTime(this.sunset) : '--:--';
    },
    formattedDayLength() {
      if (this.sunrise && this.sunset) {
        return this.formatDayLength(this.sunrise, this.sunset);
      }
      return '--:--';
    }
  },
  methods: {
    formatTime(timeValue: TimeValueType): string {
      let date: Date;

      if (typeof timeValue === 'string') {
        if (timeValue.includes('T')) {
          // ISO string format
          date = new Date(timeValue);
        } else if (timeValue.includes(':')) {
          // Time string like "07:30"
          const today = new Date();
          const [hours, minutes] = timeValue.split(':').map(Number);
          date = new Date(today.setHours(hours, minutes, 0, 0));
        } else {
          // Unix timestamp as string
          date = new Date(parseInt(timeValue, 10) * 1000);
        }
      } else if (typeof timeValue === 'number') {
        // Unix timestamp as number
        date = new Date(timeValue * 1000);
      } else if (timeValue instanceof Date) {
        date = timeValue;
      } else {
        return '--:--';
      }

      if (this.timeFormat === '12h') {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      }
    },

    formatDate(dateValue: TimeValueType): string {
      let date: Date;

      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        date = new Date(dateValue * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return '--/--/--';
      }

      return date.toLocaleDateString();
    },

    formatDayLength(sunrise: TimeValueType, sunset: TimeValueType): string {
      let sunriseDate: Date | null = null;
      let sunsetDate: Date | null = null;

      // Parse sunrise
      if (typeof sunrise === 'string') {
        if (sunrise.includes('T')) {
          sunriseDate = new Date(sunrise);
        } else if (sunrise.includes(':')) {
          const today = new Date();
          const [hours, minutes] = sunrise.split(':').map(Number);
          sunriseDate = new Date(today.setHours(hours, minutes, 0, 0));
        } else {
          sunriseDate = new Date(parseInt(sunrise, 10) * 1000);
        }
      } else if (typeof sunrise === 'number') {
        sunriseDate = new Date(sunrise * 1000);
      } else if (sunrise instanceof Date) {
        sunriseDate = sunrise;
      } else {
        return '--:--';
      }

      // Parse sunset
      if (typeof sunset === 'string') {
        if (sunset.includes('T')) {
          sunsetDate = new Date(sunset);
        } else if (sunset.includes(':')) {
          const today = new Date();
          const [hours, minutes] = sunset.split(':').map(Number);
          sunsetDate = new Date(today.setHours(hours, minutes, 0, 0));
        } else {
          sunsetDate = new Date(parseInt(sunset, 10) * 1000);
        }
      } else if (typeof sunset === 'number') {
        sunsetDate = new Date(sunset * 1000);
      } else if (sunset instanceof Date) {
        sunsetDate = sunset;
      } else {
        return '--:--';
      }

      if (!sunriseDate || !sunsetDate) {
        return '--:--';
      }

      // Calculate difference in milliseconds
      const diff = sunsetDate.getTime() - sunriseDate.getTime();

      // Convert to hours and minutes
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      return `${hours}h ${minutes}m`;
    }
  }
});
</script>

<style scoped>
.sunrise-sunset {
  width: 100%;
  margin-bottom: 20px;
}
h3 {
  text-align: center;
  margin-bottom: 15px;
}
.sun-info {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
}
.sun-card {
  display: flex;
  align-items: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
  min-width: 150px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.sunrise .icon {
  color: #ff9800;
}
.sunset .icon {
  color: #f44336;
}
.day-length .icon {
  color: #2196f3;
}
.icon {
  margin-right: 15px;
}
.info .label {
  font-size: 0.9em;
  color: #666;
}
.info .time {
  font-size: 1.2em;
  font-weight: bold;
}
.multi-day-container {
  margin-top: 20px;
}
.sun-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.sun-table th,
.sun-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #eee;
}
.sun-table th {
  background-color: #f8f9fa;
  font-weight: bold;
}
@media (max-width: 768px) {
  .sun-info {
    flex-direction: column;
  }
  .sun-card {
    width: 100%;
  }
}
</style>
