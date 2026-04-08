import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { GamificationProvider } from './src/context/GamificationContext';
import { SmartAlertsProvider } from './src/context/SmartAlertsContext';
import { CustomCategoriesProvider } from './src/context/CustomCategoriesContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <GamificationProvider>
            <SmartAlertsProvider>
              <CustomCategoriesProvider>
                <StatusBar style="auto" />
                <AppNavigator />
              </CustomCategoriesProvider>
            </SmartAlertsProvider>
          </GamificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
