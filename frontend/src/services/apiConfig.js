import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 5000;

export const resolveConfiguredApiBaseUrl = () => {
  // Expo dev server host (e.g. "192.168.1.5:8081") — same machine runs the backend
  const hostUri = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost || Constants.manifest2?.extra?.expoGo?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost') {
      return `http://${host}:${API_PORT}/api`;
    }
  }

  // Android emulator: 10.0.2.2 maps to host machine localhost
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${API_PORT}/api`;
  }

  return `http://localhost:${API_PORT}/api`;
};
