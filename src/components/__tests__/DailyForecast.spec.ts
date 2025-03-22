import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import DailyForecast from '@/components/weather/DailyForecast.vue'
import { useWeatherStore } from '@/stores/weather'

describe('DailyForecast', () => {
  it('renders loading state correctly', () => {
    const wrapper = mount(DailyForecast, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: true,
                dailyForecast: [],
                error: null
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="forecast-grid"]').exists()).toBe(false)
  })

  it('renders daily forecast data correctly', () => {
    const dailyForecastData = [
      { day: 'Mon', high: 25, low: 15, icon: 0, condition: 'Clear Sky' },
      { day: 'Tue', high: 23, low: 14, icon: 1, condition: 'Mainly Clear' },
      { day: 'Wed', high: 22, low: 13, icon: 2, condition: 'Partly Cloudy' },
      { day: 'Thu', high: 20, low: 12, icon: 3, condition: 'Overcast' },
      { day: 'Fri', high: 19, low: 11, icon: 61, condition: 'Slight Rain' }
    ]

    const wrapper = mount(DailyForecast, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: false,
                dailyForecast: dailyForecastData,
                error: null
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="forecast-grid"]').exists()).toBe(true)

    const forecastItems = wrapper.findAll('[data-test="forecast-item"]')
    expect(forecastItems.length).toBe(5)

    // Check first item
    expect(forecastItems[0].find('[data-test="day"]').text()).toBe('Mon')
    expect(forecastItems[0].find('[data-test="high"]').text()).toContain('25')
    expect(forecastItems[0].find('[data-test="low"]').text()).toContain('15')
  })

  it('renders error state correctly', () => {
    const wrapper = mount(DailyForecast, {
      global: {
        plugins: [
          createTestingPinia({
            createSpy: vi.fn,
            initialState: {
              weather: {
                isLoading: false,
                dailyForecast: [],
                error: 'Failed to fetch forecast data'
              }
            }
          })
        ]
      }
    })

    expect(wrapper.find('[data-test="error"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="error"]').text()).toContain('Failed to fetch forecast data')
  })
})
