<script setup lang="ts">
import { ref, watch } from 'vue'
import { useWeatherStore } from '@/stores/weather'
import { useRouter } from 'vue-router'

// Get weather store
const weatherStore = useWeatherStore()
const router = useRouter()

// Search functionality
const searchQuery = ref('')
const isSearching = ref(false)

// Search cities
const searchCities = [
  'Raleigh, NC, USA',
  'New York, NY, USA',
  'Los Angeles, CA, USA',
  'Chicago, IL, USA',
  'London, UK',
  'Paris, France',
  'Tokyo, Japan',
  'Sydney, Australia'
]

// Filtered cities based on search
const filteredCities = ref<string[]>([])

watch(searchQuery, (newQuery) => {
  if (newQuery.trim().length > 0) {
    filteredCities.value = searchCities.filter(city =>
      city.toLowerCase().includes(newQuery.toLowerCase())
    )
    isSearching.value = true
  } else {
    filteredCities.value = []
    isSearching.value = false
  }
})

// Handle city selection
const selectCity = (city: string) => {
  searchQuery.value = city
  weatherStore.fetchWeatherData(city)
  isSearching.value = false
  filteredCities.value = []

  // Navigate to home page to show the new city's weather
  if (router.currentRoute.value.path !== '/') {
    router.push('/')
  }
}

// Handle keydown events
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && searchQuery.value.trim().length > 0) {
    if (filteredCities.value.length > 0) {
      selectCity(filteredCities.value[0])
    } else {
      // If no match in our list, still try to search for the entered city
      selectCity(searchQuery.value)
    }
  } else if (event.key === 'Escape') {
    isSearching.value = false
  }
}

// Handle blur event to hide dropdown when clicked outside
const handleBlur = () => {
  // Small delay to allow click events on dropdown items to register
  setTimeout(() => {
    isSearching.value = false
  }, 200)
}
</script>

<template>
  <div class="header">
    <div class="logo">
      <span class="logo-emoji">🌦️</span>
      <span class="logo-text">WeatherScope</span>
    </div>

    <!--Search, notification and profile icons-->
    <div class="header-right">
      <div class="search-container">
        <span>📍</span>
        <input
          type="text"
          id="location-search"
          v-model="searchQuery"
          placeholder="Search location..."
          @keydown="handleKeyDown"
          @blur="handleBlur"
        />
        <div v-if="isSearching && filteredCities.length > 0" class="search-dropdown">
          <div
            v-for="city in filteredCities"
            :key="city"
            class="search-result"
            @click="selectCity(city)"
          >
            {{ city }}
          </div>
        </div>
      </div>

      <div class="user-controls">
        <div class="notifications">
          <i class="far fa-bell"></i>
        </div>

        <div class="profile">
          <i class="far fa-user"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    background-color: white;
    border-bottom: 1px solid #e5e5e5;
  }

/* Logo Section */
.logo {
    display: flex;
    align-items: center;
    font-size: 1.5em;
    font-weight: bold;
}

.logo img {
    width: 32px;
    margin-right: 8px;
}

/* Right side of the header */
.header-right{
    display:flex;
    padding: 5px;
}

.search-container {
    display: flex;
    align-items: center;
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 8px 15px;
    width: 300px;
    margin-right: 10px;
}

.search-container i {
    color: #999;
    margin-right: 8px;
}

.search-container input {
    border: none;
    background: transparent;
    width: 100%;
    outline: none;
}

.user-controls {
    display: flex;
    align-items: center;
}

.user-controls .notifications {
    margin-right: 10px;
    font-size: 1.2em;
    color: #333;
    padding:5px;
}

.user-controls .profile {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background-color: #e1e5eb;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
