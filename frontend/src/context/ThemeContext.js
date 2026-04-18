import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LIGHT_THEME, DARK_THEME } from '../constants/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [theme, setTheme] = useState(LIGHT_THEME);

  useEffect(() => {
    loadTheme();
  }, []);

  useEffect(() => {
    setTheme(isDark ? DARK_THEME : LIGHT_THEME);
  }, [isDark]);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme');
      const isDarkMode = saved === 'dark';
      setIsDark(isDarkMode);
    } catch (e) {
      console.log('Failed to load theme', e);
    }
  };

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem('theme', newIsDark ? 'dark' : 'light');
    } catch (e) {
      console.log('Failed to save theme', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
