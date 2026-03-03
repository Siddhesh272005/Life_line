import { Platform } from 'react-native';

const getRuntimeEnv = (key: string) => {
  const env = (globalThis as any)?.process?.env;
  if (!env || typeof env !== 'object') return '';
  const value = env[key];
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^your-[a-z0-9-]+$/i.test(trimmed)) return '';
  return trimmed;
};

const apiOverride = getRuntimeEnv('API_BASE_URL');

export const API_BASE_URL =
  apiOverride ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : Platform.OS === 'ios'
      ? 'http://127.0.0.1:5000'
      : 'http://127.0.0.1:5000');

// Keep tokens out of source control. Provide these at build/runtime in your local setup.
export const MAPBOX_PUBLIC_TOKEN = getRuntimeEnv('MAPBOX_PUBLIC_TOKEN');

// Set this for high-accuracy place search (colleges/hospitals/institutions).
export const GOOGLE_PLACES_API_KEY = getRuntimeEnv('GOOGLE_PLACES_API_KEY');
