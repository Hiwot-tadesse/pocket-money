import { Platform } from 'react-native';

const API_PORT = 5000;
const LAN_IP = '10.49.83.82';

export const API_MODES = {
  phone: `http://${LAN_IP}:${API_PORT}/api`,
  androidEmulator: `http://10.0.2.2:${API_PORT}/api`,
  iosSimulator: `http://localhost:${API_PORT}/api`,
  web: `http://localhost:${API_PORT}/api`,
};

export const DEFAULT_API_MODE = 'phone';

export const resolveConfiguredApiBaseUrl = () => {
  if (DEFAULT_API_MODE === 'phone') {
    return API_MODES.phone;
  }

  if (DEFAULT_API_MODE === 'androidEmulator') {
    return API_MODES.androidEmulator;
  }

  if (DEFAULT_API_MODE === 'iosSimulator') {
    return API_MODES.iosSimulator;
  }

  if (DEFAULT_API_MODE === 'web') {
    return API_MODES.web;
  }

  if (Platform.OS === 'android') {
    return API_MODES.androidEmulator;
  }

  return API_MODES.iosSimulator;
};
