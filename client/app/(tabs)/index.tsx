import React, { useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { WeatherCard } from '../../components/WeatherCard';
import { MetricCard } from '../../components/MetricCard';
import { ForecastItem } from '../../components/ForecastItem';
import { weatherService, locationService } from '../../services';
import type { CurrentWeather, Forecast } from '../../services';

export default function WeatherDashboard() {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [location, setLocation] = useState({ latitude: 35.3021, longitude: -81.3400 });

  // 🔧 FIX: Use useCallback to prevent recreation on every render
  const loadWeatherData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current location (in a real app, you'd request location permissions)
      const deviceLocation = await locationService.getDeviceLocation();
      setLocation(deviceLocation);

      // Load current weather and forecast
      const [currentData, forecastData] = await Promise.all([
        weatherService.getCurrentWeather(deviceLocation.latitude, deviceLocation.longitude),
        weatherService.getForecast(deviceLocation.latitude, deviceLocation.longitude, 4)
      ]);

      setCurrentWeather(currentData);
      setForecast(forecastData);
    } catch (error) {
      console.error('Weather data loading error:', error);
      Alert.alert(
        'Weather Data Unavailable',
        'Failed to load weather data. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []); // No dependencies needed since this function doesn't depend on state

  // 🔧 FIX: Only run once on mount
  useEffect(() => {
    loadWeatherData();
  }, [loadWeatherData]); // Include loadWeatherData in dependencies

  // 🔧 FIX: Memoize weather icon function to prevent recreation
  const getWeatherIcon = useCallback((condition: string): string => {
    const iconMap: Record<string, string> = {
      'sunny': '☀️',
      'partly_cloudy': '⛅',
      'cloudy': '☁️',
      'light_rain': '🌦',
      'rain': '🌧',
      'thunderstorm': '⛈️',
      'snow': '🌨',
      'foggy': '🌫'
    };
    return iconMap[condition] || '☀️';
  }, []); // No dependencies needed

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentWeather || !forecast) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Unable to load weather data</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <WeatherCard
          location={currentWeather.location.city || 'Current Location'}
          temperature={currentWeather.current.temperature}
          condition={currentWeather.current.condition_text}
          high={forecast.forecast[0]?.high_temp || currentWeather.current.temperature}
          low={forecast.forecast[0]?.low_temp || currentWeather.current.temperature - 10}
        />
        
        <View style={styles.metricsGrid}>
          <MetricCard 
            title="AIR QUALITY" 
            value={currentWeather.current.air_quality.index.toString()}
            subtitle={currentWeather.current.air_quality.category}
          />
          <MetricCard 
            title="UV INDEX" 
            value={currentWeather.current.uv_index.toString()}
            subtitle="Moderate"
          />
          <MetricCard 
            title="WIND" 
            value={`${currentWeather.current.wind_speed} mph`}
            subtitle={currentWeather.current.wind_direction}
          />
          <MetricCard 
            title="HUMIDITY" 
            value={`${currentWeather.current.humidity}%`}
            subtitle={`Feels like ${currentWeather.current.feels_like}°`}
          />
        </View>

        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>{forecast.forecast.length}-DAY FORECAST</Text>
          {forecast.forecast.map((item, index: number) => (
            <ForecastItem
              key={`${item.day}-${index}`} // 🔧 FIX: Better key to prevent re-renders
              day={item.day}
              icon={getWeatherIcon(item.condition)}
              high={item.high_temp}
              low={item.low_temp}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#87CEEB',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 20,
  },
  forecastSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  forecastTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
});
