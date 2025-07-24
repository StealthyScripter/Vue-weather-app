import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { router } from 'expo-router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    // Simple demo logic - in real app would validate credentials
    router.replace('/(tabs)/' as any);
  };

  const handleDemoLogin = () => {
    setEmail('demo@weather.ai');
    setPassword('demo123');
    router.replace('/(tabs)/' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.authCard}>
        <View style={styles.appLogo}>
          <Text style={styles.logoEmoji}>🌤️</Text>
        </View>
        
        <Text style={styles.appTitle}>WeatherRoute AI</Text>
        <Text style={styles.appSubtitle}>Smart Weather Predictions</Text>
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Email Address</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Password</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.authButton} onPress={handleSignIn}>
            <Text style={styles.authButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <View style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>Don&#39;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup' as any)}>
                <Text style={styles.switchAuthLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin}>
            <Text style={styles.demoText}>
              Demo: Use demo@weather.ai with password: demo123
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  authCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 40,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 60,
    elevation: 10,
  },
  appLogo: {
    width: 60,
    height: 60,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoEmoji: {
    fontSize: 28,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  appSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  formInput: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  authButton: {
    backgroundColor: '#4A90E2',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginVertical: 20,
  },
  authButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  forgotLink: {
    color: '#4A90E2',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 20,
  },
  switchAuth: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchAuthText: {
    color: '#666',
    fontSize: 14,
  },
  switchAuthLink: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  demoButton: {
    marginTop: 20,
    padding: 12,
  },
  demoText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});