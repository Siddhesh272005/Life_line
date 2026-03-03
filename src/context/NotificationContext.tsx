import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { apiGet, apiPut } from '../api/client';
import { useAuth } from './AuthContext';

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
};

type NotificationContextValue = {
  notifications: NotificationItem[];
  loading: boolean;
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return;
    }
    try {
      setLoading(true);
      const data = await apiGet('/api/users/notifications');
      if (Array.isArray(data)) {
        setNotifications(
          data.map((item: any) => ({
            id: String(item.id),
            title: item.title || 'Notification',
            message: item.message || '',
            date: new Date(item.date || Date.now()).toLocaleString(),
            read: Boolean(item.read),
          }))
        );
      } else {
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    if (!token) {
      setNotifications([]);
      return;
    }
    void fetchNotifications().catch(() => {});
    const interval = setInterval(() => {
      void fetchNotifications().catch(() => {});
    }, 30000);
    return () => {
      clearInterval(interval);
    };
  }, [token, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await apiPut('/api/users/notifications/read', { id });
    setNotifications(prev => prev.map(item => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const clearAll = useCallback(async () => {
    await apiPut('/api/users/notifications/clear', {});
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      loading,
      unreadCount,
      fetchNotifications,
      markAsRead,
      clearAll,
    }),
    [notifications, loading, unreadCount, fetchNotifications, markAsRead, clearAll]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
};
