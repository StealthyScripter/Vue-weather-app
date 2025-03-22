import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // User preferences
  const temperatureUnit = ref<'celsius' | 'fahrenheit'>('celsius')
  const windSpeedUnit = ref<'km/h' | 'mph'>('km/h')
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const defaultLocation = ref('Raleigh, NC, USA')
  const recentLocations = ref<string[]>([])
  const favoriteLocations = ref<string[]>([])
  const notificationsEnabled = ref(false)

  // Load settings from localStorage on initialization
  const initSettings = () => {
    const savedSettings = localStorage.getItem('weather-app-settings')
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      temperatureUnit.value = settings.temperatureUnit || 'celsius'
      windSpeedUnit.value = settings.windSpeedUnit || 'km/h'
      theme.value = settings.theme || 'system'
      defaultLocation.value = settings.defaultLocation || 'Raleigh, NC, USA'
      recentLocations.value = settings.recentLocations || []
      favoriteLocations.value = settings.favoriteLocations || []
      notificationsEnabled.value = settings.notificationsEnabled || false
    }
  }

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      temperatureUnit: temperatureUnit.value,
      windSpeedUnit: windSpeedUnit.value,
      theme: theme.value,
      defaultLocation: defaultLocation.value,
      recentLocations: recentLocations.value,
      favoriteLocations: favoriteLocations.value,
      notificationsEnabled: notificationsEnabled.value
    }

    localStorage.setItem('weather-app-settings', JSON.stringify(settings))
  }

  const updateSetting = <T>(key: string, value: T) => {
    // Create a type-safe way to update settings
    if (key === 'temperatureUnit') temperatureUnit.value = value as typeof temperatureUnit.value
    else if (key === 'windSpeedUnit') windSpeedUnit.value = value as typeof windSpeedUnit.value
    else if (key === 'theme') theme.value = value as typeof theme.value
    else if (key === 'defaultLocation') defaultLocation.value = value as string
    else if (key === 'recentLocations') recentLocations.value = value as string[]
    else if (key === 'favoriteLocations') favoriteLocations.value = value as string[]
    else if (key === 'notificationsEnabled') notificationsEnabled.value = value as boolean

    saveSettings()
  }

  // Add a location to recent locations
  const addRecentLocation = (location: string) => {
    if (!recentLocations.value.includes(location)) {
      recentLocations.value = [location, ...recentLocations.value.slice(0, 4)]
      saveSettings()
    }
  }

  // Toggle a location as favorite
  const toggleFavorite = (location: string) => {
    const index = favoriteLocations.value.indexOf(location)
    if (index === -1) {
      favoriteLocations.value.push(location)
    } else {
      favoriteLocations.value.splice(index, 1)
    }
    saveSettings()
  }

  // Check if a location is a favorite
  const isFavorite = (location: string) => {
    return favoriteLocations.value.includes(location)
  }

  // Apply theme based on preference
  const applyTheme = () => {
    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      document.documentElement.classList.toggle('dark', prefersDark)
    } else {
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
    }
  }

  // Initialize settings
  initSettings()
  applyTheme()

  return {
    temperatureUnit,
    windSpeedUnit,
    theme,
    defaultLocation,
    recentLocations,
    favoriteLocations,
    notificationsEnabled,
    updateSetting,
    addRecentLocation,
    toggleFavorite,
    isFavorite,
    applyTheme
  }
})
