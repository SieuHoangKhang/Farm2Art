import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server';
import type { Listing } from '@/types/listing';

/**
 * PUT /api/admin/listings/approval
 * Admin duyệt hoặc từ chối bài đăng
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action, rejectionReason } = body; // action: "approve" | "reject"

    if (!id || !action) {
      return NextResponse.json(
        { error: 'id and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be approve or reject' },
        { status: 400 }
      );
    }

    const listingRef = doc(serverDb, 'listings', id);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    let updateData: any = {};

    if (action === 'approve') {
      updateData = {
        approvalStatus: 'approved',
        status: 'active',
        approvedAt: Date.now(),
      };
    } else if (action === 'reject') {
      updateData = {
        approvalStatus: 'rejected',
        status: 'inactive',
        rejectedAt: Date.now(),
        rejectionReason: rejectionReason || 'Không đạt tiêu chuẩn',
      };
    }

    await updateDoc(listingRef, updateData);

    return NextResponse.json(
      {
        listingId: id,
        approvalStatus: updateData.approvalStatus,
        message: action === 'approve' ? 'Bài viết đã được duyệt' : 'Bài viết bị từ chối',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Listing approval error:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to process approval: ${errorMsg}` },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/listings/pending
 * Lấy danh sách bài chờ duyệt
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'pending_approval'; // pending_approval | approved | rejected

    const queryRef = query(
      collection(serverDb, 'listings'),
      where('approvalStatus', '==', status)
    );

    const snap = await getDocs(queryRef);
    const listings = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    } as Listing & { id: string }));

    return NextResponse.json(
      {
        count: listings.length,
        listings,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pending listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
