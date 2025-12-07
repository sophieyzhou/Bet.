import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { TextInput, Button, Text, Card, Surface, Divider, ActivityIndicator } from 'react-native-paper';
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
              <Text variant="displayMedium" style={styles.logo}>Bet</Text>
              <Text variant="bodyLarge" style={styles.tagline}>Your betting companion</Text>
            </View>

            <Card style={styles.card} mode="elevated" elevation={2}>
              <Card.Content>
                <Text variant="headlineLarge" style={styles.welcomeText}>
                  {isSignupMode ? 'Create Account' : 'Welcome Back!'}
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  {isSignupMode ? 'Sign up to get started' : 'Sign in to continue'}
                </Text>

                {/* Email/Password Form */}
                {isSignupMode && (
                  <TextInput
                    label="Name"
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    autoCapitalize="words"
                    disabled={isLoading}
                    style={styles.input}
                    contentStyle={styles.inputContent}
                    returnKeyType="next"
                    blurOnSubmit={false}
                    textContentType="name"
                  />
                )}

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  disabled={isLoading}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  textContentType="emailAddress"
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry
                  disabled={isLoading}
                  style={styles.input}
                  contentStyle={styles.inputContent}
                  returnKeyType="done"
                  blurOnSubmit={true}
                  textContentType={isSignupMode ? "newPassword" : "password"}
                />

                {/* Error Message */}
                {errorMessage ? (
                  <Surface style={styles.errorContainer} elevation={0}>
                    <Text variant="bodyMedium" style={styles.errorText}>{errorMessage}</Text>
                    {isGoogleAccountError && (
                      <View style={styles.googleErrorActions}>
                        <Button
                          mode="contained"
                          onPress={handleGoogleLogin}
                          disabled={isLoading}
                          style={styles.googleErrorButton}
                          compact
                        >
                          Sign in with Google
                        </Button>
                        <Button
                          mode="outlined"
                          onPress={handleSetPassword}
                          disabled={isLoading}
                          style={styles.setPasswordButton}
                          compact
                        >
                          Set Password
                        </Button>
                      </View>
                    )}
                  </Surface>
                ) : null}

                {/* Sign Up / Log In Button */}
                <Button
                  mode="contained"
                  onPress={handleEmailAuth}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.primaryButton}
                  contentStyle={styles.buttonContent}
                >
                  {isSignupMode ? 'Sign Up' : 'Log In'}
                </Button>

                {/* Toggle between Login/Signup */}
                <Button
                  mode="text"
                  onPress={toggleMode}
                  disabled={isLoading}
                  style={styles.toggleButton}
                  compact
                >
                  {isSignupMode 
                    ? 'Already have an account? Log In' 
                    : "Don't have an account? Sign Up"}
                </Button>

                {/* Divider */}
                <Divider style={styles.divider} />

                {/* Google Button */}
                <Button
                  mode="contained"
                  onPress={handleGoogleLogin}
                  disabled={isLoading}
                  loading={isLoading}
                  style={styles.googleButton}
                  contentStyle={styles.buttonContent}
                >
                  Continue with Google
                </Button>
              </Card.Content>
            </Card>
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
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    color: '#2c3e50',
    marginBottom: 10,
  },
  tagline: {
    color: '#7f8c8d',
  },
  card: {
    marginHorizontal: 10,
  },
  welcomeText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#2c3e50',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#7f8c8d',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  inputContent: {
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  toggleButton: {
    marginTop: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  googleButton: {
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#e53935',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  googleErrorActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  googleErrorButton: {
    flex: 1,
  },
  setPasswordButton: {
    flex: 1,
  },
});
