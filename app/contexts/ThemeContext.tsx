import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

// Theme type definitions
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  // Background colors
  background: string;
  surface: string;
  surfaceSecondary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;
  
  // Interactive colors
  primary: string;
  primaryLight: string;
  secondary: string;
  
  // Status colors
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  
  // Accent colors
  accent: string;
  accentLight: string;
  
  // Border and divider colors
  border: string;
  divider: string;
  
  // Shadow colors
  shadow: string;
  
  // Card and overlay colors
  card: string;
  overlay: string;
  
  // Rating colors (semantic)
  ratingExcellent: string;
  ratingGood: string;
  ratingPoor: string;
  
  // Status badge colors
  statusWatching: string;
  statusCompleted: string;
  statusOnHold: string;
  statusPlanToWatch: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
}

// Light theme colors
const lightTheme: Theme = {
  mode: 'light',
  colors: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceSecondary: '#f1f5f9',
    
    text: '#1f2937',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',
    
    primary: '#10b981',
    primaryLight: '#d1fae5',
    secondary: '#3b82f6',
    
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fef2f2',
    
    accent: '#8b5cf6',
    accentLight: '#f3e8ff',
    
    border: '#e5e7eb',
    divider: '#f3f4f6',
    
    shadow: '#000000',
    
    card: '#ffffff',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    ratingExcellent: '#10b981',
    ratingGood: '#f59e0b',
    ratingPoor: '#ef4444',
    
    statusWatching: '#3b82f6',
    statusCompleted: '#10b981',
    statusOnHold: '#f59e0b',
    statusPlanToWatch: '#6b7280',
  },
};

// Dark theme colors
const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceSecondary: '#334155',
    
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    
    primary: '#10b981',
    primaryLight: '#064e3b',
    secondary: '#3b82f6',
    
    success: '#10b981',
    successLight: '#064e3b',
    warning: '#f59e0b',
    warningLight: '#451a03',
    error: '#ef4444',
    errorLight: '#450a0a',
    
    accent: '#8b5cf6',
    accentLight: '#3c1361',
    
    border: '#475569',
    divider: '#334155',
    
    shadow: '#000000',
    
    card: '#1e293b',
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    ratingExcellent: '#10b981',
    ratingGood: '#f59e0b',
    ratingPoor: '#ef4444',
    
    statusWatching: '#3b82f6',
    statusCompleted: '#10b981',
    statusOnHold: '#f59e0b',
    statusPlanToWatch: '#94a3b8',
  },
};

// Theme context interface
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Determine current theme based on mode and system preference
  const getCurrentTheme = (mode: ThemeMode): Theme => {
    if (mode === 'system') {
      // Handle null/undefined case - default to light
      return systemColorScheme === 'dark' ? darkTheme : lightTheme;
    }
    return mode === 'dark' ? darkTheme : lightTheme;
  };

  const currentTheme = getCurrentTheme(themeMode);

  // Load saved theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('themeMode');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  // Save theme preference when it changes
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Toggle between light and dark (skips system mode)
  const toggleTheme = () => {
    const newMode = currentTheme.mode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const contextValue: ThemeContextType = {
    theme: currentTheme,
    themeMode,
    setThemeMode,
    toggleTheme,
    isDark: currentTheme.mode === 'dark',
  };

  // Don't render children until theme is loaded
  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility function to get color based on theme
export const getThemeColor = (colorKey: keyof ThemeColors, theme: Theme): string => {
  return theme.colors[colorKey];
};

// Helper function for conditional styling based on theme
export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
) => {
  return (theme: Theme): T => styleCreator(theme);
};
