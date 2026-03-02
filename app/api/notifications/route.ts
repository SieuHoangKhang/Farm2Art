import { NextRequest, NextResponse } from 'next/server';
import { Notification } from '@/types/notification';
import {
  addDocument,
  findDocuments,
  updateDocument,
  getDocument,
  queryCollection,
} from '@/lib/firebase/firestore-utils';
import { orderBy } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const userNotifications = await findDocuments(
      'notifications',
      'userId',
      userId
    );

    return NextResponse.json({
      notifications: userNotifications.reverse(),
      unreadCount: userNotifications.filter((n: any) => !n.read).length,
    });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
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

    const notification = await addDocument('notifications', {
      userId,
      type,
      title,
      message,
      icon: icon || '📢',
      read: false,
      action,
    });

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
      if (notificationId) {
        // Mark single notification as read
        await updateDocument('notifications', notificationId, { read: true });
      } else {
        // Mark all as read for user
        const userNotifications = await findDocuments(
          'notifications',
          'userId',
          userId
        );
        for (const notif of userNotifications) {
          await updateDocument('notifications', notif.id, { read: true });
        }
      }

      const remaining = await findDocuments('notifications', 'userId', userId);
      return NextResponse.json({
        success: true,
        unreadCount: remaining.filter((n: any) => !n.read).length,
      });
    }

    if (action === 'delete') {
      if (notificationId) {
        await updateDocument('notifications', notificationId, { deleted: true });
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
