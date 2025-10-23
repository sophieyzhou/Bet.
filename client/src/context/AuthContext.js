import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { authService } from '../services/authService';

const AuthContext = createContext();

// Helper functions for cross-platform storage
const setItemAsync = async (key, value) => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
};

const getItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key);
  }
};

const deleteItemAsync = async (key) => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    
    // Handle deep links for OAuth callback
    const handleDeepLink = (url) => {
      if (url.includes('auth?token=')) {
        const token = url.split('token=')[1];
        if (token) {
          login(token);
        }
      }
    };

    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    // Check if app was opened with a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getItemAsync('authToken');
      if (token) {
        const userData = await authService.verifyToken(token);
        setUser(userData);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await deleteItemAsync('authToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token) => {
    try {
      await setItemAsync('authToken', token);
      const userData = await authService.verifyToken(token);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('Logout function called');
    try {
      console.log('Clearing local storage...');
      // Clear local storage and state
      await deleteItemAsync('authToken');
      setUser(null);
      setIsAuthenticated(false);
      console.log('Local logout completed successfully');
      
      // Optionally call server logout (but not required for JWT)
      try {
        console.log('Attempting server logout...');
        await authService.logout();
        console.log('Server logout completed');
      } catch (serverError) {
        // Server logout failed, but local logout still succeeded
        console.log('Server logout failed, but local logout succeeded:', serverError.message);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if there's an error, try to clear local state
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
