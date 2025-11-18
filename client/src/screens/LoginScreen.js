import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isGoogleAccountError, setIsGoogleAccountError] = useState(false);
  const { login } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setIsGoogleAccountError(false);
      const token = await authService.loginWithGoogle();
      await login(token);
      Alert.alert('Success', 'You have successfully signed in!');
    } catch (error) {
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    try {
      setIsLoading(true);
      setErrorMessage('');
      setIsGoogleAccountError(false);

      // Basic validation
      if (!email || !password) {
        setErrorMessage('Please enter email and password');
        return;
      }

      if (isSignupMode && !name) {
        setErrorMessage('Please enter your name');
        return;
      }

      let response;
      if (isSignupMode) {
        response = await authService.signupWithEmail(name, email, password);
      } else {
        response = await authService.loginWithEmail(email, password);
      }

      if (response.token) {
        await login(response.token);
        Alert.alert('Success', response.message || 'You have successfully signed in!');
      }
    } catch (error) {
      console.log('Auth error:', error);
      
      // Check for Google account error
      if (error.errorCode === 'GOOGLE_ACCOUNT') {
        setIsGoogleAccountError(true);
        setErrorMessage(error.error || 'This account uses Google sign-in');
      } else {
        setErrorMessage(error.error || error.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = () => {
    // Switch to signup mode to set password for Google account
    setIsSignupMode(true);
    setIsGoogleAccountError(false);
    setErrorMessage('');
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setErrorMessage('');
    setIsGoogleAccountError(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>Bet</Text>
              <Text style={styles.tagline}>Your betting companion</Text>
            </View>

            <View style={styles.loginContainer}>
              <Text style={styles.welcomeText}>
                {isSignupMode ? 'Create Account' : 'Welcome Back!'}
              </Text>
              <Text style={styles.subtitle}>
                {isSignupMode ? 'Sign up to get started' : 'Sign in to continue'}
              </Text>

              {/* Email/Password Form */}
              {isSignupMode && (
                <TextInput
                  style={styles.input}
                  placeholder="Name"
                  placeholderTextColor="#95a5a6"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              )}

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#95a5a6"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#95a5a6"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />

              {/* Error Message */}
              {errorMessage ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  {isGoogleAccountError && (
                    <View style={styles.googleErrorActions}>
                      <TouchableOpacity
                        style={styles.googleErrorButton}
                        onPress={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <Text style={styles.googleErrorButtonText}>Sign in with Google</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.setPasswordButton}
                        onPress={handleSetPassword}
                        disabled={isLoading}
                      >
                        <Text style={styles.setPasswordButtonText}>Set Password</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : null}

              {/* Sign Up / Log In Button */}
              <TouchableOpacity
                style={[styles.primaryButton, isLoading && styles.disabledButton]}
                onPress={handleEmailAuth}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {isSignupMode ? 'Sign Up' : 'Log In'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Toggle between Login/Signup */}
              <TouchableOpacity 
                onPress={toggleMode}
                disabled={isLoading}
                style={styles.toggleButton}
              >
                <Text style={styles.toggleText}>
                  {isSignupMode 
                    ? 'Already have an account? Log In' 
                    : "Don't have an account? Sign Up"}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Button */}
              <TouchableOpacity
                style={[styles.googleButton, isLoading && styles.disabledButton]}
                onPress={handleGoogleLogin}
                disabled={isLoading}
              >
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loginContainer: {
    alignItems: 'stretch',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  primaryButton: {
    backgroundColor: '#2c3e50',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toggleButton: {
    marginTop: 15,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleText: {
    color: '#4285f4',
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#7f8c8d',
    fontSize: 14,
  },
  googleButton: {
    backgroundColor: '#4285f4',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 8,
  },
  googleErrorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  googleErrorButton: {
    flex: 1,
    backgroundColor: '#4285f4',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  googleErrorButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  setPasswordButton: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4285f4',
  },
  setPasswordButtonText: {
    color: '#4285f4',
    fontSize: 13,
    fontWeight: '600',
  },
});
