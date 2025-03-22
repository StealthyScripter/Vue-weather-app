/**
 * Utility functions for date formatting
 */

/**
 * Format date to display day and date
 * @param dateString Date string
 * @returns Formatted date string (e.g., "Saturday, March 15, 2025")
 */
export const formatFullDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date to display short day and date
 * @param dateString Date string
 * @returns Formatted date string (e.g., "Sat, Mar 15")
 */
export const formatShortDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format time with AM/PM
 * @param dateString Date string
 * @returns Formatted time string (e.g., "9:54 PM")
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format hour for hourly forecast
 * @param dateString Date string
 * @returns Formatted hour string (e.g., "10 PM")
 */
export const formatHour = (time: string | number): string => {
  const date = new Date(time);
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${formattedHours} ${ampm}`;
}

/**
 * Get relative hour display (Now, or formatted hour)
 * @param dateString Date string
 * @param isNow Whether this is the current hour
 * @returns Formatted hour string
 */
export const getRelativeHourDisplay = (dateString: string, isNow: boolean = false): string => {
  if (isNow) {
    return 'Now';
  }
  return formatHour(dateString);
}

/**
 * Get formatted current time
 * @returns Current time string
 */
export const getCurrentTime = (): string => {
  return formatTime(new Date().toString());
}

export default {
  formatFullDate,
  formatShortDate,
  formatTime,
  formatHour,
  getRelativeHourDisplay,
  getCurrentTime
}
