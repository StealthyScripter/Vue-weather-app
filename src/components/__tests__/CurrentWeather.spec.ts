import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import CurrentWeather from '@/components/weather/CurrentWeather.vue'
import { useWeatherStore } from '@/stores/weather'

describe('CurrentWeather', () => {
  it('renders loading state correctly', () => {
    const wrapper = mount(CurrentWeather, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: true,
                currentWeather: null,
                error: null
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="weather-display"]').exists()).toBe(false)
  })

  it('renders weather data correctly', () => {
    const wrapper = mount(CurrentWeather, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: false,
                currentWeather: {
                  temperature: 22,
                  condition: 'Clear Sky',
                  feelsLike: 23,
                  windspeed: 12,
                  winddirection: 180,
                  pressure: 1012,
                  relativeHumidity: 65,
                  uvIndex: 3
                },
                locationName: 'Raleigh, NC',
                formattedDate: 'Sunday, March 16, 2025',
                error: null
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="weather-display"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="temperature"]').text()).toContain('22')
    expect(wrapper.find('[data-test="condition"]').text()).toContain('Clear Sky')
    expect(wrapper.find('[data-test="location"]').text()).toContain('Raleigh, NC')
  })

  it('renders error state correctly', () => {
    const wrapper = mount(CurrentWeather, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: false,
                currentWeather: null,
                error: 'Failed to fetch weather data'
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error"]').text()).toContain('Failed to fetch weather data')
  })
})
