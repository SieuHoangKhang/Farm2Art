"use client";

/* eslint-disable no-unused-vars */
import { TextField } from "@/components/ui/TextField";
import { Button } from "@/components/ui/Button";
import type { ListingType } from "@/types/listing";

type SearchFiltersProps = {
  query: string;
  onQueryChange: (q: string) => void;
  type: ListingType | undefined;
  onTypeChange: (t: ListingType | undefined) => void;
  minPrice: number;
  onMinPriceChange: (p: number) => void;
  maxPrice: number;
  onMaxPriceChange: (p: number) => void;
  location: string;
  onLocationChange: (l: string) => void;
  onApplyFilters: () => void;
  loading?: boolean;
};

export function SearchFilters({
  query,
  onQueryChange,
  type,
  onTypeChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  location,
  onLocationChange,
  onApplyFilters,
  loading,
}: SearchFiltersProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-900">Tìm kiếm & Lọc</h3>

      {/* Search Input */}
      <TextField
        label="Tìm kiếm"
        placeholder="Nhập tên sản phẩm, mô tả..."
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        disabled={loading}
      />

      {/* Category Filter */}
      <div>
        <label className="block text-sm font-medium text-stone-700">Loại sản phẩm</label>
        <div className="mt-2 space-y-2">
          {[
            { value: undefined, label: "Tất cả" },
            { value: "byproduct" as const, label: "Phế phẩm nông nghiệp" },
            { value: "art" as const, label: "Sản phẩm tái chế" },
          ].map((opt) => (
            <label key={opt.value ?? "all"} className="flex items-center gap-2">
              <input
                type="radio"
                name="type"
                value={opt.value ?? ""}
                checked={type === opt.value}
                onChange={() => onTypeChange(opt.value)}
                disabled={loading}
                className="h-4 w-4"
              />
              <span className="text-sm text-stone-700">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium text-stone-700">Khoảng giá (VNĐ)</label>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            placeholder="Tối thiểu"
            value={minPrice || ""}
            onChange={(e) => onMinPriceChange(Number(e.target.value) || 0)}
            disabled={loading}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder-stone-500 focus:border-emerald-500 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Tối đa"
            value={maxPrice || ""}
            onChange={(e) => onMaxPriceChange(Number(e.target.value) || 0)}
            disabled={loading}
            className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder-stone-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Location Filter */}
      <TextField
        label="Địa chỉ"
        placeholder="VD: Hồ Chí Minh, Hà Nội..."
        value={location}
        onChange={(e) => onLocationChange(e.target.value)}
        disabled={loading}
      />

      {/* Apply Button */}
      <Button onClick={onApplyFilters} disabled={loading} className="w-full">
        {loading ? "Đang tìm kiếm..." : "Áp dụng bộ lọc"}
      </Button>
    </div>
  );
}
