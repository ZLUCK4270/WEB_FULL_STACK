import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { webNotificationService, PushNotificationPayload } from '../services/webNotificationService';

interface WebPushContextType {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<void>;
  sendPushAlert: (alert: Omit<PushNotificationPayload, 'id' | 'timestamp'>) => void;
  notifications: PushNotificationPayload[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearHistory: () => void;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  scheduleBackgroundTest: (seconds: number) => void;
  activeToast: PushNotificationPayload | null;
  dismissToast: () => void;
}

const WebPushContext = createContext<WebPushContextType | undefined>(undefined);

const INITIAL_MOCK_NOTIFICATIONS: PushNotificationPayload[] = [
  {
    id: 'push-01',
    title: '¡Lote Caducado Bloqueado!',
    body: 'El lote LOT-2025-09B de Ibuprofeno 400mg expiró hoy. El sistema bloqueó su dispensación en mostrador.',
    category: 'CRITICO',
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    productCode: 'IBU-400',
    batchCode: 'LOT-2025-09B'
  },
  {
    id: 'push-02',
    title: 'Alerta de Quiebre de Stock',
    body: 'Paracetamol 500mg ha llegado a 0 unidades disponibles. Sugerencia de orden generada para Droguería Farmaindustria.',
    category: 'CRITICO',
    timestamp: new Date(Date.now() - 1000 * 60 * 18),
    productCode: 'PAR-500'
  },
  {
    id: 'push-03',
    title: 'Vencimiento Próximo (30 días)',
    body: 'Amoxicilina 500mg Lote LOT-2026-11A tiene 45 unidades y vence el 05/11. Priorizado para salida FEFO.',
    category: 'ALTO',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    productCode: 'AMX-500',
    batchCode: 'LOT-2026-11A'
  }
];

export const WebPushProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<PushNotificationPayload[]>(INITIAL_MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<PushNotificationPayload | null>(null);

  useEffect(() => {
    setIsSupported(webNotificationService.isSupported());
    setPermission(webNotificationService.getPermission());
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await webNotificationService.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      // Send a welcome test push
      webNotificationService.sendNotification({
        id: `welcome-${Date.now()}`,
        title: 'Notificaciones Web Activadas',
        body: 'El administrador de Nova Salud recibirá alertas en tiempo real incluso si esta pestaña está minimizada.',
        category: 'INFO',
        timestamp: new Date()
      });
    }
  }, []);

  const sendPushAlert = useCallback((alertData: Omit<PushNotificationPayload, 'id' | 'timestamp'>) => {
    const payload: PushNotificationPayload = {
      ...alertData,
      id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date()
    };

    // 1. Dispatch native Web Notification
    webNotificationService.sendNotification(payload);

    // 2. Add to notification history & increment unread count
    setNotifications(prev => [payload, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 3. Show in-app floating banner
    setActiveToast(payload);
    setTimeout(() => {
      setActiveToast(current => (current?.id === payload.id ? null : current));
    }, 6000);
  }, []);

  const scheduleBackgroundTest = useCallback((seconds: number) => {
    setTimeout(() => {
      sendPushAlert({
        title: `Alerta en Segundo Plano (${seconds}s)`,
        body: 'Esta notificación demuestra que el servicio de Nova Salud alerta al administrador fuera de foco.',
        category: 'ALTO',
        productCode: 'TEST-PUSH-BG'
      });
    }, seconds * 1000);
  }, [sendPushAlert]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearHistory = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  return (
    <WebPushContext.Provider
      value={{
        permission,
        isSupported,
        requestPermission,
        sendPushAlert,
        notifications,
        unreadCount,
        markAllAsRead,
        clearHistory,
        isDrawerOpen,
        setIsDrawerOpen,
        scheduleBackgroundTest,
        activeToast,
        dismissToast
      }}
    >
      {children}
    </WebPushContext.Provider>
  );
};

export const useWebPush = (): WebPushContextType => {
  const context = useContext(WebPushContext);
  if (!context) {
    throw new Error('useWebPush must be used within a WebPushProvider');
  }
  return context;
};
