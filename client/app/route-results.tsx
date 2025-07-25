// import React from 'react';
// import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
// import { router } from 'expo-router';
// import { RouteStep } from '../components/RouteStep';

// export default function RouteResults() {
//   const routeSteps = [
//     { city: 'Kings Mountain, NC', time: '10:00 AM', miles: '0 miles', temp: '84°F', condition: '☀️ Sunny' },
//     { city: 'Gastonia, NC', time: '10:22 AM', miles: '18 miles', temp: '86°F', condition: '⛅ Partly Cloudy' },
//     { city: 'Charlotte, NC', time: '10:45 AM', miles: '35 miles', temp: '88°F', condition: '☁️ Cloudy' },
//     { city: 'Kannapolis, NC', time: '11:15 AM', miles: '58 miles', temp: '87°F', condition: '🌦 Light Rain' },
//     { city: 'Greensboro, NC', time: '11:50 AM', miles: '85 miles', temp: '85°F', condition: '🌧 Rain' },
//     { city: 'Durham, NC', time: '12:15 PM', miles: '120 miles', temp: '82°F', condition: '🌦 Light Rain' },
//   ];

//   const handleNewRoute = () => {
//     router.back();
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <View style={styles.routeInfo}>
//           <Text style={styles.routeTitle}>Kings Mountain → Durham</Text>
//           <Text style={styles.routeSubtitle}>Total time: 2h 15m • 120 miles</Text>
//         </View>
//       </View>
      
//       <ScrollView style={styles.resultsContainer}>
//         <View style={styles.routeSteps}>
//           {routeSteps.map((step, index) => (
//             <RouteStep
//               key={index}
//               city={step.city}
//               time={step.time}
//               miles={step.miles}
//               temperature={step.temp}
//               condition={step.condition}
//             />
//           ))}
//         </View>
        
//         <TouchableOpacity 
//           style={styles.newRouteButton}
//           onPress={handleNewRoute}
//         >
//           <Text style={styles.newRouteButtonText}>Plan New Route</Text>
//         </TouchableOpacity>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   header: {
//     backgroundColor: '#fff',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e9ecef',
//   },
//   routeInfo: {
//     alignItems: 'center',
//   },
//   routeTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 5,
//   },
//   routeSubtitle: {
//     fontSize: 14,
//     color: '#666',
//   },
//   resultsContainer: {
//     flex: 1,
//   },
//   routeSteps: {
//     padding: 20,
//   },
//   newRouteButton: {
//     backgroundColor: '#6b7280',
//     borderRadius: 12,
//     padding: 16,
//     margin: 20,
//   },
//   newRouteButtonText: {
//     color: 'white',
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { RouteStep } from '../components/RouteStep';
import type { RouteWeatherPrediction } from '../services';

export default function RouteResults() {
  const params = useLocalSearchParams();
  const [prediction, setPrediction] = useState<RouteWeatherPrediction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPredictionData();
  }, []);

  const loadPredictionData = () => {
    try {
      if (params.predictionData && typeof params.predictionData === 'string') {
        const data = JSON.parse(params.predictionData) as RouteWeatherPrediction;
        setPrediction(data);
      } else {
        throw new Error('No prediction data provided');
      }
    } catch (error) {
      console.error('Failed to load prediction data:', error);
      Alert.alert(
        'Error',
        'Failed to load route data. Returning to route planning.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRoute = () => {
    router.back();
  };

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getWeatherIcon = (condition: string): string => {
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
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading route results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!prediction) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load route data</Text>
          <TouchableOpacity style={styles.backButton} onPress={handleNewRoute}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeTitle}>
            {prediction.weather_points[0]?.location.city} → {prediction.weather_points[prediction.weather_points.length - 1]?.location.city}
          </Text>
          <Text style={styles.routeSubtitle}>
            Total time: {prediction.route.total_duration} • {prediction.route.total_distance} miles
          </Text>
        </View>
      </View>

      {/* Weather Summary */}
      <View style={styles.weatherSummary}>
        <Text style={styles.summaryTitle}>Weather Summary</Text>
        <Text style={styles.summaryCondition}>
          Overall: {prediction.weather_summary.overall_condition.charAt(0).toUpperCase() + prediction.weather_summary.overall_condition.slice(1)}
        </Text>
        {prediction.weather_summary.rain_expected && (
          <Text style={styles.summaryAlert}>⚠️ Rain expected along route</Text>
        )}
        {prediction.weather_summary.recommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationTitle}>Recommendations:</Text>
            {prediction.weather_summary.recommendations.map((rec: string, index: number) => (
              <Text key={index} style={styles.recommendationText}>• {rec}</Text>
            ))}
          </View>
        )}
      </View>
      
      <ScrollView style={styles.resultsContainer}>
        <View style={styles.routeSteps}>
          {prediction.weather_points.map((point, index: number) => (
            <RouteStep
              key={index}
              city={point.location.city}
              time={formatTime(point.time)}
              miles={`${point.distance_from_start.toFixed(1)} miles`}
              temperature={`${point.weather.temperature}°F`}
              condition={`${getWeatherIcon(point.weather.condition)} ${point.weather.condition_text}`}
              precipitationChance={point.weather.precipitation_chance}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
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
  weatherSummary: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  summaryCondition: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  summaryAlert: {
    fontSize: 14,
    color: '#f59e0b',
    marginBottom: 8,
  },
  recommendations: {
    marginTop: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
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
