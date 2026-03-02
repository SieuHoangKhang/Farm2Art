import { NextRequest, NextResponse } from 'next/server';
import { Wishlist, WishlistItem } from '@/types/wishlist';
import {
  getDocument,
  saveDocument,
  findDocuments,
  updateDocument,
  deleteDocument,
} from '@/lib/firebase/firestore-utils';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'User ID is required' },
      { status: 400 }
    );
  }

  try {
    const wishlist = await getDocument('wishlists', userId);

    if (!wishlist) {
      return NextResponse.json({
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    );
  }
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

    let wishlist = await getDocument('wishlists', userId);

    if (!wishlist) {
      wishlist = {
        userId,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
    }

    const itemIndex = ((wishlist as any).items || []).findIndex(
      (i: any) => i.productId === productId
    );

    if (itemIndex === -1) {
      // Add new item
      if (!(wishlist as any).items) (wishlist as any).items = [];
      (wishlist as any).items.push({
        productId,
        addedAt: new Date().toISOString(),
        priceWhenAdded: price,
        notifyOnDiscount: false,
      });
      (wishlist as any).updatedAt = new Date().toISOString();

      await saveDocument('wishlists', userId, wishlist);
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

    let wishlist = await getDocument('wishlists', userId);
    if (!wishlist) {
      return NextResponse.json(
        { error: 'Wishlist not found' },
        { status: 404 }
      );
    }

    (wishlist as any).items = ((wishlist as any).items || []).filter(
      (i: any) => i.productId !== productId
    );
    (wishlist as any).updatedAt = new Date().toISOString();

    await saveDocument('wishlists', userId, wishlist);

    return NextResponse.json(wishlist);
  } catch (error) {
    console.error('Wishlist delete error:', error);
    return NextResponse.json(
      { error: 'Failed to remove from wishlist' },
      { status: 500 }
    );
  }
}
