import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { NativeModules } from 'react-native';
import { setAuthToken } from '../api/client';
import { unregisterDeviceForPush } from '../services/pushNotifications';

type AuthUser = {
  id: string;
  role: 'civilian' | 'hospital' | 'ngo';
  email: string;
  name: string;
};

type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  isHydrated: boolean;
  hasLoggedInBefore: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const AUTH_TOKEN_KEY = '@csp_auth_token';
const AUTH_USER_KEY = '@csp_auth_user';
const AUTH_HAS_LOGGED_IN_KEY = '@csp_has_logged_in';

type SafeStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  multiSet: (pairs: [string, string][]) => Promise<void>;
  multiRemove: (keys: string[]) => Promise<void>;
};

let cachedStorage: SafeStorage | null | undefined;
let storageWarned = false;
const getSafeStorage = (): SafeStorage | null => {
  if (cachedStorage !== undefined) return cachedStorage;
  if (!NativeModules?.RNCAsyncStorage) {
    if (!storageWarned) {
      storageWarned = true;
      console.warn('AsyncStorage native module unavailable; session persistence is disabled.');
    }
    cachedStorage = null;
    return cachedStorage;
  }
  try {
    // Lazy-load to avoid crashing when native module isn't linked yet.
    const mod = require('@react-native-async-storage/async-storage');
    cachedStorage = (mod?.default || mod) as SafeStorage;
  } catch {
    cachedStorage = null;
  }
  return cachedStorage;
};

export const getPersistedValue = async (key: string): Promise<string | null> => {
  const storage = getSafeStorage();
  if (!storage) return null;
  try {
    return await storage.getItem(key);
  } catch {
    return null;
  }
};

export const setPersistedValue = async (key: string, value: string): Promise<void> => {
  const storage = getSafeStorage();
  if (!storage) return;
  try {
    await storage.setItem(key, value);
  } catch {}
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasLoggedInBefore, setHasLoggedInBefore] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storage = getSafeStorage();
        const [savedToken, savedUserRaw, savedHasLoggedIn] = await Promise.all([
          storage?.getItem(AUTH_TOKEN_KEY) ?? Promise.resolve(null),
          storage?.getItem(AUTH_USER_KEY) ?? Promise.resolve(null),
          storage?.getItem(AUTH_HAS_LOGGED_IN_KEY) ?? Promise.resolve(null),
        ]);

        const parsedUser = savedUserRaw ? (JSON.parse(savedUserRaw) as AuthUser) : null;
        const nextToken = savedToken || null;

        setToken(nextToken);
        setUser(parsedUser);
        setHasLoggedInBefore(savedHasLoggedIn === '1');
        setAuthToken(nextToken);
      } catch {
        setToken(null);
        setUser(null);
        setHasLoggedInBefore(false);
        setAuthToken(null);
      } finally {
        setIsHydrated(true);
      }
    };

    void hydrate();
  }, []);

  const setAuth = (nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    setHasLoggedInBefore(true);
    setAuthToken(nextToken);
    const storage = getSafeStorage();
    if (storage) {
      void storage.multiSet([
        [AUTH_TOKEN_KEY, nextToken],
        [AUTH_USER_KEY, JSON.stringify(nextUser)],
        [AUTH_HAS_LOGGED_IN_KEY, '1'],
      ]).catch(() => {});
    }
  };

  const logout = () => {
    void unregisterDeviceForPush().catch(() => {});
    setToken(null);
    setUser(null);
    setAuthToken(null);
    const storage = getSafeStorage();
    if (storage) {
      void storage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]).catch(() => {});
    }
  };

  const value = useMemo(
    () => ({ token, user, isHydrated, hasLoggedInBefore, setAuth, logout }),
    [token, user, isHydrated, hasLoggedInBefore]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
