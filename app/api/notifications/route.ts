import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notification';

// In-memory notification storage
const notificationsStore: Record<string, Notification[]> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const userNotifications = notificationsStore[userId] || [];

  return NextResponse.json({
    notifications: userNotifications,
    unreadCount: userNotifications.filter(n => !n.read).length,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { userId, type, title, message, icon, action } = await request.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize user notifications if not exists
    if (!notificationsStore[userId]) {
      notificationsStore[userId] = [];
    }

    const notification: Notification = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      icon: icon || '📢',
      read: false,
      timestamp: Date.now(),
      action,
    };

    notificationsStore[userId].unshift(notification);

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Notification creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const notificationId = searchParams.get('notificationId');
    const action = searchParams.get('action');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (action === 'markAsRead') {
      const userNotifications = notificationsStore[userId];
      if (!userNotifications) {
        return NextResponse.json(
          { error: 'Notifications not found' },
          { status: 404 }
        );
      }

      if (notificationId) {
        // Mark single notification as read
        const notification = userNotifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      } else {
        // Mark all as read
        userNotifications.forEach(n => (n.read = true));
      }

      return NextResponse.json({
        success: true,
        unreadCount: userNotifications.filter(n => !n.read).length,
      });
    }

    if (action === 'delete') {
      const userNotifications = notificationsStore[userId];
      if (!userNotifications) {
        return NextResponse.json(
          { error: 'Notifications not found' },
          { status: 404 }
        );
      }

      if (notificationId) {
        notificationsStore[userId] = userNotifications.filter(n => n.id !== notificationId);
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}
