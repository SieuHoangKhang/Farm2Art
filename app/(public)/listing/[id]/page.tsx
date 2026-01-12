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
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-red-700">{error || "Không tìm thấy sản phẩm"}</p>
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
      <PageHeader title={listing.title} subtitle={listing.type === "byproduct" ? "Sản phẩm phụ" : "Tác phẩm nghệ thuật"} />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4">
            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <Card>
                <CardBody>
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={typeof listing.images[0] === "string" ? listing.images[0] : listing.images[0]?.secureUrl || ""}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Description */}
            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-stone-900">Mô tả</p>
                <p className="mt-3 text-stone-700">{listing.description}</p>
              </CardBody>
            </Card>

            {/* Details */}
            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-stone-900">Chi tiết sản phẩm</p>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Loại:</span>
                    <span className="font-medium text-stone-900">
                      {listing.type === "byproduct" ? "Sản phẩm phụ" : "Tác phẩm nghệ thuật"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Địa điểm:</span>
                    <span className="font-medium text-stone-900">{listing.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Ngày đăng:</span>
                    <span className="font-medium text-stone-900">
                      {new Date(listing.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Price */}
            <Card>
              <CardBody>
                <p className="text-sm text-stone-600">Giá</p>
                <p className="mt-2 text-3xl font-bold text-emerald-600">
                  {listing.price.toLocaleString("vi-VN")} VNĐ
                </p>
              </CardBody>
            </Card>

            {/* Seller Info */}
            {seller && (
              <Card>
                <CardBody>
                  <p className="text-sm font-semibold text-stone-900">Người bán</p>
                  <p className="mt-3 font-medium text-stone-900">{seller.name}</p>
                  <LinkButton href={`/seller/${seller.id}`} variant="secondary" className="mt-3 block w-full text-center">
                    Xem cửa hàng
                  </LinkButton>
                </CardBody>
              </Card>
            )}

            {/* Buy Button */}
            {user && user.uid !== listing.sellerId ? (
              <Card>
                <CardBody>
                  <Button
                    onClick={handleBuyNow}
                    disabled={buyLoading}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                  >
                    {buyLoading ? "Đang xử lý..." : "Mua ngay"}
                  </Button>
                </CardBody>
              </Card>
            ) : user ? (
              <Card>
                <CardBody>
                  <p className="text-sm text-stone-600">Bạn không thể mua sản phẩm của chính mình</p>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardBody>
                  <LinkButton href="/auth/login" className="block w-full text-center">
                    Đăng nhập để mua
                  </LinkButton>
                </CardBody>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardBody>
                <LinkButton href={`/account/chat?sellerId=${listing.sellerId}`} variant="secondary" className="block w-full text-center">
                  Liên hệ người bán
                </LinkButton>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
