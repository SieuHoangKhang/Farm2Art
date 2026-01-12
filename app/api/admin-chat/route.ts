import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, ServiceAccount } from 'firebase-admin/app';

// Initialize Firebase Admin if not already initialized
const getAdminApp = () => {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccount: ServiceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  return initializeApp({
    credential: require('firebase-admin').credential.cert(serviceAccount),
  });
};

export async function POST(request: NextRequest) {
  try {
    const { userId, userName, message } = await request.json();

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'Missing userId or message' },
        { status: 400 }
      );
    }

    const app = getAdminApp();
    const db = getFirestore(app);

    // Save message to Firestore with admin privileges
    const docRef = await db
      .collection('admin_chats')
      .doc(userId)
      .collection('messages')
      .add({
        userId,
        userName: userName || 'Guest',
        message,
        timestamp: Timestamp.now(),
        isAdmin: false,
        read: false,
      });

    console.log('Message saved:', docRef.id);

    return NextResponse.json(
      { success: true, messageId: docRef.id },
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

    const app = getAdminApp();
    const db = getFirestore(app);

    const snapshot = await db
      .collection('admin_chats')
      .doc(userId)
      .collection('messages')
      .orderBy('timestamp', 'asc')
      .get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    }));

    return NextResponse.json({ messages }, { status: 200 });
  } catch (error: any) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
