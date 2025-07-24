import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { WeatherCard } from '../../components/WeatherCard';
import { MetricCard } from '../../components/MetricCard';
import { ForecastItem } from '../../components/ForecastItem';

export default function WeatherDashboard() {
  const forecastData = [
    { day: 'Today', icon: '⛅', high: 90, low: 73 },
    { day: 'Mon', icon: '🌧', high: 88, low: 74 },
    { day: 'Tue', icon: '🌧', high: 87, low: 74 },
    { day: 'Wed', icon: '☁️', high: 88, low: 74 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <WeatherCard
          location="Kings Mountain"
          temperature={84}
          condition="Partly Cloudy"
          high={90}
          low={73}
        />
        
        <View style={styles.metricsGrid}>
          <MetricCard title="AIR QUALITY" value="35" subtitle="Good" />
          <MetricCard title="UV INDEX" value="6" subtitle="High" />
          <MetricCard title="WIND" value="4 mph" subtitle="ESE" />
          <MetricCard title="HUMIDITY" value="75%" subtitle="Dew point 75°" />
        </View>

        <View style={styles.forecastSection}>
          <Text style={styles.forecastTitle}>10-DAY FORECAST</Text>
          {forecastData.map((item, index) => (
            <ForecastItem
              key={index}
              day={item.day}
              icon={item.icon}
              high={item.high}
              low={item.low}
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