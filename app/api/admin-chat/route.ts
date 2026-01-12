import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo (replace with database in production)
const adminChats: Record<string, any[]> = {};

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    // Initialize user conversation if not exists
    if (!adminChats[userId]) {
      adminChats[userId] = [];
    }

    // Save user message
    const userMessage = {
      id: Date.now().toString(),
      userId,
      userName: userName || 'Guest',
      message,
      timestamp: Date.now(),
      isAdmin: false,
    };

    adminChats[userId].push(userMessage);
    console.log('Message saved:', userMessage.id);

    return NextResponse.json(
      { success: true, messageId: userMessage.id },
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

// Get messages for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    const messages = adminChats[userId] || [];
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

