// context/NotificationsContext.tsx

'use client'; // Ensure this runs on the client side

import React, { createContext, useContext, useState } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  link: string;
  timestamp: Date;
}

interface NotificationsContextType {
  notifications: Notification[];
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp'>,
  ) => void;
  removeNotification: (id: string) => void;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (
    notification: Omit<Notification, 'id' | 'timestamp'>,
  ) => {
    const id = Date.now().toString(); // Simple unique ID based on timestamp
    const timestamp = new Date();
    setNotifications((prev) => [...prev, { ...notification, id, timestamp }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id),
    );
  };

  return (
    <NotificationsContext.Provider
      value={{ notifications, addNotification, removeNotification }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider',
    );
  }
  return context;
};
