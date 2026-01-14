import { NextRequest, NextResponse } from 'next/server';
import { Review, ProductRating } from '@/types/review';

// In-memory storage (replace with Firestore in production)
const reviewsStore: Record<string, Review[]> = {};
const ratingsStore: Record<string, ProductRating> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');

  if (!productId) {
    return NextResponse.json(
      { error: 'Product ID is required' },
      { status: 400 }
    );
  }

  const reviews = reviewsStore[productId] || [];
  const rating = calculateRating(productId, reviews);

  return NextResponse.json({
    reviews: reviews.filter(r => r.approved),
    rating,
  });
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

    if (!productId || !userId || !rating || !title || !comment) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize product reviews if not exists
    if (!reviewsStore[productId]) {
      reviewsStore[productId] = [];
    }

    const review: Review = {
      id: `review_${Date.now()}`,
      productId,
      userId,
      userName,
      rating,
      title,
      comment,
      images: images || [],
      helpfulCount: 0,
      unhelpfulCount: 0,
      verified: true, // TODO: Check if user actually bought this product
      createdAt: Date.now(),
      updatedAt: Date.now(),
      approved: false, // Need admin approval
    };

    reviewsStore[productId].push(review);

    // Update rating
    ratingsStore[productId] = calculateRating(productId, reviewsStore[productId]);

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

    // Find review across all products
    let review: Review | null = null;
    let productId: string | null = null;

    for (const [pid, reviews] of Object.entries(reviewsStore)) {
      const found = reviews.find(r => r.id === reviewId);
      if (found) {
        review = found;
        productId = pid;
        break;
      }
    }

    if (!review || !productId) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Handle helpful/unhelpful
    if (action === 'helpful') {
      review.helpfulCount++;
    } else if (action === 'unhelpful') {
      review.unhelpfulCount++;
    } else if (action === 'approve') {
      review.approved = true;
    }

    review.updatedAt = Date.now();

    return NextResponse.json(review);
  } catch (error) {
    console.error('Review update error:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

function calculateRating(productId: string, reviews: Review[]): ProductRating {
  const approvedReviews = reviews.filter(r => r.approved);
  
  if (approvedReviews.length === 0) {
    return {
      productId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    };
  }

  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let totalRating = 0;

  approvedReviews.forEach(review => {
    distribution[review.rating as keyof typeof distribution]++;
    totalRating += review.rating;
  });

  return {
    productId,
    averageRating: totalRating / approvedReviews.length,
    totalReviews: approvedReviews.length,
    ratingDistribution: distribution as any,
  };
}
