/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNotification, NotificationTargetRole, NotificationType } from '../types';

const STORAGE_KEY = 'vayzo_notifications_v1';
const PERMISSION_KEY = 'vayzo_push_permission_requested';

export type PushPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

// Initial seed notifications representing real platform activity in Lusaka
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    title: 'Order Delivered Successfully!',
    body: 'Order #VZ-712044 from Shoprite Manda Hill was delivered to Kabulonga. Cash delivery fee collected.',
    targetRole: 'customer',
    orderId: 'VZ-712044',
    type: 'delivery',
    read: true,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  },
  {
    id: 'notif_2',
    title: 'New Order Received! 🛒',
    body: 'New order #VZ-890214 received for K830.00. Ready to pack pantry staples.',
    targetRole: 'merchant',
    targetMerchantId: 'm1_shoprite_mandahill',
    orderId: 'VZ-890214',
    type: 'order',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString()
  },
  {
    id: 'notif_3',
    title: 'Courier Dispatch Assigned 🏍️',
    body: 'Delivery task assigned from Hungry Lion (Manda Hill) to Woodlands (3.8 km). Cash fee K27.80.',
    targetRole: 'rider',
    orderId: 'VZ-645892',
    type: 'delivery',
    read: false,
    createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString()
  },
  {
    id: 'notif_4',
    title: 'Low Stock Alert ⚠️',
    body: 'Ritebrand Long Grain Parboiled Rice 2kg has only 12 bags left in stock. Reorder recommended.',
    targetRole: 'merchant',
    targetMerchantId: 'm1_shoprite_mandahill',
    type: 'inventory',
    read: false,
    createdAt: new Date(Date.now() - 1800 * 1000).toISOString()
  }
];

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initServiceWorker();
  }

  // Register service worker if supported
  private async initServiceWorker() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        this.swRegistration = registration;
      } catch (err) {
        // Fallback to in-app and native Notifications
        console.warn('Service worker registration error (expected in some sandboxed iframes):', err);
      }
    }
  }

  // Get current browser push permission status
  public getPermissionStatus(): PushPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as PushPermissionStatus;
  }

  // Request browser push notification permission
  public async requestPermission(): Promise<PushPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }

    try {
      localStorage.setItem(PERMISSION_KEY, 'true');
      const permission = await Notification.requestPermission();
      
      // If granted, send an immediate welcome confirmation notification
      if (permission === 'granted') {
        this.playChime();
        this.triggerSystemNotification(
          'Push Notifications Active! 🔔',
          'You will receive instant updates for order confirmations, kitchen packing, and rider arrival.'
        );
      }
      
      return permission as PushPermissionStatus;
    } catch (err) {
      console.warn('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  // Play pleasant acoustic chime using Web Audio API
  public playChime() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.audioContext || this.audioContext.state === 'suspended') {
        this.audioContext = new AudioCtx();
      }

      const now = this.audioContext.currentTime;
      const osc1 = this.audioContext.createOscillator();
      const osc2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      osc1.start(now);
      osc2.start(now + 0.12);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.45);
    } catch {
      // Audio playback silently skipped if prohibited by browser autoplay policy
    }
  }

  // Trigger native system push notification
  private triggerSystemNotification(title: string, body: string, data?: any) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && 'showNotification' in this.swRegistration) {
          this.swRegistration.showNotification(title, {
            body,
            icon: '/assets/icon.png',
            tag: `vayzo-${Date.now()}`,
            data
          });
        } else {
          new Notification(title, {
            body,
            icon: '/assets/icon.png',
            data
          });
        }
      } catch (err) {
        console.warn('Native notification trigger error:', err);
      }
    }
  }

  // Load notifications from local storage
  public getStoredNotifications(): AppNotification[] {
    if (typeof window === 'undefined') return INITIAL_NOTIFICATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  }

  // Save notifications to storage and notify subscribers
  private saveNotifications(list: AppNotification[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('vayzo_notifications_updated', { detail: list }));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage', e);
    }
  }

  // Primary method to dispatch push notification
  public sendPushNotification(params: {
    title: string;
    body: string;
    targetRole?: NotificationTargetRole;
    targetUserId?: string;
    targetMerchantId?: string;
    orderId?: string;
    type?: NotificationType;
    actionUrl?: string;
    playAudio?: boolean;
  }): AppNotification {
    const {
      title,
      body,
      targetRole = 'all',
      targetUserId,
      targetMerchantId,
      orderId,
      type = 'system',
      actionUrl,
      playAudio = true
    } = params;

    const newNotification: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      body,
      targetRole,
      targetUserId,
      targetMerchantId,
      orderId,
      type,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl
    };

    // 1. Play auditory chime
    if (playAudio) {
      this.playChime();
    }

    // 2. Trigger native OS / browser push notification
    this.triggerSystemNotification(title, body, { orderId, targetRole });

    // 3. Save into local persistent state
    const current = this.getStoredNotifications();
    const updated = [newNotification, ...current].slice(0, 50); // Keep latest 50
    this.saveNotifications(updated);

    return newNotification;
  }

  // Mark single notification as read
  public markAsRead(id: string) {
    const current = this.getStoredNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(updated);
  }

  // Mark all notifications as read
  public markAllAsRead() {
    const current = this.getStoredNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  // Clear all notifications
  public clearAll() {
    this.saveNotifications([]);
  }
}

export const notificationService = new NotificationService();
