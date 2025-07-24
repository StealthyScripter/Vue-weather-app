import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface WeatherCardProps {
  location: string;
  temperature: number;
  condition: string;
  high: number;
  low: number;
}

export function WeatherCard({ location, temperature, condition, high, low }: WeatherCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.location}>{location}</Text>
      <Text style={styles.temperature}>{temperature}°</Text>
      <Text style={styles.condition}>{condition}</Text>
      <Text style={styles.range}>H:{high}° L:{low}°</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  location: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '300',
    color: '#1f2937',
    marginBottom: 4,
  },
  condition: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  range: {
    fontSize: 14,
    color: '#9ca3af',
  },
});