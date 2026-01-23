import { NextRequest, NextResponse } from 'next/server';

// Mock analytics data
const analyticsData = {
  totalRevenue: 125450000,
  totalOrders: 3842,
  activeUsers: 12450,
  newListings: 456,
  verifiedSellers: 234,
  platformFee: 12545000,
  userRetention: 0.78,
  avgOrderValue: 32650,
};

const monthlyData = [
  { month: 'Jan', revenue: 8500000, orders: 260, users: 8200 },
  { month: 'Feb', revenue: 9200000, orders: 280, users: 8900 },
  { month: 'Mar', revenue: 10100000, orders: 310, users: 9200 },
  { month: 'Apr', revenue: 11200000, orders: 340, users: 9800 },
  { month: 'May', revenue: 12300000, orders: 370, users: 10500 },
  { month: 'Jun', revenue: 13450000, orders: 402, users: 11200 },
  { month: 'Jul', revenue: 14200000, orders: 440, users: 12450 },
  { month: 'Aug', revenue: 14300000, orders: 460, users: 12800 },
];

const topSellers = [
  {
    id: 'seller1',
    name: 'Nông Trại An',
    revenue: 8500000,
    orders: 850,
    rating: 4.9,
    products: 245,
  },
  {
    id: 'seller2',
    name: 'Vườn Mái Nhà',
    revenue: 7200000,
    orders: 720,
    rating: 4.8,
    products: 189,
  },
  {
    id: 'seller3',
    name: 'Nông Sản Sạch',
    revenue: 6800000,
    orders: 680,
    rating: 4.7,
    products: 156,
  },
  {
    id: 'seller4',
    name: 'Tổ Ong Miền Tây',
    revenue: 5900000,
    orders: 590,
    rating: 4.9,
    products: 98,
  },
  {
    id: 'seller5',
    name: 'Cơ Sở Chế Biến TM',
    revenue: 5100000,
    orders: 510,
    rating: 4.6,
    products: 134,
  },
];

const categoryMetrics = [
  { category: 'Vegetables', revenue: 45600000, orders: 1450, growth: 12 },
  { category: 'Fruits', revenue: 35200000, orders: 1100, growth: 18 },
  { category: 'Honey', revenue: 28400000, orders: 800, growth: 25 },
  { category: 'Grains', revenue: 16250000, orders: 500, growth: 8 },
];

const paymentMethods = {
  vnpay: 45,
  momo: 28,
  card: 18,
  bank: 9,
};

const userMetrics = {
  totalRegistered: 45200,
  activeMonthly: 12450,
  newThisMonth: 2340,
  averageSessionDuration: '8m 35s',
  bounceRate: 32,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    if (metric === 'summary') {
      return NextResponse.json(analyticsData);
    }

    if (metric === 'monthly') {
      return NextResponse.json({ data: monthlyData });
    }

    if (metric === 'top-sellers') {
      const limit = parseInt(searchParams.get('limit') || '5');
      return NextResponse.json({ data: topSellers.slice(0, limit) });
    }

    if (metric === 'categories') {
      return NextResponse.json({ data: categoryMetrics });
    }

    if (metric === 'payments') {
      return NextResponse.json({ data: paymentMethods });
    }

    if (metric === 'users') {
      return NextResponse.json({ data: userMetrics });
    }

    // Return all metrics
    return NextResponse.json({
      summary: analyticsData,
      monthly: monthlyData,
      topSellers: topSellers,
      categories: categoryMetrics,
      payments: paymentMethods,
      users: userMetrics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
