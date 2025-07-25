// import React from 'react';
// import { View, Text, StyleSheet } from 'react-native';

// interface RouteStepProps {
//   city: string;
//   time: string;
//   miles: string;
//   temperature: string;
//   condition: string;
// }

// export function RouteStep({ city, time, miles, temperature, condition }: RouteStepProps) {
//   return (
//     <View style={styles.container}>
//       <View style={styles.leftSection}>
//         <Text style={styles.city}>{city}</Text>
//         <Text style={styles.details}>{time} • {miles}</Text>
//       </View>
      
//       <View style={styles.rightSection}>
//         <Text style={styles.temperature}>{temperature}</Text>
//         <Text style={styles.condition}>{condition}</Text>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     backgroundColor: 'white',
//     borderRadius: 12,
//     padding: 16,
//     marginBottom: 8,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 1,
//     },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   leftSection: {
//     flex: 1,
//   },
//   city: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   details: {
//     fontSize: 12,
//     color: '#6b7280',
//   },
//   rightSection: {
//     alignItems: 'flex-end',
//   },
//   temperature: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#1f2937',
//     marginBottom: 2,
//   },
//   condition: {
//     fontSize: 12,
//     color: '#6b7280',
//   },
// });


import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface RouteStepProps {
  city: string;
  time: string;
  miles: string;
  temperature: string;
  condition: string;
  precipitationChance?: number;
}

export function RouteStep({ 
  city, 
  time, 
  miles, 
  temperature, 
  condition, 
  precipitationChance 
}: RouteStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <Text style={styles.city}>{city}</Text>
        <Text style={styles.details}>{time} • {miles}</Text>
        {precipitationChance !== undefined && precipitationChance > 0 && (
          <Text style={styles.precipitation}>
            🌧 {precipitationChance}% chance of rain
          </Text>
        )}
      </View>
      
      <View style={styles.rightSection}>
        <Text style={styles.temperature}>{temperature}</Text>
        <Text style={styles.condition}>{condition}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flex: 1,
  },
  city: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  details: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  precipitation: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  temperature: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  condition: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});
