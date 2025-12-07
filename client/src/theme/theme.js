import { MD3LightTheme } from 'react-native-paper';

// Map existing color scheme to Paper theme
export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary colors - matching existing #4285f4
    primary: '#4285f4',
    primaryContainer: '#E3F2FD',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#1976D2',
    
    // Secondary colors
    secondary: '#2c3e50',
    secondaryContainer: '#f8f9fa',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#2c3e50',
    
    // Background colors
    background: '#f8f9fa',
    surface: '#ffffff',
    surfaceVariant: '#f8f9fa',
    onBackground: '#2c3e50',
    onSurface: '#2c3e50',
    onSurfaceVariant: '#7f8c8d',
    
    // Error colors - matching existing #e74c3c
    error: '#e74c3c',
    errorContainer: '#ffebee',
    onError: '#ffffff',
    onErrorContainer: '#c62828',
    
    // Success colors - matching existing #27ae60
    success: '#27ae60',
    successContainer: '#e8f5e9',
    onSuccess: '#ffffff',
    onSuccessContainer: '#2e7d32',
    
    // Warning colors - matching existing #f39c12
    warning: '#f39c12',
    warningContainer: '#fff3e0',
    onWarning: '#ffffff',
    onWarningContainer: '#e65100',
    
    // Outline and borders
    outline: '#e1e8ed',
    outlineVariant: '#e1e8ed',
    
    // Text colors
    text: '#2c3e50',
    textSecondary: '#7f8c8d',
    textTertiary: '#95a5a6',
    
    // Shadow
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  // Custom typography matching existing font sizes
  fonts: {
    ...MD3LightTheme.fonts,
    displayLarge: {
      ...MD3LightTheme.fonts.displayLarge,
      fontSize: 48,
      fontWeight: 'bold',
    },
    displayMedium: {
      ...MD3LightTheme.fonts.displayMedium,
      fontSize: 36,
      fontWeight: 'bold',
    },
    displaySmall: {
      ...MD3LightTheme.fonts.displaySmall,
      fontSize: 28,
      fontWeight: 'bold',
    },
    headlineLarge: {
      ...MD3LightTheme.fonts.headlineLarge,
      fontSize: 24,
      fontWeight: 'bold',
    },
    headlineMedium: {
      ...MD3LightTheme.fonts.headlineMedium,
      fontSize: 20,
      fontWeight: 'bold',
    },
    headlineSmall: {
      ...MD3LightTheme.fonts.headlineSmall,
      fontSize: 18,
      fontWeight: '600',
    },
    titleLarge: {
      ...MD3LightTheme.fonts.titleLarge,
      fontSize: 18,
      fontWeight: '600',
    },
    titleMedium: {
      ...MD3LightTheme.fonts.titleMedium,
      fontSize: 16,
      fontWeight: '600',
    },
    titleSmall: {
      ...MD3LightTheme.fonts.titleSmall,
      fontSize: 14,
      fontWeight: '600',
    },
    bodyLarge: {
      ...MD3LightTheme.fonts.bodyLarge,
      fontSize: 16,
    },
    bodyMedium: {
      ...MD3LightTheme.fonts.bodyMedium,
      fontSize: 14,
    },
    bodySmall: {
      ...MD3LightTheme.fonts.bodySmall,
      fontSize: 12,
    },
    labelLarge: {
      ...MD3LightTheme.fonts.labelLarge,
      fontSize: 16,
      fontWeight: '600',
    },
    labelMedium: {
      ...MD3LightTheme.fonts.labelMedium,
      fontSize: 14,
      fontWeight: '600',
    },
    labelSmall: {
      ...MD3LightTheme.fonts.labelSmall,
      fontSize: 12,
      fontWeight: '600',
    },
  },
  // Roundness matching existing border radius
  roundness: 8,
};
