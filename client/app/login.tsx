import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/authContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      await login({ email, password });
      router.replace('/(tabs)/' as any);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        error instanceof Error ? error.message : 'Invalid credentials'
      );
    } finally {
      setIsLoading(false);
    }
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
              editable={!isLoading}
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
              editable={!isLoading}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.authButton, isLoading && styles.disabledButton]} 
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.authButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.forgotLink}>Forgot Password?</Text>
          </TouchableOpacity>
          
          <View style={styles.switchAuth}>
            <Text style={styles.switchAuthText}>Don&#39;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/signup' as any)} disabled={isLoading}>
                <Text style={styles.switchAuthLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
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
  disabledButton: {
    backgroundColor: '#9ca3af',
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
});
