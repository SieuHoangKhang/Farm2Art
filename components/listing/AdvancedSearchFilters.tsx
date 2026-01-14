'use client';

import React, { useState, useEffect } from 'react';

export interface SearchFiltersState {
  category: string;
  priceMin: number;
  priceMax: number;
  minRating: number;
  inStockOnly: boolean;
  sortBy: 'newest' | 'popular' | 'priceAsc' | 'priceDesc' | 'ratingDesc';
}

interface SearchFiltersComponentProps {
  onFilterChange: (filters: SearchFiltersState) => void;
  categories: string[];
}

export default function AdvancedSearchFilters({
  onFilterChange,
  categories = ['Rau xanh', 'Trái cây', 'Trang trại', 'Đặc sản', 'Sơ chế'],
}: SearchFiltersComponentProps) {
  const [filters, setFilters] = useState<SearchFiltersState>({
    category: '',
    priceMin: 0,
    priceMax: 1000000,
    minRating: 0,
    inStockOnly: false,
    sortBy: 'newest',
  });

  useEffect(() => {
    onFilterChange(filters);
  }, [filters]);

  const handlePriceRangeChange = (min: number, max: number) => {
    setFilters({ ...filters, priceMin: min, priceMax: max });
  };

  const handleReset = () => {
    const resetFilters: SearchFiltersState = {
      category: '',
      priceMin: 0,
      priceMax: 1000000,
      minRating: 0,
      inStockOnly: false,
      sortBy: 'newest',
    };
    setFilters(resetFilters);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Bộ lọc</h3>
        <button
          onClick={handleReset}
          className="text-sm text-blue-500 hover:text-blue-700 underline"
        >
          Đặt lại
        </button>
      </div>

      <div className="space-y-6">
        {/* Category */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Danh mục</h4>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="category"
                value=""
                checked={filters.category === ''}
                onChange={e => setFilters({ ...filters, category: e.target.value })}
                className="w-4 h-4"
              />
              <span className="ml-2 text-gray-700">Tất cả</span>
            </label>
            {categories.map(cat => (
              <label key={cat} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={filters.category === cat}
                  onChange={e => setFilters({ ...filters, category: e.target.value })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Mức giá</h4>
          <div className="space-y-2">
            {[
              { label: 'Dưới 50K', min: 0, max: 50000 },
              { label: '50K - 100K', min: 50000, max: 100000 },
              { label: '100K - 200K', min: 100000, max: 200000 },
              { label: '200K - 500K', min: 200000, max: 500000 },
              { label: 'Trên 500K', min: 500000, max: 1000000 },
            ].map(range => (
              <label key={range.label} className="flex items-center">
                <input
                  type="radio"
                  name="price"
                  checked={
                    filters.priceMin === range.min && filters.priceMax === range.max
                  }
                  onChange={() => handlePriceRangeChange(range.min, range.max)}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>

          {/* Custom Price Range */}
          <div className="mt-4 space-y-2">
            <div>
              <label className="text-sm text-gray-600">Từ</label>
              <input
                type="number"
                value={filters.priceMin}
                onChange={e =>
                  setFilters({ ...filters, priceMin: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Đến</label>
              <input
                type="number"
                value={filters.priceMax}
                onChange={e =>
                  setFilters({ ...filters, priceMax: parseInt(e.target.value) || 1000000 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Rating */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Đánh giá</h4>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1, 0].map(stars => (
              <label key={stars} className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.minRating === stars}
                  onChange={() => setFilters({ ...filters, minRating: stars })}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-gray-700">
                  {stars === 0 ? 'Tất cả' : `${stars}⭐ trở lên`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* In Stock */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStockOnly}
              onChange={e =>
                setFilters({ ...filters, inStockOnly: e.target.checked })
              }
              className="w-4 h-4"
            />
            <span className="ml-2 text-gray-700 font-medium">Chỉ hàng có sẵn</span>
          </label>
        </div>

        {/* Sort */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Sắp xếp</h4>
          <select
            value={filters.sortBy}
            onChange={e =>
              setFilters({
                ...filters,
                sortBy: e.target.value as SearchFiltersState['sortBy'],
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="priceAsc">Giá thấp đến cao</option>
            <option value="priceDesc">Giá cao đến thấp</option>
            <option value="ratingDesc">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>
    </div>
  );
}
