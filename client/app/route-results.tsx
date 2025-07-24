import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { RouteStep } from '../components/RouteStep';

export default function RouteResults() {
  const routeSteps = [
    { city: 'Kings Mountain, NC', time: '10:00 AM', miles: '0 miles', temp: '84°F', condition: '☀️ Sunny' },
    { city: 'Gastonia, NC', time: '10:22 AM', miles: '18 miles', temp: '86°F', condition: '⛅ Partly Cloudy' },
    { city: 'Charlotte, NC', time: '10:45 AM', miles: '35 miles', temp: '88°F', condition: '☁️ Cloudy' },
    { city: 'Kannapolis, NC', time: '11:15 AM', miles: '58 miles', temp: '87°F', condition: '🌦 Light Rain' },
    { city: 'Greensboro, NC', time: '11:50 AM', miles: '85 miles', temp: '85°F', condition: '🌧 Rain' },
    { city: 'Durham, NC', time: '12:15 PM', miles: '120 miles', temp: '82°F', condition: '🌦 Light Rain' },
  ];

  const handleNewRoute = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>Kings Mountain → Durham</Text>
          <Text style={styles.routeSubtitle}>Total time: 2h 15m • 120 miles</Text>
        </View>
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.routeSteps}>
          {routeSteps.map((step, index) => (
            <RouteStep
              key={index}
              city={step.city}
              time={step.time}
              miles={step.miles}
              temperature={step.temp}
              condition={step.condition}
            />
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.newRouteButton}
          onPress={handleNewRoute}
        >
          <Text style={styles.newRouteButtonText}>Plan New Route</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  routeInfo: {
    alignItems: 'center',
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  routeSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  resultsContainer: {
    flex: 1,
  },
  routeSteps: {
    padding: 20,
  },
  newRouteButton: {
    backgroundColor: '#6b7280',
    borderRadius: 12,
    padding: 16,
    margin: 20,
  },
  newRouteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
});
