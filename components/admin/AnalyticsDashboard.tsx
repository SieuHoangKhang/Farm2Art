'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  activeListings: number;
  weeklyRevenue: Array<{ day: string; amount: number }>;
  topSellers: Array<{ name: string; sales: number }>;
  userGrowth: Array<{ month: string; count: number }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      // Mock analytics data
      const mockData: AnalyticsData = {
        totalRevenue: 45680000,
        totalOrders: 1240,
        totalUsers: 2843,
        activeListings: 567,
        weeklyRevenue: [
          { day: 'T2', amount: 5200000 },
          { day: 'T3', amount: 6100000 },
          { day: 'T4', amount: 5800000 },
          { day: 'T5', amount: 7200000 },
          { day: 'T6', amount: 8100000 },
          { day: 'T7', amount: 6900000 },
          { day: 'CN', amount: 5400000 },
        ],
        topSellers: [
          { name: 'Farm Tây Ninh', sales: 342 },
          { name: 'Recycled Art Studio', sales: 298 },
          { name: 'Mekong Byproducts', sales: 245 },
          { name: 'Green Crafts', sales: 198 },
          { name: 'Sustainable Farm', sales: 157 },
        ],
        userGrowth: [
          { month: 'Tháng 7', count: 480 },
          { month: 'Tháng 8', count: 650 },
          { month: 'Tháng 9', count: 820 },
          { month: 'Tháng 10', count: 1100 },
          { month: 'Tháng 11', count: 1450 },
          { month: 'Tháng 12', count: 2843 },
        ],
      };
      setData(mockData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (num: number) => {
    return num.toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) return <div>Không thể tải dữ liệu</div>;

  const maxRevenue = Math.max(...data.weeklyRevenue.map(d => d.amount));
  const maxUsers = Math.max(...data.userGrowth.map(d => d.count));

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-2">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-emerald-600">
              {formatCurrency(data.totalRevenue)}
            </p>
            <p className="text-xs text-gray-500 mt-2">VNĐ</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-2">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-blue-600">{data.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-2">↑ 12% từ tháng trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-2">Người dùng</p>
            <p className="text-3xl font-bold text-purple-600">{data.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-2">↑ 18% từ tháng trước</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-sm text-gray-600 mb-2">Sản phẩm hoạt động</p>
            <p className="text-3xl font-bold text-orange-600">{data.activeListings}</p>
            <p className="text-xs text-gray-500 mt-2">↑ 5% từ tháng trước</p>
          </CardBody>
        </Card>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        {['week', 'month', 'year'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p as any)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              period === p
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            {p === 'week' && 'Tuần này'}
            {p === 'month' && 'Tháng này'}
            {p === 'year' && 'Năm này'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Revenue Chart */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Doanh thu tuần</h3>
            <div className="space-y-3">
              {data.weeklyRevenue.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{item.day}</span>
                    <span className="text-sm text-gray-600">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.amount / maxRevenue) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Top Sellers */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Top 5 người bán</h3>
            <div className="space-y-3">
              {data.topSellers.map((seller, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">#{idx + 1}</p>
                    <p className="text-sm text-gray-600">{seller.name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{
                          width: `${(seller.sales / Math.max(...data.topSellers.map(s => s.sales))) * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-12">
                      {seller.sales}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card>
        <CardBody>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tăng trưởng người dùng</h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
            {data.userGrowth.map((item, idx) => (
              <div key={idx} className="text-center">
                <div className="relative h-48 flex items-end justify-center gap-1 mb-2">
                  <div
                    className="w-8 bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                    style={{ height: `${(item.count / maxUsers) * 100}%` }}
                    title={`${item.month}: ${item.count}`}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">{item.month}</p>
                <p className="text-sm font-semibold text-gray-900">{item.count}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
