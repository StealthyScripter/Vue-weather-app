// import React from 'react';
// import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
// import { router } from 'expo-router';
// import { RouteInput } from '../../components/RouteInput';

// export default function RouteScreen() {
//   const handlePlanRoute = () => {
//     router.push('/route-results' as any);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       <View style={styles.header}>
//         <Text style={styles.title}>Route Weather</Text>
//       </View>
      
//       <View style={styles.content}>
//         <RouteInput />
        
//         <TouchableOpacity 
//           style={styles.planButton}
//           onPress={handlePlanRoute}
//         >
//           <Text style={styles.planButtonText}>Plan Route Weather</Text>
//         </TouchableOpacity>
//       </View>
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
//   title: {
//     fontSize: 20,
//     fontWeight: '600',
//     textAlign: 'center',
//     color: '#333',
//   },
//   content: {
//     flex: 1,
//     padding: 20,
//     justifyContent: 'center',
//   },
//   planButton: {
//     backgroundColor: '#007AFF',
//     borderRadius: 12,
//     padding: 16,
//     marginTop: 20,
//   },
//   planButtonText: {
//     color: 'white',
//     textAlign: 'center',
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });


// client/app/(tabs)/route.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert 
} from 'react-native';
import { router } from 'expo-router';
import { RouteInput } from '../../components/RouteInput';
import { routeService, locationService } from '../../services';
import type { RouteWeatherPrediction } from '../../services';

export default function RouteScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [routeData, setRouteData] = useState<{
    from: string;
    to: string;
    departureTime: string;
  }>({
    from: 'Kings Mountain, NC',
    to: 'Durham, NC',
    departureTime: '10:00 AM',
  });

  const handlePlanRoute = async () => {
    try {
      setIsLoading(true);

      // Geocode the from and to addresses
      const [originResult, destinationResult] = await Promise.all([
        locationService.geocodeAddress(routeData.from),
        locationService.geocodeAddress(routeData.to),
      ]);

      // Convert departure time to ISO string (simplified - in real app would use proper date picker)
      const today = new Date();
      const [hours, minutes, period] = routeData.departureTime.match(/(\d+):(\d+) (AM|PM)/)?.slice(1) || ['10', '00', 'AM'];
      let hour = parseInt(hours);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      
      today.setHours(hour, parseInt(minutes), 0, 0);
      const departureTime = today.toISOString();

      // Plan route with weather prediction
      const prediction = await routeService.predictWeatherAlongRoute(
        {
          latitude: originResult.latitude,
          longitude: originResult.longitude,
        },
        {
          latitude: destinationResult.latitude,
          longitude: destinationResult.longitude,
        },
        departureTime
      );

      // Store the prediction data for the results screen
      // In a real app, you might want to use a global state management solution
      // For now, we'll pass it through navigation params
      router.push({
        pathname: '/route-results' as any,
        params: {
          predictionData: JSON.stringify(prediction),
        },
      });

    } catch (error) {
      console.error('Route planning error:', error);
      Alert.alert(
        'Route Planning Failed',
        error instanceof Error 
          ? error.message 
          : 'Failed to plan route. Please check your locations and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteDataChange = (data: { from: string; to: string; departureTime: string }) => {
    setRouteData(data);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Route Weather</Text>
      </View>
      
      <View style={styles.content}>
        <RouteInput 
          initialData={routeData}
          onChange={handleRouteDataChange}
        />
        
        <TouchableOpacity 
          style={[styles.planButton, isLoading && styles.disabledButton]}
          onPress={handlePlanRoute}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="white" size="small" />
              <Text style={styles.planButtonText}>Planning Route...</Text>
            </View>
          ) : (
            <Text style={styles.planButtonText}>Plan Route Weather</Text>
          )}
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Route Weather Features</Text>
          <Text style={styles.infoText}>
            • Real-time weather conditions along your route{'\n'}
            • Precipitation forecasts for each waypoint{'\n'}
            • Weather-optimized departure recommendations{'\n'}
            • Traffic and weather delay predictions
          </Text>
        </View>
      </View>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  planButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  planButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
});
