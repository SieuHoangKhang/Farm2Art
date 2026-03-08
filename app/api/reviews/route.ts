import { NextRequest, NextResponse } from 'next/server';
import { Review, ProductRating } from '@/types/review';
import {
  addDocument,
  findDocuments,
  queryCollection,
  updateDocument,
  getDocument,
} from '@/lib/firebase/firestore-utils';
import { where } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required' },
      { status: 400 }
    );
  }

  try {
    // Lấy tất cả reviews của sản phẩm từ Firestore
    const reviews = await findDocuments('reviews', 'productId', productId);
    const approvedReviews = (reviews as any[]).filter(r => r.approved);

    // Tính rating
    const rating = calculateRating(approvedReviews);

    return NextResponse.json({
      reviews: approvedReviews,
      rating,
    });
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      images,
    } = body;

    const parsedRating = Number(rating);

    if (!productId || !userId || !parsedRating || !title || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return NextResponse.json(
        { error: 'Rating must be from 1 to 5' },
        { status: 400 }
      );
    }

    const userDocs = await queryCollection('users', [where('uid', '==', userId)]);
    const userDoc = (userDocs[0] ?? {}) as { accountStatus?: string };
    if (userDoc.accountStatus === 'suspended') {
      return NextResponse.json(
        { error: 'Tài khoản của bạn đang bị khóa đánh giá' },
        { status: 403 }
      );
    }

    const existingReviews = await queryCollection('reviews', [
      where('productId', '==', productId),
      where('userId', '==', userId),
    ]);

    if (existingReviews.length > 0) {
      return NextResponse.json(
        { error: 'Bạn đã đánh giá sản phẩm này rồi' },
        { status: 409 }
      );
    }

    const purchaseOrders = await queryCollection('orders', [
      where('buyerId', '==', userId),
      where('listingId', '==', productId),
    ]);

    const verifiedPurchase = purchaseOrders.some((o: any) =>
      ['confirmed', 'shipping', 'delivered', 'completed'].includes(o.status)
    );

    const now = Date.now();

    const review = await addDocument('reviews', {
      productId,
      userId,
      userName,
      rating: parsedRating,
      title,
      comment,
      images: images || [],
      helpfulCount: 0,
      unhelpfulCount: 0,
      verified: verifiedPurchase,
      approved: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Review submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('reviewId');
    const action = searchParams.get('action');

    if (!reviewId) {
      return NextResponse.json(
        { error: 'Review ID is required' },
        { status: 400 }
      );
    }

    const review = await getDocument('reviews', reviewId);

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    
    // Handle helpful/unhelpful
    if (action === 'helpful') {
      (review as any).helpfulCount = ((review as any).helpfulCount || 0) + 1;
    } else if (action === 'unhelpful') {
      (review as any).unhelpfulCount = ((review as any).unhelpfulCount || 0) + 1;
    } else if (action === 'approve') {
      (review as any).approved = true;
    }

    (review as any).updatedAt = Date.now();
    await updateDocument('reviews', reviewId, review);

    return NextResponse.json(review);
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

function calculateRating(reviews: any[]): ProductRating {
  if (reviews.length === 0) {
    return {
      productId: '',
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  reviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
    totalRating += review.rating;
  });

  return {
    productId: reviews[0]?.productId || '',
    averageRating: totalRating / reviews.length,
    totalReviews: reviews.length,
    ratingDistribution: distribution as any,
  };
}
