import { Platform } from 'react-native';

export const API_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : Platform.OS === 'ios'
      ? 'http://127.0.0.1:5000'
      : 'http://127.0.0.1:5000';

// Keep tokens out of source control. Provide these at build/runtime in your local setup.
export const MAPBOX_PUBLIC_TOKEN = process.env.MAPBOX_PUBLIC_TOKEN ?? '';

// Set this for high-accuracy place search (colleges/hospitals/institutions).
export const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? '';
