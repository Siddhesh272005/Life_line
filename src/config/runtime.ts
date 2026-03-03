type RuntimeSecrets = {
  API_BASE_URL?: string;
  MAPBOX_PUBLIC_TOKEN?: string;
  GOOGLE_PLACES_API_KEY?: string;
};

let localSecrets: RuntimeSecrets = {};
try {
  // Optional local file for secrets. Keep `runtime.secrets.ts` out of git.
  const loaded = require('./runtime.secrets');
  localSecrets = (loaded?.default || loaded || {}) as RuntimeSecrets;
} catch {}

const getLocalSecret = (key: keyof RuntimeSecrets) => {
  const value = localSecrets[key];
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^your-[a-z0-9-]+$/i.test(trimmed)) return '';
  return trimmed;
};

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

const apiOverride = getLocalSecret('API_BASE_URL') || getRuntimeEnv('API_BASE_URL');
const hostedApiBaseUrl = 'https://life-line-bkoo.onrender.com';

export const API_BASE_URL =
  apiOverride ||
  hostedApiBaseUrl;

// Keep tokens out of source control. Provide these at build/runtime in your local setup.
export const MAPBOX_PUBLIC_TOKEN =
  getLocalSecret('MAPBOX_PUBLIC_TOKEN') || getRuntimeEnv('MAPBOX_PUBLIC_TOKEN');

// Set this for high-accuracy place search (colleges/hospitals/institutions).
export const GOOGLE_PLACES_API_KEY =
  getLocalSecret('GOOGLE_PLACES_API_KEY') || getRuntimeEnv('GOOGLE_PLACES_API_KEY');
