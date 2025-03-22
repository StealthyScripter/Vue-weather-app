/**
 * Utility functions for temperature conversion
 */

/**
 * Convert temperature from Celsius to Fahrenheit
 * @param celsius Temperature in Celsius
 * @returns Temperature in Fahrenheit
 */
export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
}

/**
 * Convert temperature from Fahrenheit to Celsius
 * @param fahrenheit Temperature in Fahrenheit
 * @returns Temperature in Celsius
 */
export const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5/9;
}

/**
 * Format temperature display with the given unit
 * @param temp Temperature value
 * @param unit Temperature unit ('C' or 'F')
 * @returns Formatted temperature string
 */
export const formatTemperature = (temp: number, unit: string): string => {
  const roundedTemp = Math.round(temp);
  return `${roundedTemp}°${unit}`;
}

export default {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  formatTemperature
}
