import { NextRequest, NextResponse } from 'next/server';
import type { Listing } from '@/types/listing';

// Mock listings database (in production, use Firestore)
const mockListings: Listing[] = [
  {
    id: 'by-001',
    type: 'byproduct',
    title: 'Rơm khô cuộn (đã phơi)',
    description: 'Rơm khô sạch, phù hợp làm nấm/ủ phân. Có thể giao nội thành.',
    price: 120000,
    quantity: 50,
    unit: 'cuộn',
    location: 'Củ Chi, TP.HCM',
    sellerId: 'seller_cuchi',
    ownerId: 'seller_cuchi',
    images: [],
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
  },
  {
    id: 'by-002',
    type: 'byproduct',
    title: 'Trấu sạch số lượng lớn',
    description: 'Trấu sạch, không mục, không mối. Giá buôn.',
    price: 85000,
    quantity: 100,
    unit: 'kg',
    location: 'Đồng Tháp',
    sellerId: 'seller_dt',
    ownerId: 'seller_dt',
    images: [],
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
  },
  {
    id: 'art-001',
    type: 'art',
    title: 'Tranh tái chế từ vỏ trứng',
    description: 'Tác phẩm nghệ thuật handmade từ vỏ trứng tái chế. Độc đáo và bền vững.',
    price: 350000,
    location: 'TP.HCM',
    sellerId: 'seller_art_1',
    ownerId: 'seller_art_1',
    images: [],
    status: 'active',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 1,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Get filter parameters
    const query = searchParams.get('q')?.toLowerCase() || '';
    const type = searchParams.get('type') as 'byproduct' | 'art' | null;
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '999999999');
    const location = searchParams.get('location')?.toLowerCase() || '';
    const sortBy = searchParams.get('sortBy') || 'newest';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Filter listings
    let filtered = mockListings.filter(listing => {
      // Text search
      if (query && !listing.title.toLowerCase().includes(query) &&
          !listing.description?.toLowerCase().includes(query)) {
        return false;
      }

      // Type filter
      if (type && listing.type !== type) {
        return false;
      }

      // Price range
      if (listing.price < minPrice || listing.price > maxPrice) {
        return false;
      }

      // Location filter
      if (location && !listing.location?.toLowerCase().includes(location)) {
        return false;
      }

      // Status
      if (listing.status !== 'active') {
        return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Pagination
    const total = filtered.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const items = filtered.slice(start, end);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
      filters: {
        types: {
          byproduct: mockListings.filter(l => l.type === 'byproduct').length,
          art: mockListings.filter(l => l.type === 'art').length,
        },
        priceRange: {
          min: Math.min(...mockListings.map(l => l.price)),
          max: Math.max(...mockListings.map(l => l.price)),
        },
        locations: [...new Set(mockListings.map(l => l.location))],
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
