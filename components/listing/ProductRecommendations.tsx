'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  seller: string;
  isHot?: boolean;
}

interface ProductRecommendationsProps {
  productId: string;
}

export default function ProductRecommendations({
  productId,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [productId]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        `/api/recommendations?productId=${productId}&limit=4`
      );
      const data = await response.json();
      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-6">Sản phẩm được đề xuất</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recommendations.map((product) => (
          <Link
            key={product.id}
            href={`/listing/${product.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
          >
            <div className="relative h-40 bg-gray-100 rounded-t-lg overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-green-100 to-blue-100">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
              {product.isHot && (
                <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                  HOT
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                {product.title}
              </h3>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-green-600">
                  {product.price.toLocaleString()}đ
                </span>
              </div>
              <div className="flex items-center text-xs text-gray-600">
                <span className="text-yellow-500">★</span>
                <span className="ml-1">
                  {product.rating} ({product.reviews})
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 line-clamp-1">
                {product.seller}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
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
