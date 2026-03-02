import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');

  if (!sellerId) {
    return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
  }

  try {
    const docRef = doc(firebaseDb, 'seller_verifications', sellerId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ sellerId, status: 'none' });
    }

    return NextResponse.json({ id: snap.id, ...snap.data() });
  } catch (error) {
    console.error('Seller verification GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch verification' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sellerId, businessName, businessRegistration, ownerName,
      ownerID, bankAccount, bankName, businessAddress, phone, email,
    } = body;

    if (!sellerId || !businessName || !ownerName || !bankAccount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verification = {
      sellerId,
      status: 'pending',
      businessName,
      businessRegistration: businessRegistration || '',
      ownerName,
      ownerID: ownerID || '',
      bankAccount,
      bankName: bankName || '',
      businessAddress: businessAddress || '',
      phone: phone || '',
      email: email || '',
      documentSubmittedAt: Date.now(),
      verificationBadge: false,
    };

    const docRef = doc(firebaseDb, 'seller_verifications', sellerId);
    await setDoc(docRef, verification);

    return NextResponse.json(verification, { status: 201 });
  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json({ error: 'Failed to submit verification' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const action = searchParams.get('action');

    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 });
    }

    const docRef = doc(firebaseDb, 'seller_verifications', sellerId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    if (action === 'approve') {
      await updateDoc(docRef, {
        status: 'approved',
        approvedAt: Date.now(),
        verificationBadge: true,
      });
      // Also update user role to seller
      const userRef = doc(firebaseDb, 'users', sellerId);
      await updateDoc(userRef, { role: 'seller', sellerVerified: true });
    } else if (action === 'reject') {
      const body = await request.json();
      await updateDoc(docRef, {
        status: 'rejected',
        rejectionReason: body.rejectionReason || 'Không đạt yêu cầu',
      });
    }

    const updated = await getDoc(docRef);
    return NextResponse.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error('Verification update error:', error);
    return NextResponse.json({ error: 'Failed to update verification' }, { status: 500 });
  }
}
