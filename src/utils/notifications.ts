/**
 * Real-Time Notification & Device Alert Service
 * Handles browser Web Notifications, Web Audio chimes, and mobile device vibration.
 */

export interface DeviceNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: Record<string, unknown>;
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export async function requestDeviceNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('Failed to request notification permission', err);
    return 'denied';
  }
}

export function getDeviceNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

/**
 * Triggers an immediate native device notification + vibration
 */
export function sendDeviceNotification(payload: DeviceNotificationPayload): Notification | null {
  // Mobile vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // Urgent pattern: beep-pause-beep-pause-long
      navigator.vibrate([300, 150, 300, 150, 600]);
    } catch {
      // Ignore vibration error
    }
  }

  if (!isNotificationSupported()) {
    return null;
  }

  if (Notification.permission === 'granted') {
    try {
      const notif = new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon.ico',
        tag: payload.tag || 'rotativo-302-alert',
        requireInteraction: payload.requireInteraction ?? true,
      });

      notif.onclick = () => {
        window.focus();
        notif.close();
      };

      return notif;
    } catch (err) {
      console.warn('Native notification failed:', err);
      return null;
    }
  }

  return null;
}
