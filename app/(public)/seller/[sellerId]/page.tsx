'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { ListingCard } from '@/components/listing/ListingCard';
import type { Listing } from '@/types/listing';

interface SellerProfile {
  id: string;
  displayName: string;
  email: string;
  avatar?: string;
  bio?: string;
  ratings: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
  stats: {
    totalListings: number;
    totalSales: number;
    responseTime: string;
    joinedDate: number;
  };
  listings: Listing[];
}

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'about'>('listings');

  useEffect(() => {
    if (sellerId) {
      loadSellerProfile();
    }
  }, [sellerId]);

  const loadSellerProfile = async () => {
    try {
      // Mock seller profile (in real app, fetch from Firestore)
      const mockProfile: SellerProfile = {
        id: sellerId,
        displayName: 'Farm Seller ' + sellerId.slice(0, 8),
        email: `seller_${sellerId.slice(0, 6)}@farm2art.com`,
        bio: 'Chúng tôi cung cấp phế phẩm nông nghiệp chất lượng cao và sản phẩm tái chế sáng tạo.',
        ratings: {
          averageRating: 4.5,
          totalReviews: 128,
          ratingDistribution: {
            5: 95,
            4: 25,
            3: 6,
            2: 1,
            1: 1,
          },
        },
        stats: {
          totalListings: 24,
          totalSales: 342,
          responseTime: 'Trong vòng 2 giờ',
          joinedDate: Date.now() - 180 * 24 * 60 * 60 * 1000, // 6 months ago
        },
        listings: [],
      };
      setSeller(mockProfile);
    } catch (error) {
      console.error('Failed to load seller profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Không tìm thấy người bán</p>
          <Link href="/search" className="text-blue-600 hover:text-blue-700 font-medium">
            Quay lại tìm kiếm
          </Link>
        </div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i}>
            {i <= Math.round(rating) ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title={seller.displayName} subtitle="Trang hồ sơ người bán" />

      <Container>
        <div className="py-8">
          {/* Seller Info Card */}
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Avatar & Name */}
              <div className="flex flex-col items-center">
                {seller.avatar ? (
                  <Image
                    src={seller.avatar}
                    alt={seller.displayName}
                    width={120}
                    height={120}
                    className="rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-4xl mb-4">
                    👤
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 text-center">
                  {seller.displayName}
                </h1>
                <p className="text-gray-600 text-sm mt-1">{seller.email}</p>
              </div>

              {/* Ratings */}
              <div className="border-l border-r border-gray-200 px-8 flex flex-col justify-center">
                <p className="text-gray-600 text-sm mb-2">Đánh giá</p>
                <div className="text-5xl font-bold text-orange-500 mb-2">
                  {seller.ratings.averageRating.toFixed(1)}
                </div>
                <div className="mb-3">{renderStars(seller.ratings.averageRating)}</div>
                <p className="text-sm text-gray-600">
                  {seller.ratings.totalReviews} đánh giá
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-col justify-center space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Sản phẩm đang bán</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {seller.stats.totalListings}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tổng giao dịch</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {seller.stats.totalSales}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Thời gian phản hồi</p>
                  <p className="text-lg font-semibold text-emerald-600">
                    {seller.stats.responseTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {seller.bio && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <p className="text-gray-700">{seller.bio}</p>
              </div>
            )}

            {/* Contact Button */}
            <div className="mt-8 flex gap-3">
              <button className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition">
                💬 Liên hệ người bán
              </button>
              <button className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-blue-500 hover:text-blue-500 font-medium transition">
                ❤️ Theo dõi
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="flex border-b">
              {['listings', 'about'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as typeof activeTab)}
                  className={`flex-1 py-4 px-6 font-medium text-center border-b-2 transition ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab === 'listings' && `📦 Sản phẩm (${seller.stats.totalListings})`}
                  {tab === 'about' && '📋 Thông tin'}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === 'listings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Show sample listings */}
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4 text-center text-gray-500">
                      <p>Sản phẩm mẫu {i}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Thông tin người bán</h3>
                    <p className="text-gray-700">{seller.bio}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Ngày gia nhập</h3>
                    <p className="text-gray-700">
                      {new Date(seller.stats.joinedDate).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Chính sách</h3>
                    <ul className="space-y-2 text-gray-700 text-sm">
                      <li>✓ Hỗ trợ tư vấn miễn phí</li>
                      <li>✓ Đóng gói chuyên nghiệp</li>
                      <li>✓ Giao hàng an toàn</li>
                      <li>✓ Hỗ trợ trước/sau bán hàng tốt</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
