"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing } from "@/types/listing";

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { user } = useAuthUser();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyLoading, setBuyLoading] = useState(false);
  const [seller, setSeller] = useState<{ name: string; id: string } | null>(null);

  useEffect(() => {
    async function loadListing() {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(firebaseDb, "listings", listingId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setError("Không tìm thấy sản phẩm");
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as Listing;
        setListing(data);

        // Load seller info
        const sellerRef = doc(firebaseDb, "users", data.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setSeller({ name: sellerSnap.data().displayName || sellerSnap.id, id: sellerSnap.id });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải sản phẩm");
      } finally {
        setLoading(false);
      }
    }

    void loadListing();
  }, [listingId]);

  async function handleBuyNow() {
    if (!user || !listing) return;

    if (user.uid === listing.sellerId) {
      setError("Bạn không thể mua sản phẩm của chính mình");
      return;
    }

    setBuyLoading(true);
    try {
      // Create order
      const response = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          sellerId: listing.sellerId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Lỗi khi tạo đơn hàng");
      }

      const { orderId } = await response.json();
      router.push(`/account/orders/${orderId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tạo đơn hàng");
    } finally {
      setBuyLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="mt-4 text-sm text-stone-500">Đang tải sản phẩm...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-stone-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
        </div>
        <h2 className="text-xl font-bold text-stone-800">Không tìm thấy sản phẩm</h2>
        <p className="mt-2 text-sm text-stone-500">{error || "Sản phẩm này có thể đã bị xóa hoặc không tồn tại."}</p>
        <LinkButton href="/search" className="mt-6">
          ← Quay lại tìm kiếm
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title={listing.title} subtitle={listing.type === "byproduct" ? "Phế phẩm nông nghiệp" : "Sản phẩm thủ công"} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-5">
            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-sage-200/60 bg-white shadow-sm">
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.secureUrl || ""}
                    alt={listing.title}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">Mô tả</h3>
                </div>
                <p className="text-stone-600 text-sm leading-relaxed">{listing.description}</p>
              </CardBody>
            </Card>

            {/* Details */}
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center">
                    <svg className="h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">Chi tiết sản phẩm</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Loại", value: listing.type === "byproduct" ? "Phế phẩm nông nghiệp" : "Sản phẩm thủ công" },
                    { label: "Địa điểm", value: listing.location },
                    { label: "Ngày đăng", value: new Date(listing.createdAt).toLocaleDateString("vi-VN") },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-2.5">
                      <span className="text-sm text-stone-500">
                        {item.label}
                      </span>
                      <span className="text-sm font-medium text-stone-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price Card - Premium */}
            <div className="rounded-2xl overflow-hidden border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Giá bán</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-700">
                  {listing.price.toLocaleString("vi-VN")} <span className="text-lg font-bold">VNĐ</span>
                </p>
                {listing.quantity && (
                  <p className="mt-1 text-sm text-stone-500">
                    Còn {listing.quantity.toLocaleString("vi-VN")} {listing.unit ?? ""}
                  </p>
                )}
              </div>
            </div>

            {/* Seller Info */}
            {seller && (
              <Card>
                <CardBody>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {seller.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs text-stone-400">Người bán</p>
                      <p className="font-semibold text-stone-800 text-sm">{seller.name}</p>
                    </div>
                  </div>
                  <LinkButton href={`/seller/${seller.id}`} variant="secondary" className="mt-4 block w-full text-center text-xs">
                    Xem cửa hàng →
                  </LinkButton>
                </CardBody>
              </Card>
            )}

            {/* Buy Button */}
            {user && user.uid !== listing.sellerId ? (
              <div className="space-y-3">
                <Button
                  onClick={handleBuyNow}
                  disabled={buyLoading}
                  className="w-full !py-3.5 text-base animate-pulseGlow"
                >
                  {buyLoading ? "Đang xử lý..." : "Mua ngay"}
                </Button>
                <LinkButton href={`/account/chat?sellerId=${listing.sellerId}`} variant="outline" className="block w-full text-center text-xs">
                  Liên hệ người bán
                </LinkButton>
              </div>
            ) : user ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 text-center">
                <p className="text-sm text-stone-500">Bạn không thể mua sản phẩm của chính mình</p>
              </div>
            ) : (
              <div className="space-y-3">
                <LinkButton href="/login" className="block w-full text-center !py-3">
                  Đăng nhập để mua
                </LinkButton>
                <LinkButton href={`/account/chat?sellerId=${listing.sellerId}`} variant="secondary" className="block w-full text-center text-xs">
                  Liên hệ người bán
                </LinkButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
