import { NextRequest, NextResponse } from 'next/server';
import { SellerVerification } from '@/types/seller';

// In-memory storage
const verificationsStore: Record<string, SellerVerification> = {
  'seller_verified_1': {
    sellerId: 'seller_verified_1',
    status: 'approved',
    businessName: 'Farm2Art Organic',
    businessRegistration: 'https://example.com/cert1.pdf',
    ownerName: 'Nguyễn Văn A',
    ownerID: 'https://example.com/id1.jpg',
    bankAccount: '1234567890',
    bankName: 'Vietcombank',
    businessAddress: '123 Lê Lợi, Hà Nội',
    phone: '0123456789',
    email: 'farm2art@example.com',
    approvedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    verificationBadge: true,
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sellerId = searchParams.get('sellerId');

  if (!sellerId) {
    return NextResponse.json(
      { error: 'Seller ID is required' },
      { status: 400 }
    );
  }

  const verification = verificationsStore[sellerId] || {
    sellerId,
    status: 'none',
  };

  return NextResponse.json(verification);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sellerId,
      businessName,
      businessRegistration,
      ownerName,
      ownerID,
      bankAccount,
      bankName,
      businessAddress,
      phone,
      email,
    } = body;

    if (!sellerId || !businessName || !ownerName || !bankAccount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const verification: SellerVerification = {
      sellerId,
      status: 'pending',
      businessName,
      businessRegistration,
      ownerName,
      ownerID,
      bankAccount,
      bankName,
      businessAddress,
      phone,
      email,
      documentSubmittedAt: Date.now(),
      verificationBadge: false,
    };

    verificationsStore[sellerId] = verification;

    return NextResponse.json(verification, { status: 201 });
  } catch (error) {
    console.error('Verification submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit verification' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get('sellerId');
    const action = searchParams.get('action');

    if (!sellerId) {
      return NextResponse.json(
        { error: 'Seller ID is required' },
        { status: 400 }
      );
    }

    const verification = verificationsStore[sellerId];
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    if (action === 'approve') {
      verification.status = 'approved';
      verification.approvedAt = Date.now();
      verification.verificationBadge = true;
    } else if (action === 'reject') {
      const { rejectionReason } = await request.json();
      verification.status = 'rejected';
      verification.rejectionReason = rejectionReason;
    }

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Verification update error:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}
