import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Link, router } from 'expo-router';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleCreateAccount = () => {
    // Simple demo logic - in real app would create account
    router.replace('/(tabs)/' as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.authCard}>
        <View style={styles.appLogo}>
          <Text style={styles.logoEmoji}>🌤️</Text>
        </View>
        
        <Text style={styles.appTitle}>Create Account</Text>
        <Text style={styles.appSubtitle}>Join WeatherRoute AI</Text>
        
        <View style={styles.form}>
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Full Name</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          
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
              placeholder="Create a password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Confirm Password</Text>
            <TextInput
              style={styles.formInput}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>
          
          <TouchableOpacity style={styles.authButton} onPress={handleCreateAccount}>
            <Text style={styles.authButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <View style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login' as any)}>
                <Text style={styles.switchAuthLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.termsText}>
            By signing up, you agree to our Terms & Privacy Policy
          </Text>
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
  termsText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});