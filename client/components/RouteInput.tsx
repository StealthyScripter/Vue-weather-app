import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export function RouteInput() {
  const [from, setFrom] = useState('Kings Mountain, NC');
  const [to, setTo] = useState('Durham, NC');
  const [departureTime, setDepartureTime] = useState('10:00 AM');

  return (
    <View style={styles.container}>
      <View style={styles.mapPreview}>
        <View style={styles.mapPlaceholder}>
          <View style={[styles.dot, styles.startDot]} />
          <View style={styles.routeLine} />
          <View style={[styles.dot, styles.endDot]} />
        </View>
      </View>
      
      <View style={styles.inputSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FROM</Text>
          <TextInput
            style={styles.input}
            value={from}
            onChangeText={setFrom}
            placeholder="Enter starting location"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>TO</Text>
          <TextInput
            style={styles.input}
            value={to}
            onChangeText={setTo}
            placeholder="Enter destination"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>DEPARTURE TIME</Text>
          <TextInput
            style={styles.input}
            value={departureTime}
            onChangeText={setDepartureTime}
            placeholder="Set departure time"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapPreview: {
    height: 200,
    backgroundColor: '#86efac',
    borderRadius: 16,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholder: {
    width: '80%',
    height: '60%',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  startDot: {
    backgroundColor: '#3b82f6',
  },
  endDot: {
    backgroundColor: '#ef4444',
  },
  routeLine: {
    width: 4,
    flex: 1,
    backgroundColor: '#3b82f6',
    marginVertical: 8,
  },
  inputSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#f9fafb',
  },
});
