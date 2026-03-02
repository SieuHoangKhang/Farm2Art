import { NextRequest, NextResponse } from 'next/server';

interface Listing {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  seller: string;
  rating: number;
  reviews: number;
}

// Mock listings database - Farm2Art byproduct & craft domain
const mockListings: Listing[] = [
  {
    id: '1',
    title: 'Rơm lúa mì chất lượng cao',
    category: 'byproduct',
    price: 450000,
    image: '/images/byproduct-1.jpg',
    seller: 'Trang trại Bắc Ninh',
    rating: 4.8,
    reviews: 345,
  },
  {
    id: '2',
    title: 'Trấu cà phê nguyên liệu',
    category: 'byproduct',
    price: 320000,
    image: '/images/byproduct-2.jpg',
    seller: 'HTX Hà Nội',
    rating: 4.9,
    reviews: 456,
  },
  {
    id: '3',
    title: 'Vỏ cà phê tươi',
    category: 'byproduct',
    price: 280000,
    image: '/images/byproduct-3.jpg',
    seller: 'Nông trại Đắk Lắk',
    rating: 4.7,
    reviews: 234,
  },
  {
    id: '4',
    title: 'Túi xách thủ công từ rơm',
    category: 'craft',
    price: 350000,
    image: '/images/craft-1.jpg',
    seller: 'Xưởng Na Xá',
    rating: 4.6,
    reviews: 567,
  },
  {
    id: '5',
    title: 'Đệm tatami rơm tự nhiên',
    category: 'craft',
    price: 800000,
    image: '/images/craft-2.jpg',
    seller: 'Thương lái Nội',
    rating: 4.8,
    reviews: 890,
  },
  {
    id: '6',
    title: 'Giỏ dệt trấu handmade',
    category: 'craft',
    price: 280000,
    image: '/images/craft-3.jpg',
    seller: 'Làng nghề Tây Hồ',
    rating: 4.9,
    reviews: 1200,
  },
];

function calculateSimilarity(product: Listing, viewedProduct: Listing): number {
  let score = 0;

  // Same category: +3
  if (product.category === viewedProduct.category) {
    score += 3;
  }

  // Similar price range (within 50%): +2
  const priceDiff = Math.abs(product.price - viewedProduct.price);
  const pricePercentDiff = (priceDiff / viewedProduct.price) * 100;
  if (pricePercentDiff < 50) {
    score += 2;
  }

  // High rating: +1
  if (product.rating >= 4.7) {
    score += 1;
  }

  // Same seller: +2
  if (product.seller === viewedProduct.seller) {
    score += 2;
  }

  return score;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '4');

    if (!productId) {
      // Return trending products if no specific product
      return NextResponse.json({
        recommendations: mockListings
          .sort((a, b) => b.rating * b.reviews - a.rating * a.reviews)
          .slice(0, limit)
          .map(p => ({ ...p, isHot: true })),
      });
    }

    // Find the product being viewed
    const viewedProduct = mockListings.find(p => p.id === productId);
    if (!viewedProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate similarity scores for all other products
    const scored = mockListings
      .filter(p => p.id !== productId)
      .map(p => ({
        ...p,
        similarity: calculateSimilarity(p, viewedProduct),
        isHot: p.rating * p.reviews > 2000,
      }));

    // Sort by similarity and return top N
    const recommendations = scored
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Recommendations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}
