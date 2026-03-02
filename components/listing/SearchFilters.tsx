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
    <div className="space-y-5 rounded-2xl border border-sage-200/70 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-stone-800">Bộ lọc</h3>
      </div>

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
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Loại sản phẩm</label>
        <div className="space-y-1.5">
          {[
            { value: undefined, label: "Tất cả" },
            { value: "byproduct" as const, label: "Phế phẩm" },
            { value: "art" as const, label: "Tái chế" },
          ].map((opt) => (
            <label
              key={opt.value ?? "all"}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                type === opt.value
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm"
                  : "hover:bg-stone-50 border border-transparent"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={opt.value ?? ""}
                checked={type === opt.value}
                onChange={() => onTypeChange(opt.value)}
                disabled={loading}
                className="sr-only"
              />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-sage-200 to-transparent" />

      {/* Price Range */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">Giá (VNĐ)</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Từ"
            value={minPrice || ""}
            onChange={(e) => onMinPriceChange(Number(e.target.value) || 0)}
            disabled={loading}
            className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm placeholder-stone-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
          />
          <input
            type="number"
            placeholder="Đến"
            value={maxPrice || ""}
            onChange={(e) => onMaxPriceChange(Number(e.target.value) || 0)}
            disabled={loading}
            className="w-full rounded-xl border border-sage-200 bg-white px-3 py-2.5 text-sm placeholder-stone-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
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
