'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

export interface Notification {
  id: string;
  type: 'order' | 'promo' | 'system' | 'review' | 'message';
  title: string;
  message: string;
  read: boolean;
  timestamp: number;
  icon: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function NotificationBell() {
  const { user } = useAuthUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      loadNotifications();
      // Poll for new notifications every 10 seconds
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      // Mock notifications
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'Đơn hàng #123 đã giao',
          message: 'Đơn hàng của bạn đã được giao thành công',
          read: false,
          timestamp: Date.now() - 1 * 60 * 1000,
          icon: '✅',
          action: { label: 'Xem đơn hàng', href: '/orders/123' },
        },
        {
          id: '2',
          type: 'promo',
          title: 'Khuyến mãi mới',
          message: 'Giảm 20% cho tất cả sản phẩm rau xanh',
          read: true,
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          icon: '🎉',
        },
        {
          id: '3',
          type: 'message',
          title: 'Tin nhắn từ seller',
          message: 'Seller vừa phản hồi câu hỏi của bạn',
          read: false,
          timestamp: Date.now() - 30 * 60 * 1000,
          icon: '💬',
        },
        {
          id: '4',
          type: 'review',
          title: 'Yêu cầu đánh giá',
          message: 'Vui lòng đánh giá sản phẩm bạn vừa mua',
          read: true,
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          icon: '⭐',
        },
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleDeleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-sage-100 rounded-lg transition"
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-stone-800">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-emerald-600 hover:text-emerald-700"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`border-b p-4 hover:bg-sage-50 transition cursor-pointer ${
                    !notification.read ? 'bg-emerald-50' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <span className="text-2xl flex-shrink-0">{notification.icon}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-stone-800 ${!notification.read ? 'text-emerald-600' : ''}`}>
                        {notification.title}
                        {!notification.read && <span className="ml-2">●</span>}
                      </h4>
                      <p className="text-sm text-stone-500 mt-1">{notification.message}</p>
                      <p className="text-xs text-stone-400 mt-2">
                        {new Date(notification.timestamp).toLocaleString('vi-VN')}
                      </p>

                      {/* Action Button */}
                      {notification.action && (
                        <a
                          href={notification.action.href}
                          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium mt-2 inline-block"
                          onClick={e => e.stopPropagation()}
                        >
                          {notification.action.label} →
                        </a>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className="text-stone-300 hover:text-red-600 transition text-lg"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-stone-500">
                Chưa có thông báo nào
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t p-3 text-center">
              <a href="/notifications" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                Xem tất cả thông báo →
              </a>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
