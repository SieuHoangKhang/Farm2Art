'use client';

import React, { useState, useEffect } from 'react';

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  rating: number;
  image?: string;
  reason: 'similar' | 'frequently_bought' | 'popular' | 'personalized';
}

interface ProductRecommendationsProps {
  productId: string;
  userBrowsingHistory?: string[];
  userPurchaseHistory?: string[];
}

export default function ProductRecommendations({
  productId,
  userBrowsingHistory = [],
  userPurchaseHistory = [],
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'similar' | 'frequently' | 'popular'>('similar');

  useEffect(() => {
    fetchRecommendations();
  }, [productId]);

  const fetchRecommendations = async () => {
    try {
      // Mock recommendations
      const mockRecs: RecommendedProduct[] = [
        {
          id: '201',
          name: 'Rau cải xanh organic',
          price: 45000,
          rating: 4.8,
          reason: 'similar',
        },
        {
          id: '202',
          name: 'Rau bó xôi tươi',
          price: 35000,
          rating: 4.6,
          reason: 'similar',
        },
        {
          id: '203',
          name: 'Dâu tây tươi',
          price: 89000,
          rating: 4.9,
          reason: 'frequently_bought',
        },
        {
          id: '204',
          name: 'Chanh leo organic',
          price: 30000,
          rating: 4.7,
          reason: 'frequently_bought',
        },
        {
          id: '205',
          name: 'Cam sáng',
          price: 25000,
          rating: 4.5,
          reason: 'popular',
        },
        {
          id: '206',
          name: 'Bưởi vàng Nam Định',
          price: 30000,
          rating: 4.8,
          reason: 'personalized',
        },
      ];

      setRecommendations(mockRecs);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationsByTab = () => {
    return recommendations.filter(rec => {
      if (activeTab === 'similar') return rec.reason === 'similar';
      if (activeTab === 'frequently') return rec.reason === 'frequently_bought';
      if (activeTab === 'popular') return rec.reason === 'popular' || rec.reason === 'personalized';
      return false;
    });
  };

  const tabRecommendations = getRecommendationsByTab();

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <h3 className="text-2xl font-semibold text-gray-900 mb-6">Sản phẩm liên quan</h3>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('similar')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'similar'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          🔍 Sản phẩm tương tự
        </button>
        <button
          onClick={() => setActiveTab('frequently')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'frequently'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          🛒 Thường mua cùng
        </button>
        <button
          onClick={() => setActiveTab('popular')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'popular'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-600 border-transparent hover:text-gray-900'
          }`}
        >
          ⭐ Phổ biến & Cá nhân
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tabRecommendations.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition cursor-pointer"
          >
            {/* Image */}
            <div className="w-full aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400">Ảnh sản phẩm</span>
            </div>

            {/* Info */}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h4>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                <span>⭐</span>
                <span className="text-sm font-medium text-gray-900">{product.rating}</span>
              </div>

              {/* Price */}
              <div className="text-2xl font-bold text-orange-500 mb-4">
                {(product.price / 1000).toFixed(0)}K đ
              </div>

              {/* Action */}
              <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
                Xem chi tiết
              </button>
            </div>
          </div>
        ))}
      </div>

      {tabRecommendations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Không có sản phẩm gợi ý cho mục này</p>
        </div>
      )}
    </div>
  );
}
