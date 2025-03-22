import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWeatherStore } from '@/stores/weather'

// Mock the API service
vi.mock('@/services/weatherApi', () => ({
  getWeatherByCity: vi.fn(),
  getWeatherCodeDescription: vi.fn((code) => {
    const weatherCodes = {
      0: 'Clear Sky',
      1: 'Mainly Clear',
      61: 'Slight Rain'
    }
    return weatherCodes[code] || 'Unknown'
  })
}))

import { getWeatherByCity } from '@/services/weatherApi'

describe('Weather Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())

    // Reset the mock
    vi.mocked(getWeatherByCity).mockReset()
  })

  it('initializes with default values', () => {
    const store = useWeatherStore()

    expect(store.currentWeather).toBe(null)
    expect(store.hourlyForecast).toEqual([])
    expect(store.dailyForecast).toEqual([])
    expect(store.locationName).toBe('Raleigh, NC, USA')
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)
  })

  it('fetches and processes weather data correctly', async () => {
    // Setup mock response
    const mockWeatherData = {
      current: {
        temperature: 22,
        weathercode: 0,
        apparent_temperature: 23,
        wind_speed_10m: 12,
        wind_direction_10m: 180,
        pressure_msl: 1012,
        relative_humidity_2m: 65,
        uv_index: 3
      },
      hourly: {
        time: ['2025-03-16T12:00', '2025-03-16T13:00'],
        temperature_2m: [22, 23],
        weather_code: [0, 1]
      },
      daily: {
        time: ['2025-03-16', '2025-03-17'],
        temperature_2m_max: [25, 26],
        temperature_2m_min: [15, 16],
        weather_code: [0, 1]
      }
    }

    vi.mocked(getWeatherByCity).mockResolvedValue(mockWeatherData)

    const store = useWeatherStore()
    await store.fetchWeatherData('Test City')

    // Check that loading state was handled correctly
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe(null)

    // Check that data was processed correctly
    expect(store.currentWeather).not.toBe(null)
    expect(store.currentWeather.temperature).toBe(22)
    expect(store.currentWeather.condition).toBe('Clear Sky')

    // Check hourly forecast
    expect(store.hourlyForecast.length).toBe(2)
    expect(store.hourlyForecast[0].temp).toBe(22)
    expect(store.hourlyForecast[0].condition).toBe('Clear Sky')

    // Check daily forecast
    expect(store.dailyForecast.length).toBe(2)
    expect(store.dailyForecast[0].high).toBe(25)
    expect(store.dailyForecast[0].low).toBe(15)
    expect(store.dailyForecast[0].condition).toBe('Clear Sky')

    // Check that location was updated
    expect(store.locationName).toBe('Test City')
  })

  it('handles API errors correctly', async () => {
    // Setup mock error
    vi.mocked(getWeatherByCity).mockRejectedValue(new Error('API Error'))

    const store = useWeatherStore()
    await store.fetchWeatherData('Error City')

    // Check that error state was handled correctly
    expect(store.isLoading).toBe(false)
    expect(store.error).toBe('API Error')
  })

  it('changes temperature unit correctly', () => {
    const store = useWeatherStore()

    // Default is celsius
    expect(store.temperatureUnit).toBe('celsius')

    // Change to fahrenheit
    store.setTemperatureUnit('fahrenheit')
    expect(store.temperatureUnit).toBe('fahrenheit')

    // Change back to celsius
    store.setTemperatureUnit('celsius')
    expect(store.temperatureUnit).toBe('celsius')
  })
})
