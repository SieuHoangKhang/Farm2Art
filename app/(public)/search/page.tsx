"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, QueryConstraint } from "firebase/firestore";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ListingCard } from "@/components/listing/ListingCard";
import { SearchFilters } from "@/components/listing/SearchFilters";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing, ListingType } from "@/types/listing";

export default function SearchPage({
  // eslint-disable-next-line no-unused-vars
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; type?: string; minPrice?: string; maxPrice?: string; location?: string }>;
}) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [queryText, setQueryText] = useState("");
  const [typeFilter, setTypeFilter] = useState<ListingType | undefined>(undefined);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);
  const [location, setLocation] = useState("");

  // Load listings on filter change
  useEffect(() => {
    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const constraints: QueryConstraint[] = [where("status", "==", "active")];

        if (typeFilter) {
          constraints.push(where("type", "==", typeFilter));
        }

        const q = query(collection(firebaseDb, "listings"), ...constraints);
        const snapshot = await getDocs(q);
        let results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Listing[];

        // Client-side filtering cho text search, price range, location
        results = results.filter((listing) => {
          // Text search
          if (queryText) {
            const searchLower = queryText.toLowerCase();
            const matches =
              listing.title.toLowerCase().includes(searchLower) ||
              (listing.description ?? "").toLowerCase().includes(searchLower);
            if (!matches) return false;
          }

          // Price range filter
          if (minPrice > 0 && listing.price < minPrice) return false;
          if (maxPrice > 0 && listing.price > maxPrice) return false;

          // Location filter
          if (location) {
            const locationLower = location.toLowerCase();
            if (!(listing.location ?? "").toLowerCase().includes(locationLower)) return false;
          }

          return true;
        });

        setListings(results);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tìm kiếm");
      } finally {
        setLoading(false);
      }
    }

    void loadListings();
  }, [queryText, typeFilter, minPrice, maxPrice, location]);

  return (
    <div>
      <PageHeader title="Tìm kiếm" subtitle="Khám phá phế phẩm nông nghiệp và sản phẩm tái chế" />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <SearchFilters
              query={queryText}
              onQueryChange={setQueryText}
              type={typeFilter}
              onTypeChange={setTypeFilter}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              location={location}
              onLocationChange={setLocation}
              onApplyFilters={() => {}}
              loading={loading}
            />
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

            {loading ? (
              <div className="text-center text-stone-600">Đang tìm kiếm...</div>
            ) : listings.length === 0 ? (
              <Card>
                <CardBody>
                  <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50 p-6 text-center">
                    <p className="text-sm font-medium text-stone-900">Không tìm thấy kết quả</p>
                    <p className="mt-1 text-sm text-stone-600">Thử thay đổi từ khóa hoặc bộ lọc.</p>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <div>
                <p className="mb-4 text-sm text-stone-600">Tìm thấy {listings.length} sản phẩm</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
