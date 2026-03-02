import { NextRequest, NextResponse } from 'next/server';
import {
  getDocument,
  saveDocument,
} from '@/lib/firebase/firestore-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = await getDocument('user_profiles', userId);

    if (!profile) {
      return NextResponse.json({
        userId,
        displayName: '',
        email: '',
        phone: '',
        avatar: undefined,
        savedAddresses: [],
        savedPaymentMethods: [],
        preferences: {
          notifications: true,
          promotionalEmails: true,
          language: 'vi',
          darkMode: false,
        },
        privacy: {
          visibility: 'private',
          showOrderHistory: false,
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, ...profileData } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const profile = {
      userId,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    await saveDocument('user_profiles', userId, profile);

    return NextResponse.json(profile, { status: 201 });
  } catch (error: any) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to save profile' },
      { status: 500 }
    );
  }
}
