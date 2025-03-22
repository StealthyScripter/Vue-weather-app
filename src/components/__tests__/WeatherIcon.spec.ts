import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherIcon from '@/components/weather/WeatherIcon.vue'

describe('WeatherIcon', () => {
  it('renders the correct icon based on weather code', () => {
    const wrapper = mount(WeatherIcon, {
      props: {
        code: 0,  // Clear sky
        size: 'md'
      }
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    // You may need to adjust this based on how you're implementing the icon
    expect(wrapper.attributes('aria-label')).toBe('Clear Sky')
  })

  it('applies the correct size class', () => {
    const wrapper = mount(WeatherIcon, {
      props: {
        code: 1,
        size: 'lg'
      }
    })

    expect(wrapper.classes()).toContain('weather-icon--lg')
  })

  it('renders fallback icon for unknown weather code', () => {
    const wrapper = mount(WeatherIcon, {
      props: {
        code: 9999, // Non-existent code
        size: 'md'
      }
    })

    expect(wrapper.find('svg').exists()).toBe(true)
    // You may need to adjust this based on how you handle unknown codes
    expect(wrapper.attributes('aria-label')).toContain('Unknown')
  })
})
