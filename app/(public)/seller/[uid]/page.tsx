"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { firebaseDb } from "@/lib/firebase/client";
import { ListingCard } from "@/components/listing/ListingCard";
import type { Listing } from "@/types/listing";
import type { AppUser } from "@/types/user";

export default function SellerPage() {
  const params = useParams();
  const sellerId = params.uid as string;
  const [seller, setSeller] = useState<AppUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSellerData() {
      setLoading(true);
      setError(null);
      try {
        // Load seller info
        const sellerRef = doc(firebaseDb, "users", sellerId);
        const sellerSnap = await getDoc(sellerRef);

        if (!sellerSnap.exists()) {
          setError("Không tìm thấy người bán");
          return;
        }

        setSeller(sellerSnap.data() as AppUser);

        // Load seller's listings
        const q = query(
          collection(firebaseDb, "listings"),
          where("sellerId", "==", sellerId),
          where("status", "==", "active")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Listing[];

        setListings(data.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải thông tin");
      } finally {
        setLoading(false);
      }
    }

    if (sellerId) {
      void loadSellerData();
    }
  }, [sellerId]);

  if (loading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!seller) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-red-700">{error || "Không tìm thấy người bán"}</p>
            <LinkButton href="/search" className="mt-4">
              Quay lại tìm kiếm
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={seller.displayName || "Cửa hàng"} subtitle="Xem tất cả sản phẩm của người bán" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Seller Info */}
        <Card className="mb-6">
          <CardBody>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-stone-600">Tên cửa hàng</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{seller.displayName || "Chưa có tên"}</p>
              </div>
              <div>
                <p className="text-sm text-stone-600">Email</p>
                <p className="mt-2 text-lg font-semibold text-stone-900">{seller.email}</p>
              </div>
              {seller.address && (
                <div>
                  <p className="text-sm text-stone-600">Địa chỉ</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{seller.address}</p>
                </div>
              )}
              {seller.phone && (
                <div>
                  <p className="text-sm text-stone-600">Điện thoại</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{seller.phone}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Listings */}
        <div>
          <p className="mb-4 text-lg font-semibold text-stone-900">
            Sản phẩm ({listings.length})
          </p>
          {listings.length === 0 ? (
            <Card>
              <CardBody>
                <p className="text-stone-600">Người bán này chưa có sản phẩm nào.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
