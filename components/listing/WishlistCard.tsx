'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import type { Listing } from '@/types/listing';
import { formatVnd } from '@/lib/utils/format';

interface WishlistItem {
  productId: string;
  listing: Listing;
  addedAt: number;
  priceWhenAdded: number;
}

export default function WishlistCard({ item, onRemove }: { item: WishlistItem; onRemove: (id: string) => void }) {
  const { user } = useAuthUser();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!user) return;
    setIsRemoving(true);
    
    try {
      await fetch(`/api/wishlist?userId=${user.uid}&productId=${item.productId}`, {
        method: 'DELETE',
      });
      onRemove(item.productId);
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const priceChange = item.listing.price - item.priceWhenAdded;
  const priceChangePercent = (priceChange / item.priceWhenAdded) * 100;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition">
      <Link href={`/listing/${item.productId}`}>
        <div className="relative aspect-[4/3] w-full bg-gray-100">
          {item.listing.images && item.listing.images.length > 0 ? (
            <Image
              src={typeof item.listing.images[0] === 'string' ? item.listing.images[0] : ''}
              alt={item.listing.title}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
              Không có ảnh
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link href={`/listing/${item.productId}`}>
          <h3 className="font-semibold text-gray-900 line-clamp-2 hover:text-blue-600">
            {item.listing.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-emerald-600">
              {formatVnd(item.listing.price)}
            </div>
            {priceChange !== 0 && (
              <div className={`text-sm ${priceChange > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {priceChange > 0 ? '↑' : '↓'} {formatVnd(Math.abs(priceChange))} 
                ({priceChangePercent > 0 ? '+' : ''}{priceChangePercent.toFixed(0)}%)
              </div>
            )}
          </div>
          <button
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-500 hover:text-red-700 disabled:opacity-50"
            title="Xóa khỏi danh sách yêu thích"
          >
            ❤️
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          Thêm vào: {new Date(item.addedAt).toLocaleDateString('vi-VN')}
        </p>

        <Link href={`/listing/${item.productId}`}>
          <button className="w-full mt-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium">
            Xem chi tiết
          </button>
        </Link>
      </div>
    </div>
  );
}
