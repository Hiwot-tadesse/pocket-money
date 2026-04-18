import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { GamificationProvider } from './src/context/GamificationContext';
import { SmartAlertsProvider } from './src/context/SmartAlertsContext';
import { CustomCategoriesProvider } from './src/context/CustomCategoriesContext';
import { ThemeProvider } from './src/context/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { useTheme } from './src/context/ThemeContext';

function AppContent() {
  const { theme } = useTheme();
  return (
    <>
      <StatusBar style={theme.background === '#0F172A' ? 'light' : 'dark'} backgroundColor={theme.background} />
      <AppNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <GamificationProvider>
              <SmartAlertsProvider>
                <CustomCategoriesProvider>
                  <AppContent />
                </CustomCategoriesProvider>
              </SmartAlertsProvider>
            </GamificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
