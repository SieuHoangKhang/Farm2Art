import { NextRequest, NextResponse } from 'next/server';
import { Wishlist, WishlistItem } from '@/types/wishlist';

// In-memory storage
const wishlistStore: Record<string, Wishlist> = {};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  const wishlist = wishlistStore[userId] || {
    userId,
    items: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return NextResponse.json(wishlist);
}

export async function POST(request: NextRequest) {
  try {
    const { userId, productId, price } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    // Initialize wishlist if not exists
    if (!wishlistStore[userId]) {
      wishlistStore[userId] = {
        userId,
        items: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    const wishlist = wishlistStore[userId];
    const itemIndex = wishlist.items.findIndex(i => i.productId === productId);

    if (itemIndex === -1) {
      // Add new item
      wishlist.items.push({
        productId,
        addedAt: Date.now(),
        priceWhenAdded: price,
        notifyOnDiscount: false,
      });
      wishlist.updatedAt = Date.now();
    }

    return NextResponse.json(wishlist, { status: 201 });
  } catch (error) {
    console.error('Wishlist add error:', error);
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    const wishlist = wishlistStore[userId];
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    wishlist.items = wishlist.items.filter(i => i.productId !== productId);
    wishlist.updatedAt = Date.now();

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
