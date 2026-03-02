import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');

    // Fetch from Firestore
    const [ordersSnap, usersSnap, listingsSnap, verificationsSnap] = await Promise.all([
      getDocs(collection(firebaseDb, 'orders')),
      getDocs(collection(firebaseDb, 'users')),
      getDocs(collection(firebaseDb, 'listings')),
      getDocs(query(collection(firebaseDb, 'seller_verifications'), where('status', '==', 'approved'))),
    ]);

    // Calculate summary
    let totalRevenue = 0;
    let totalOrders = ordersSnap.size;
    const ordersByStatus: Record<string, number> = {};
    const sellerRevenueMap = new Map<string, { name: string; revenue: number; orders: number }>();
    const categoryMap = new Map<string, { revenue: number; orders: number }>();

    ordersSnap.docs.forEach((d) => {
      const order = d.data();
      totalRevenue += order.totalAmount || 0;
      ordersByStatus[order.status] = (ordersByStatus[order.status] || 0) + 1;

      // Track seller revenue
      const existing = sellerRevenueMap.get(order.sellerId);
      if (existing) {
        existing.revenue += order.totalAmount || 0;
        existing.orders += 1;
      } else {
        sellerRevenueMap.set(order.sellerId, {
          name: order.sellerName || order.sellerId,
          revenue: order.totalAmount || 0,
          orders: 1,
        });
      }
    });

    // Count listings by category
    listingsSnap.docs.forEach((d) => {
      const listing = d.data();
      const cat = listing.category || 'Khác';
      const existing = categoryMap.get(cat);
      if (existing) {
        existing.orders += 1;
      } else {
        categoryMap.set(cat, { revenue: 0, orders: 1 });
      }
    });

    const summary = {
      totalRevenue,
      totalOrders,
      activeUsers: usersSnap.size,
      newListings: listingsSnap.size,
      verifiedSellers: verificationsSnap.size,
      avgOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
      ordersByStatus,
    };

    if (metric === 'summary') {
      return NextResponse.json(summary);
    }

    // Top sellers
    const topSellers = Array.from(sellerRevenueMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    if (metric === 'top-sellers') {
      return NextResponse.json({ data: topSellers });
    }

    // Categories
    const categories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.orders - a.orders);

    if (metric === 'categories') {
      return NextResponse.json({ data: categories });
    }

    // Users info
    let adminCount = 0;
    let sellerCount = 0;
    usersSnap.docs.forEach((d) => {
      const u = d.data();
      if (u.role === 'admin') adminCount++;
      if (u.role === 'seller') sellerCount++;
    });

    const userMetrics = {
      totalRegistered: usersSnap.size,
      admins: adminCount,
      sellers: sellerCount,
      buyers: usersSnap.size - adminCount - sellerCount,
    };

    if (metric === 'users') {
      return NextResponse.json({ data: userMetrics });
    }

    // Return all
    return NextResponse.json({
      summary,
      topSellers,
      categories,
      users: userMetrics,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
