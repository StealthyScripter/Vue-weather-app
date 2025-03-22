// src/stores/config.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('config', () => {
  // API keys
  const mapboxToken = ref(import.meta.env.VITE_MAPBOX_TOKEN || '')

  // Other configuration settings
  const apiEndpoints = ref({
    weather: 'https://api.open-meteo.com/v1/forecast',
    geocoding: 'https://api.mapbox.com/geocoding/v5/mapbox.places'
  })

  return {
    mapboxToken,
    apiEndpoints
  }
})
