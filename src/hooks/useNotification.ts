// src/hooks/useNotification.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  saveNotificationSettings,
  getNotificationSettings,
  NotificationOptions,
  NotificationAction,
  NotificationTemplates,
} from '../lib/notificationUtils';

export type { NotificationOptions, NotificationAction };

export interface UseNotificationReturn {
  isSupported: boolean;
  permission: NotificationPermission;
  enabled: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  show: (options: NotificationOptions) => Promise<Notification | null>;
  showTemplate: (templateKey: keyof typeof NotificationTemplates, customData?: any) => Promise<Notification | null>;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

export function useNotification(): UseNotificationReturn {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [enabled, setEnabled] = useState<boolean>(true);

  useEffect(() => {
    setIsSupported(isNotificationSupported());
    setPermission(getNotificationPermission());
    setEnabled(getNotificationSettings());
  }, []);

  const requestPermissionHandler = useCallback(async (): Promise<NotificationPermission> => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const show = useCallback(async (options: NotificationOptions): Promise<Notification | null> => {
    if (!enabled) return null;
    if (!isSupported) {
      console.warn('Notifications not supported');
      return null;
    }
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }
    
    return await showNotification(options);
  }, [enabled, isSupported, permission]);

  const showTemplate = useCallback(async (
    templateKey: keyof typeof NotificationTemplates,
    customData?: any
  ): Promise<Notification | null> => {
    const template = NotificationTemplates[templateKey];
    if (!template) return null;
    
    // اعتبارسنجی customData
    let safeData = undefined;
    if (customData && typeof customData === 'object') {
      safeData = { ...customData };
      // حذف فیلدهای خطرناک
      delete safeData.__proto__;
      delete safeData.constructor;
      delete safeData.prototype;
    }
    
    return await show({
      title: template.title,
      body: template.body,
      data: safeData,
    });
  }, [show]);

  const enable = useCallback(() => {
    setEnabled(true);
    saveNotificationSettings(true);
  }, []);

  const disable = useCallback(() => {
    setEnabled(false);
    saveNotificationSettings(false);
  }, []);

  const toggle = useCallback(() => {
    if (enabled) {
      disable();
    } else {
      enable();
    }
  }, [enabled, enable, disable]);

  return {
    isSupported,
    permission,
    enabled,
    requestPermission: requestPermissionHandler,
    show,
    showTemplate,
    enable,
    disable,
    toggle,
  };
}