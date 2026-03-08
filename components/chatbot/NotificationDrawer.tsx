'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

export interface Notification {
  id: string;
  type: 'order' | 'review' | 'message' | 'promotion' | 'system';
  title: string;
  message: string;
  icon: string;
  read: boolean;
  timestamp: number;
  action?: {
    label: string;
    href: string;
  };
}

export default function NotificationDrawer() {
  const { user } = useAuthUser();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      const interval = setInterval(() => loadNotifications(), 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const res = await fetch(`/api/notifications?userId=${user.uid}`);
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
      setNotifications(
        notifications.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/notifications?userId=${user?.uid}`, { method: 'PATCH' });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, { method: 'DELETE' });
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return (
    <>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-stone-600 hover:text-emerald-600 transition"
        title="Thông báo"
      >
        <span className="text-2xl"></span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed top-16 right-4 w-80 max-h-96 bg-white rounded-lg shadow-xl z-50 flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-sage-200 flex justify-between items-center">
              <h3 className="font-semibold text-stone-800">Thông báo</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Đánh dấu tất cả
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`p-4 border-b border-sage-100 hover:bg-sage-50 transition cursor-pointer ${!notif.read ? 'bg-emerald-50' : ''
                      }`}
                    onClick={() => !notif.read && markAsRead(notif.id)}
                  >
                    <div className="flex gap-3">
                      <span className="text-2xl">{notif.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-800 text-sm line-clamp-1">
                          {notif.title}
                        </p>
                        <p className="text-stone-500 text-xs line-clamp-2 mt-1">
                          {notif.message}
                        </p>
                        <p className="text-stone-300 text-xs mt-2">
                          {new Date(notif.timestamp).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-stone-300 hover:text-red-500 text-lg"
                      >
                        ×
                      </button>
                    </div>
                    {notif.action && (
                      <a
                        href={notif.action.href}
                        className="block mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        {notif.action.label} 
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-stone-400">
                  <p>Không có thông báo mới</p>
                </div>
              )}
            </div>


          </div>
        </>
      )}
    </>
  );
}
