import { NextRequest, NextResponse } from 'next/server';

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  reserved: number;
  available: number;
  lastUpdated: string;
}

interface SellerStats {
  sellerId: string;
  totalSales: number;
  revenue: number;
  avgRating: number;
  totalReviews: number;
  responseTime: number; // in hours
  returnRate: number; // percentage
  successRate: number; // percentage
}

// Mock inventory
const mockInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    productId: '1',
    quantity: 500,
    reserved: 120,
    available: 380,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inv-2',
    productId: '2',
    quantity: 300,
    reserved: 85,
    available: 215,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'inv-3',
    productId: '3',
    quantity: 150,
    reserved: 45,
    available: 105,
    lastUpdated: new Date().toISOString(),
  },
];

// Mock seller stats
const mockSellerStats: SellerStats[] = [
  {
    sellerId: 'seller-1',
    totalSales: 850,
    revenue: 8500000,
    avgRating: 4.9,
    totalReviews: 1245,
    responseTime: 2,
    returnRate: 1.2,
    successRate: 98.8,
  },
  {
    sellerId: 'seller-2',
    totalSales: 720,
    revenue: 7200000,
    avgRating: 4.8,
    totalReviews: 1089,
    responseTime: 3,
    returnRate: 2.1,
    successRate: 97.9,
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (type === 'inventory' && id) {
      const item = mockInventory.find(inv => inv.productId === id);
      if (!item) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(item);
    }

    if (type === 'seller-stats' && id) {
      const stats = mockSellerStats.find(s => s.sellerId === id);
      if (!stats) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      return NextResponse.json(stats);
    }

    if (type === 'low-stock') {
      const lowStock = mockInventory.filter(inv => inv.available < 100);
      return NextResponse.json({ items: lowStock });
    }

    return NextResponse.json({
      inventory: mockInventory,
      sellerStats: mockSellerStats,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, id, quantity } = body;

    if (type === 'inventory' && id && quantity !== undefined) {
      const item = mockInventory.find(inv => inv.productId === id);
      if (item) {
        item.quantity = quantity;
        item.available = quantity - item.reserved;
        item.lastUpdated = new Date().toISOString();
        return NextResponse.json({ success: true, item });
      }
    }

    return NextResponse.json({ error: 'Update failed' }, { status: 400 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
