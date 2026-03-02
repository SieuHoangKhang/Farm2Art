'use client';

import React, { useState, useEffect } from 'react';
import { Review, ProductRating } from '@/types/review';

interface ProductRatingsProps {
  productId: string;
}

export default function ProductRatings({ productId }: ProductRatingsProps) {
  const [rating, setRating] = useState<ProductRating | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | 'all'>(0); // 0 = all, 1-5 = stars
  const [sortBy, setSortBy] = useState<'newest' | 'helpful'>('newest');

  useEffect(() => {
    fetchRatings();
  }, [productId]);

  const fetchRatings = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const data = await res.json();
      setRating(data.rating);
      setReviews(data.reviews);
    } catch (error) {
      console.error('Failed to fetch ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  const filteredReviews = filter === 'all' 
    ? reviews 
    : reviews.filter(r => r.rating === filter);

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'newest') return b.createdAt - a.createdAt;
    return b.helpfulCount - a.helpfulCount;
  });

  const renderStars = (stars: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={i <= stars ? '⭐' : '☆'}>
            {i <= stars ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="py-8 border-t">
      <h2 className="text-2xl font-semibold mb-8">Đánh giá sản phẩm</h2>

      {/* Rating Summary */}
      {rating && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-orange-500 mb-2">
              {rating.averageRating.toFixed(1)}
            </div>
            <div className="mb-2">{renderStars(Math.round(rating.averageRating))}</div>
            <p className="text-stone-500 text-sm">{rating.totalReviews} đánh giá</p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2">
            {[5, 4, 3, 2, 1].map(stars => (
              <div key={stars} className="flex items-center gap-2 mb-2">
                <span className="text-sm w-12">{stars} ⭐</span>
                <div className="flex-1 bg-stone-200 rounded-full h-2">
                  <div
                    className="bg-orange-400 h-2 rounded-full"
                    style={{
                      width: `${rating.totalReviews > 0 
                        ? (rating.ratingDistribution[stars as keyof typeof rating.ratingDistribution] / rating.totalReviews * 100)
                        : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm text-stone-500 w-12 text-right">
                  {rating.ratingDistribution[stars as keyof typeof rating.ratingDistribution]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
          }`}
        >
          Tất cả ({reviews.length})
        </button>
        {[5, 4, 3, 2, 1].map(stars => (
          <button
            key={stars}
            onClick={() => setFilter(stars)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === stars
                ? 'bg-emerald-500 text-white'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {stars} ⭐ ({rating?.ratingDistribution[stars as keyof typeof rating.ratingDistribution] || 0})
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="mb-6">
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as 'newest' | 'helpful')}
          className="px-4 py-2 border border-sage-300 rounded-lg text-sm"
        >
          <option value="newest">Mới nhất</option>
          <option value="helpful">Hữu ích nhất</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {sortedReviews.length > 0 ? (
          sortedReviews.map(review => (
            <div key={review.id} className="border-b pb-6 last:border-b-0">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-stone-800">{review.userName}</span>
                    {review.verified && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        ✓ Đã mua
                      </span>
                    )}
                  </div>
                  <div>{renderStars(review.rating)}</div>
                </div>
                <span className="text-sm text-stone-400">
                  {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>

              <h3 className="font-semibold text-stone-800 mb-1">{review.title}</h3>
              <p className="text-stone-600 mb-3">{review.comment}</p>

              {/* Review Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-3">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Review ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80"
                    />
                  ))}
                </div>
              )}

              {/* Helpful Count */}
              <div className="flex gap-4 text-sm">
                <button className="text-stone-500 hover:text-emerald-500">
                  👍 Hữu ích ({review.helpfulCount})
                </button>
                <button className="text-stone-500 hover:text-emerald-500">
                  👎 Không hữu ích ({review.unhelpfulCount})
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-stone-500">
            Chưa có đánh giá cho bộ lọc này
          </div>
        )}
      </div>
    </div>
  );
}
