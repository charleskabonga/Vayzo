/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  X,
  ShoppingBag,
  Bike,
  AlertTriangle,
  CreditCard,
  Info,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AppNotification, NotificationTargetRole } from '../types';
import { notificationService, PushPermissionStatus } from '../services/notificationService';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeRole: string;
  onSelectOrder?: (orderId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  activeRole,
  onSelectOrder
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    notificationService.getStoredNotifications()
  );
  const [permissionStatus, setPermissionStatus] = useState<PushPermissionStatus>('default');
  const [roleFilter, setRoleFilter] = useState<NotificationTargetRole>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  // Sync notifications on mount and listen to custom updates
  useEffect(() => {
    setPermissionStatus(notificationService.getPermissionStatus());

    const handleUpdate = (e: any) => {
      setNotifications(e.detail || notificationService.getStoredNotifications());
    };

    window.addEventListener('vayzo_notifications_updated', handleUpdate);
    return () => window.removeEventListener('vayzo_notifications_updated', handleUpdate);
  }, []);

  // Request browser push permissions
  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    setPermissionStatus(status);
  };

  // Trigger real test push notification
  const handleSendTestPush = () => {
    notificationService.sendPushNotification({
      title: 'Vayzo Live Test Alert 🚀',
      body: 'Push notifications are working perfectly! You will receive live alerts for orders, riders, and store updates.',
      targetRole: 'all',
      type: 'system',
      playAudio: soundEnabled
    });

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getStoredNotifications());
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getStoredNotifications());
  };

  const handleClearAll = () => {
    notificationService.clearAll();
    setNotifications([]);
  };

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (roleFilter === 'all') return true;
    return n.targetRole === roleFilter || n.targetRole === 'all';
  });

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600" />;
      case 'delivery':
        return <Bike className="w-4 h-4 text-amber-600" />;
      case 'inventory':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-purple-600" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (60 * 1000));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-4 bg-emerald-950 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-emerald-900/80 border border-emerald-800 text-lime-400">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-lime-400 text-emerald-950 text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-black text-sm text-white">Push Notifications</h3>
              <p className="text-[11px] text-emerald-300">Live order & merchant dispatch alerts</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
              title={soundEnabled ? 'Mute Chime Sound' : 'Enable Chime Sound'}
              aria-label="Toggle Sound"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition"
              aria-label="Close Notifications"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Browser Push Permission & Test Banner */}
        <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Browser Push:</span>
              {permissionStatus === 'granted' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Active & Enabled
                </span>
              ) : permissionStatus === 'denied' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                  Blocked in Browser
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Not Enabled Yet
                </span>
              )}
            </div>

            {permissionStatus !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white font-black text-[11px] shadow-xs transition"
              >
                Enable Push
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-emerald-100/60">
            <p className="text-[11px] text-slate-500">
              {permissionStatus === 'granted'
                ? 'System alerts will pop up when orders change.'
                : 'Enable to get native alerts for rider arrival and kitchen status.'}
            </p>
            <button
              onClick={handleSendTestPush}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 flex items-center gap-1 ${
                testNotificationSent
                  ? 'bg-lime-400 text-emerald-950 font-black'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {testNotificationSent ? (
                <>
                  <Check className="w-3 h-3 text-emerald-950" />
                  <span>Pushed!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Test Push</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Chips & Bulk Actions */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {(['all', 'customer', 'merchant', 'rider'] as NotificationTargetRole[]).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition shrink-0 ${
                  roleFilter === role
                    ? 'bg-emerald-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="p-1 text-slate-500 hover:text-emerald-800 text-xs flex items-center gap-0.5"
                title="Mark all as read"
                aria-label="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1 text-slate-400 hover:text-rose-600 text-xs"
                title="Clear all notifications"
                aria-label="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <BellOff className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-bold text-sm text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Place an order, dispatch a rider, or click "Test Push" above to see live notifications.
              </p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-3 rounded-2xl border transition cursor-pointer relative group ${
                  n.read
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-emerald-50/40 border-emerald-300/80 shadow-2xs'
                }`}
              >
                {!n.read && (
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-600" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-white border border-slate-100 shadow-2xs shrink-0 mt-0.5">
                    {getNotificationIcon(n.type)}
                  </div>

                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className={`text-xs truncate ${n.read ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                        {n.title}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {n.body}
                    </p>

                    <div className="flex items-center gap-2 mt-2 text-[10px]">
                      <span className="text-slate-400 font-medium">
                        {formatRelativeTime(n.createdAt)}
                      </span>

                      {n.targetRole && (
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[9px]">
                          {n.targetRole}
                        </span>
                      )}

                      {n.orderId && onSelectOrder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOrder(n.orderId!);
                            onClose();
                          }}
                          className="text-emerald-700 hover:text-emerald-950 font-bold flex items-center gap-0.5 ml-auto"
                        >
                          <span>Track #{n.orderId}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400">
            Vayzo Real-Time Dispatch & Messaging Protocol • Lusaka, Zambia
          </p>
        </div>
      </div>
    </div>
  );
};
