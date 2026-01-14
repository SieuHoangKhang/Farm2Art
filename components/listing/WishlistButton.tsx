'use client';

import React, { useState } from 'react';
import { useAuthUser } from '@/lib/auth/useAuthUser';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  price: number;
  isInWishlist?: boolean;
  onToggle?: (added: boolean) => void;
}

export default function WishlistButton({
  productId,
  productName,
  price,
  isInWishlist = false,
  onToggle,
}: WishlistButtonProps) {
  const { user } = useAuthUser();
  const [inWishlist, setInWishlist] = useState(isInWishlist);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!user) {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    setLoading(true);

    try {
      if (inWishlist) {
        // Remove from wishlist
        const response = await fetch(
          `/api/wishlist?userId=${user.uid}&productId=${productId}`,
          { method: 'DELETE' }
        );

        if (!response.ok) throw new Error('Failed to remove from wishlist');

        setInWishlist(false);
        onToggle?.(false);
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.uid,
            productId,
            price,
          }),
        });

        if (!response.ok) throw new Error('Failed to add to wishlist');

        setInWishlist(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Wishlist toggle error:', error);
      alert('Đã xảy ra lỗi, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
        inWishlist
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
      } disabled:opacity-50`}
    >
      <span className="text-lg">{inWishlist ? '❤️' : '🤍'}</span>
      {inWishlist ? 'Đã thích' : 'Thêm yêu thích'}
    </button>
  );
}
