"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing } from "@/types/listing";

export default function MyListingsPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    if (userLoading || !user) return;

    async function loadListings() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(firebaseDb, "listings"), where("sellerId", "==", user!.uid));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Listing[];

        if (filter !== "all") {
          data = data.filter((l) => l.status === filter);
        }

        setListings(data.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải bài đăng");
      } finally {
        setLoading(false);
      }
    }

    void loadListings();
  }, [user, userLoading, filter]);

  async function handleDelete(listingId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa bài đăng này?")) return;

    try {
      await deleteDoc(doc(firebaseDb, "listings", listingId));
      setListings(listings.filter((l) => l.id !== listingId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi xóa bài đăng");
    }
  }

  async function handleToggleStatus(listing: Listing) {
    const newStatus = listing.status === "active" ? ("inactive" as const) : ("active" as const);
    try {
      await updateDoc(doc(firebaseDb, "listings", listing.id), { status: newStatus });
      setListings(listings.map((l) => (l.id === listing.id ? { ...l, status: newStatus } : l)) as Listing[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi cập nhật trạng thái");
    }
  }

  if (userLoading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-stone-600">Vui lòng đăng nhập để xem bài đăng.</p>
            <LinkButton href="/auth/login" className="mt-4">
              Đăng nhập
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Bài đăng của tôi" subtitle="Quản lý tất cả sản phẩm bạn đang bán" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            {(["all", "active", "inactive"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-emerald-600 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
              >
                {f === "all" ? "Tất cả" : f === "active" ? "Đang bán" : "Tạm ẩn"}
              </button>
            ))}
          </div>
          <LinkButton href="/account/create-listing" className="bg-emerald-600 text-white">
            + Đăng bán mới
          </LinkButton>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <div className="text-center text-stone-600">Đang tải...</div>
        ) : listings.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-stone-600">Bạn chưa có bài đăng nào.</p>
              <LinkButton href="/account/create-listing" className="mt-4">
                Bắt đầu đăng bán
              </LinkButton>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => (
              <Card key={listing.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-stone-900">{listing.title}</h3>
                      <p className="mt-1 text-sm text-stone-600">
                        {listing.price.toLocaleString("vi-VN")} VNĐ
                      </p>
                      <p className="mt-1 text-xs text-stone-500">
                        {new Date(listing.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          listing.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {listing.status === "active" ? "Đang bán" : "Tạm ẩn"}
                      </span>
                      <div className="mt-3 flex gap-2">
                        <LinkButton href={`/listing/${listing.id}`} variant="secondary" className="text-xs">
                          Xem
                        </LinkButton>
                        <Button
                          onClick={() => void handleToggleStatus(listing)}
                          className="text-xs bg-stone-200 text-stone-900 hover:bg-stone-300"
                        >
                          {listing.status === "active" ? "Ẩn" : "Hiện"}
                        </Button>
                        <Button
                          onClick={() => void handleDelete(listing.id)}
                          className="text-xs bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
