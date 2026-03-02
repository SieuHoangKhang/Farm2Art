import { NextRequest, NextResponse } from 'next/server';
import {
  addDocument,
  queryCollection,
  findDocuments,
  updateDocument,
} from '@/lib/firebase/firestore-utils';
import { where, orderBy } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    // Save message to Firestore
    const messageDoc = await addDocument('admin_chat_messages', {
      userId,
      userName: userName || 'Guest',
      message,
      timestamp: new Date().toISOString(),
      isAdmin: false,
      read: false,
    });

    console.log('Message saved to Firestore:', messageDoc.id);

    return NextResponse.json(
      { success: true, messageId: messageDoc.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin chat API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save message' },
      { status: 500 }
    );
  }
}


// Get messages for a user or all conversations
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const getAllConversations = request.nextUrl.searchParams.get('all') === 'true';

    if (getAllConversations) {
      // Return all conversations for admin dashboard
      const messages = await queryCollection('admin_chat_messages', [
        orderBy('timestamp', 'desc'),
      ]);
      
      // Group by userId
      const conversations: Record<string, any[]> = {};
      (messages as any[]).forEach((msg: any) => {
        if (!conversations[msg.userId]) {
          conversations[msg.userId] = [];
        }
        conversations[msg.userId].push(msg);
      });

      return NextResponse.json({ conversations }, { status: 200 });
    }

    if (userId) {
      const messages = await findDocuments('admin_chat_messages', 'userId', userId);
      return NextResponse.json({ messages }, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Missing userId or all parameter' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST admin reply
export async function PUT(request: NextRequest) {
  try {
    const { userId, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    const adminMessage = await addDocument('admin_chat_messages', {
      userId,
      userName: 'Admin',
      message,
      timestamp: new Date().toISOString(),
      isAdmin: true,
      read: false,
    });

    console.log('Admin reply saved to Firestore:', adminMessage.id);

    return NextResponse.json(
      { success: true, messageId: adminMessage.id },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Admin reply error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save reply' },
      { status: 500 }
    );
  }
}
