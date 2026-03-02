'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface SalesMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
  }>;
  customerMetrics: {
    totalCustomers: number;
    repeatCustomers: number;
    averageRating: number;
  };
}

export default function SellerDashboard() {
  const { user } = useAuthUser();
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (user?.uid) {
      fetchMetrics();
    }
  }, [user, timeRange]);

  const fetchMetrics = async () => {
    try {
      // Mock data - replace with actual API call
      const mockMetrics: SalesMetrics = {
        totalRevenue: 45000000,
        totalOrders: 1250,
        totalProducts: 48,
        averageOrderValue: 36000,
        conversionRate: 3.2,
        topProducts: [
          { id: '1', name: 'Rau cải xanh organic', sales: 350, revenue: 8750000 },
          { id: '2', name: 'Dâu tây tươi', sales: 280, revenue: 11200000 },
          { id: '3', name: 'Bưởi vàng Nam Định', sales: 215, revenue: 6450000 },
          { id: '4', name: 'Cam sáng', sales: 198, revenue: 5940000 },
          { id: '5', name: 'Chanh leo organic', sales: 187, revenue: 5610000 },
        ],
        monthlyRevenue: [
          { month: 'T1', revenue: 8000000 },
          { month: 'T2', revenue: 9500000 },
          { month: 'T3', revenue: 7200000 },
          { month: 'T4', revenue: 10300000 },
          { month: 'T5', revenue: 12000000 },
          { month: 'T6', revenue: 15000000 },
          { month: 'T7', revenue: 16000000 },
          { month: 'T8', revenue: 14500000 },
          { month: 'T9', revenue: 11000000 },
          { month: 'T10', revenue: 13500000 },
          { month: 'T11', revenue: 14200000 },
          { month: 'T12', revenue: 16800000 },
        ],
        customerMetrics: {
          totalCustomers: 2340,
          repeatCustomers: 890,
          averageRating: 4.7,
        },
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
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
        <p className="text-stone-500">Không thể tải dữ liệu</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...metrics.monthlyRevenue.map(m => m.revenue));

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-amber-900">📊 Bảng điều khiển bán hàng</h1>
            <p className="text-stone-500 mt-1">Xem tổng quan hoạt động kinh doanh của bạn</p>
          </div>

          <select
            value={timeRange}
            onChange={e => setTimeRange(e.target.value as typeof timeRange)}
            className="px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7d">7 ngày</option>
            <option value="30d">30 ngày</option>
            <option value="90d">90 ngày</option>
            <option value="1y">1 năm</option>
          </select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue */}
          <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Tổng doanh thu</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {(metrics.totalRevenue / 1000000).toFixed(1)}M đ
            </div>
            <div className="text-green-600 text-sm mt-2">↑ 12% so với tháng trước</div>
          </div>

          {/* Orders */}
          <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Tổng đơn hàng</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalOrders.toLocaleString('vi-VN')}
            </div>
            <div className="text-emerald-600 text-sm mt-2">↑ 8% so với tháng trước</div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Sản phẩm hiện có</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {metrics.totalProducts}
            </div>
            <div className="text-stone-500 text-sm mt-2">+3 sản phẩm mới</div>
          </div>

          {/* Avg Order */}
          <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <div className="text-stone-500 text-sm font-medium">Giá trị đơn TB</div>
            <div className="text-3xl font-bold text-stone-800 mt-2">
              {(metrics.averageOrderValue / 1000).toFixed(0)}K đ
            </div>
            <div className="text-green-600 text-sm mt-2">↑ 5% so với tháng trước</div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">Doanh thu hàng tháng</h3>
            <div className="flex items-end gap-2 h-64">
              {metrics.monthlyRevenue.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-emerald-500 rounded-t-lg transition hover:bg-emerald-600 cursor-pointer"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                    title={`${data.month}: ${(data.revenue / 1000000).toFixed(1)}M`}
                  ></div>
                  <span className="text-xs text-stone-500 mt-2">{data.month}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Metrics */}
          <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-amber-900 mb-4">Khách hàng</h3>
            <div className="space-y-4">
              <div>
                <div className="text-stone-500 text-sm">Tổng khách hàng</div>
                <div className="text-2xl font-bold text-stone-800">
                  {metrics.customerMetrics.totalCustomers.toLocaleString('vi-VN')}
                </div>
              </div>
              <div>
                <div className="text-stone-500 text-sm">Khách hàng tái lập</div>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.customerMetrics.repeatCustomers}
                  <span className="text-sm text-stone-500 ml-1">
                    ({((metrics.customerMetrics.repeatCustomers / metrics.customerMetrics.totalCustomers) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
              <div>
                <div className="text-stone-500 text-sm">Đánh giá trung bình</div>
                <div className="text-2xl font-bold text-yellow-500">
                  {metrics.customerMetrics.averageRating}⭐
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-sage-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-amber-900 mb-4">Top sản phẩm</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm text-stone-500">
                  <th className="pb-3 px-4">Sản phẩm</th>
                  <th className="pb-3 px-4">Số lượng bán</th>
                  <th className="pb-3 px-4">Doanh thu</th>
                  <th className="pb-3 px-4">% Tổng</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topProducts.map((product, idx) => (
                  <tr key={product.id} className="border-b hover:bg-sage-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-stone-800 text-lg">#{idx + 1}</span>
                        <span className="text-stone-700">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{product.sales}</td>
                    <td className="py-3 px-4 font-semibold text-green-600">
                      {(product.revenue / 1000000).toFixed(1)}M đ
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {((product.revenue / metrics.totalRevenue) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
