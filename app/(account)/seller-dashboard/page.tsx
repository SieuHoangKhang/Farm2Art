'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import {
  collection, query, where, getDocs, orderBy,
} from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase/client';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  completedOrders: number;
  pendingOrders: number;
  topProducts: Array<{ id: string; name: string; sales: number; revenue: number }>;
  recentOrders: Array<{ id: string; buyerId: string; total: number; status: string; date: number }>;
}

function getSellerEarning(order: any) {
  if (typeof order?.sellerPayout === 'number') return order.sellerPayout;

  const subTotal = typeof order?.subTotal === 'number' ? order.subTotal : order?.totalAmount || 0;
  const platformFee = order?.platformFee || 0;
  return Math.max(subTotal - platformFee, 0);
}

export default function SellerDashboard() {
  const { user } = useAuthUser();
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      fetchMetrics();
    }
  }, [user]);

  const fetchMetrics = async () => {
    try {
      const sellerId = user!.uid;

      // Fetch seller's orders
      const ordersRef = collection(firebaseDb, 'orders');
      const ordersQ = query(ordersRef, where('sellerId', '==', sellerId));
      const ordersSnap = await getDocs(ordersQ);

      let totalRevenue = 0;
      let completedOrders = 0;
      let pendingOrders = 0;
      const productSalesMap = new Map<string, { name: string; sales: number; revenue: number }>();
      const recentOrders: SalesMetrics['recentOrders'] = [];

      ordersSnap.docs.forEach((d) => {
        const order = d.data();
        totalRevenue += getSellerEarning(order);

        if (order.status === 'completed' || order.status === 'delivered') completedOrders++;
        if (order.status === 'pending') pendingOrders++;

        // Track product sales
        if (order.items) {
          order.items.forEach((item: any) => {
            const existing = productSalesMap.get(item.id);
            if (existing) {
              existing.sales += item.quantity || 1;
              existing.revenue += (item.price || 0) * (item.quantity || 1);
            } else {
              productSalesMap.set(item.id, {
                name: item.name || 'Sản phẩm',
                sales: item.quantity || 1,
                revenue: (item.price || 0) * (item.quantity || 1),
              });
            }
          });
        }

        recentOrders.push({
          id: d.id,
          buyerId: order.buyerId,
          total: getSellerEarning(order),
          status: order.status,
          date: order.createdAt,
        });
      });

      // Fetch seller's listings count
      const listingsRef = collection(firebaseDb, 'listings');
      const listingsQ = query(listingsRef, where('sellerId', '==', sellerId));
      const listingsSnap = await getDocs(listingsQ);

      // Sort top products by revenue
      const topProducts = Array.from(productSalesMap.entries())
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Sort recent orders by date
      recentOrders.sort((a, b) => (b.date || 0) - (a.date || 0));

      setMetrics({
        totalRevenue,
        totalOrders: ordersSnap.size,
        totalProducts: listingsSnap.size,
        completedOrders,
        pendingOrders,
        topProducts,
        recentOrders: recentOrders.slice(0, 10),
      });
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', shipping: 'Đang giao',
      delivered: 'Đã giao', completed: 'Hoàn thành', cancelled: 'Đã huỷ',
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800', confirmed: 'bg-blue-100 text-blue-800',
      shipping: 'bg-indigo-100 text-indigo-800', delivered: 'bg-emerald-100 text-emerald-800',
      completed: 'bg-green-100 text-green-800', cancelled: 'bg-red-100 text-red-800',
    };
    return map[s] || 'bg-stone-100 text-stone-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Không thể tải dữ liệu. Hãy thử lại.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-amber-900">Bảng điều khiển bán hàng</h1>
          <p className="text-stone-500 mt-1">Tổng quan hoạt động kinh doanh của bạn</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Tổng doanh thu</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalRevenue.toLocaleString('vi-VN')} VND
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Tổng đơn hàng</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalOrders}
            </div>
            <div className="text-xs text-stone-500 mt-2">
              {metrics.completedOrders} hoàn thành / {metrics.pendingOrders} chờ xử lý
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Sản phẩm đang bán</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalProducts}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Giá trị đơn TB</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalOrders > 0
                ? Math.round(metrics.totalRevenue / metrics.totalOrders).toLocaleString('vi-VN')
                : 0}{' '}
              VND
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">Top sản phẩm bán chạy</h3>
            {metrics.topProducts.length === 0 ? (
              <p className="text-stone-500 text-sm">Chưa có dữ liệu bán hàng</p>
            ) : (
              <div className="space-y-3">
                {metrics.topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-stone-400 text-lg">#{idx + 1}</span>
                      <div>
                        <p className="font-medium text-stone-800 text-sm">{p.name}</p>
                        <p className="text-xs text-stone-500">Đã bán: {p.sales}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-emerald-600 text-sm">
                      {p.revenue.toLocaleString('vi-VN')} VND
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">Đơn hàng gần đây</h3>
            {metrics.recentOrders.length === 0 ? (
              <p className="text-stone-500 text-sm">Chưa có đơn hàng</p>
            ) : (
              <div className="space-y-3">
                {metrics.recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-stone-800">#{o.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-500">
                        {o.date ? new Date(o.date).toLocaleDateString('vi-VN') : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-stone-800">{o.total.toLocaleString('vi-VN')} VND</p>
                      <span className={`inline-block text-xs px-2 py-0.5 rounded ${statusColor(o.status)}`}>
                        {statusLabel(o.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
