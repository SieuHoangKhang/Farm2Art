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

// Get messages for a user or all conversations
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const getAllConversations = request.nextUrl.searchParams.get('all') === 'true';

    if (getAllConversations) {
      // Return all conversations for admin dashboard
      return NextResponse.json({ conversations: adminChats }, { status: 200 });
    }

    if (userId) {
      const messages = adminChats[userId] || [];
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

    // Initialize if needed
    if (!adminChats[userId]) {
      adminChats[userId] = [];
    }

    const adminMessage = {
      id: Date.now().toString(),
      userId,
      userName: 'Admin',
      message,
      timestamp: Date.now(),
      isAdmin: true,
    };

    adminChats[userId].push(adminMessage);
    console.log('Admin reply saved:', adminMessage.id);

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

