'use client';

import React, { useState, useEffect } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { Wishlist } from '@/types/wishlist';
import Link from 'next/link';

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuthUser();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [productDetails, setProductDetails] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!authLoading && user) {
      fetchWishlist();
    }
  }, [user, authLoading]);

  const fetchWishlist = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch(`/api/wishlist?userId=${user.uid}`);
      const data = await response.json();
      setWishlist(data);

      // Fetch product details
      if (data.items && data.items.length > 0) {
        const details: Record<string, any> = {};
        // TODO: Fetch actual product data from mock or Firebase
        setProductDetails(details);
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!user?.uid) return;

    try {
      await fetch(`/api/wishlist?userId=${user.uid}&productId=${productId}`, {
        method: 'DELETE',
      });

      if (wishlist) {
        setWishlist({
          ...wishlist,
          items: wishlist.items.filter(i => i.productId !== productId),
        });
      }
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Vui lòng đăng nhập</h1>
          <p className="text-gray-600 mb-6">Để xem danh sách yêu thích của bạn</p>
          <Link href="/login" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-semibold mb-8">❤️ Danh sách yêu thích</h1>

        {!wishlist || wishlist.items.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-gray-600 mb-6">Chưa có sản phẩm yêu thích nào</p>
            <Link href="/search" className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600">
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.items.map(item => (
              <div key={item.productId} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
                {/* Product Image Placeholder */}
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">Hình ảnh sản phẩm</span>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Sản phẩm {item.productId}</h3>
                  
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-orange-500">
                      {(item.priceWhenAdded * 1000).toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="space-y-2">
                    <Link
                      href={`/listing/${item.productId}`}
                      className="block w-full text-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
                    >
                      Xem chi tiết
                    </Link>
                    <button
                      onClick={() => handleRemove(item.productId)}
                      className="w-full px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      Xóa khỏi yêu thích
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t text-sm text-gray-500">
                    Thêm vào {new Date(item.addedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
