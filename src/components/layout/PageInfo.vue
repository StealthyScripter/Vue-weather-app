<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();

defineProps<{
  location: string;
  date: string;
  lastUpdated: string;
  selectedTab: string;
  unit: string;
}>();

const emit = defineEmits<{
  (e: 'update:selectedTab', tab: string): void;
  (e: 'update:unit', unit: string): void;
}>();

const changeUnit = (unit: string) => {
  emit('update:unit', unit);
};
</script>

<template>
  <div class="location-header">
    <!-- Location Info -->
    <div>
      <h1 id="location-name">{{ location }} <span class="favorite-icon">☆</span></h1>
      <p class="date-info">{{ date }} | Last updated: {{ lastUpdated }}</p>
    </div>

    <!-- Weather Tabs -->
    <div class="navigation-tabs">
      <router-link
        to="/"
        class="nav-tab"
        :class="{ active: route.path === '/' }"
      >
        Current
    </router-link>
      <router-link
        to="/daily"
        class="nav-tab"
        :class="{ active: route.path === '/daily' }"
      >
        7 Day
      </router-link>
      <router-link
        to="/map-view"
        class="nav-tab"
        :class="{ active: route.path === '/map-view' }"
      >
        Map View
      </router-link>
    </div>

    <!-- Temperature Units -->
    <div style="margin-left: auto;">
      <div class="temp-unit-toggle">
        <button id="celsius-btn" class="unit-button" :class="{ active: unit === 'C' }" @click="changeUnit('C')">°C</button>
        <button id="fahrenheit-btn" class="unit-button" :class="{ active: unit === 'F' }" @click="changeUnit('F')">°F</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*Location section */
.location-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.location-header h1 {
    font-size: 1.8em;
    font-weight: bold;
    margin-right: 10px;
}

.location-header .star {
    color: #ccc;
    font-size: 1.2em;
}

.location-header .date-info {
    color: #666;
    font-size: 0.9em;
    margin-top: 5px;
}

.star {
    cursor: pointer;
    transition: color 0.3s ease;
}

.star.active {
    color: gold;
}

.navigation-tabs {
    display: flex;
    margin: 0 auto;
    background-color: #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
}

.nav-tab {
    padding: 5px;
    text-decoration: none;
    color: #555;
    font-weight: 500;
    transition: all 0.3s ease;

}

.nav-tab:hover {
    background-color: #e0e0e0;
}

.nav-tab.active {
    background-color: #4a6fa5;
    color: white;
}


.temp-unit-toggle {
    display: flex;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #ddd;
}

.temp-unit-toggle button {
    padding: 8px 12px;
    border: none;
    background: white;
    cursor: pointer;
}

.temp-unit-toggle button.active {
    background-color: #f0f0f0;
}
</style>
