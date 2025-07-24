import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ForecastItemProps {
  day: string;
  icon: string;
  high: number;
  low: number;
}

export function ForecastItem({ day, icon, high, low }: ForecastItemProps) {
  return (
    <View style={styles.item}>
      <Text style={styles.day}>{day}</Text>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.temps}>
        <Text style={styles.high}>{high}°</Text>
        <Text style={styles.low}>{low}°</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  day: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  icon: {
    fontSize: 20,
    marginHorizontal: 16,
  },
  temps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  high: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  low: {
    fontSize: 16,
    color: '#9ca3af',
  },
});