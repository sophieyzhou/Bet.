import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  async signup({ name, email, password }) {
    const response = await axios.post(`${API_BASE_URL}/auth/signup`, { name, email, password });
    return response.data;
  },

  async login({ email, password }) {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    return response.data;
  },

  async loginWithGoogle() {
    try {
      const redirectUri = AuthSession.makeRedirectUri({ useProxy: true });
      const authUrl = `${API_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`;

      // Use AuthSession so the proxy can capture and pass params back
      const result = await AuthSession.startAsync({ authUrl, returnUrl: redirectUri });

      if (result.type === 'success') {
        let token = result.params?.token;
        if (!token && result.url) {
          const url = new URL(result.url);
          token = url.searchParams.get('token');
        }
        if (token) return token;
        throw new Error('No token received');
      }
      throw new Error('Authentication cancelled or failed');
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  },

  async verifyToken(token) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/verify`, {
        token
      });
      return response.data.user;
    } catch (error) {
      console.error('Token verification failed:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
};
