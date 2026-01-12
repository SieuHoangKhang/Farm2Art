"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Order } from "@/types/order";

export default function OrdersPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed" | "cancelled">("all");

  useEffect(() => {
    if (userLoading || !user) return;

    async function loadOrders() {
      setLoading(true);
      setError(null);
      try {
        const q = query(collection(firebaseDb, "orders"), where("buyerId", "==", user!.uid));
        const snapshot = await getDocs(q);
        let data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Order[];

        if (filter !== "all") {
          data = data.filter((o) => o.status === filter);
        }

        // Sort by date descending
        data.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, [user, userLoading, filter]);

  if (userLoading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-stone-600">Vui lòng đăng nhập để xem đơn hàng.</p>
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
      <PageHeader title="Đơn hàng của tôi" subtitle="Quản lý tất cả đơn hàng của bạn" />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2">
          {(["all", "pending", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === f
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
              }`}
            >
              {f === "all" ? "Tất cả" : f === "pending" ? "Chờ xử lý" : f === "completed" ? "Hoàn thành" : "Hủy"}
            </button>
          ))}
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        {loading ? (
          <div className="text-center text-stone-600">Đang tải...</div>
        ) : orders.length === 0 ? (
          <Card>
            <CardBody>
              <p className="text-stone-600">Bạn chưa có đơn hàng nào.</p>
              <LinkButton href="/search" className="mt-4">
                Bắt đầu mua sắm
              </LinkButton>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardBody>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">Đơn #{order.id.slice(0, 8)}</p>
                      <p className="mt-1 text-sm text-stone-600">
                        {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                      </p>
                      <p className="mt-2 text-sm text-stone-700">
                        <span className="font-medium">Tổng tiền:</span> {order.totalAmount.toLocaleString("vi-VN")} VNĐ
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status === "pending"
                          ? "Chờ xử lý"
                          : order.status === "completed"
                            ? "Hoàn thành"
                            : "Hủy"}
                      </span>
                      <LinkButton href={`/account/orders/${order.id}`} variant="secondary" className="mt-3 block">
                        Chi tiết
                      </LinkButton>
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
