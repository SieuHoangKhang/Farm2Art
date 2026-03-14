"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Order } from "@/types/order";

const STATUS_UI: Record<Order["status"], { label: string; className: string }> = {
  pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
  deposited: { label: "Đã cọc 50%", className: "bg-cyan-100 text-cyan-800" },
  confirmed: { label: "Đã xác nhận", className: "bg-blue-100 text-blue-800" },
  shipping: { label: "Đang giao", className: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Đã giao", className: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Giao hàng thành công", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
};

export default function OrdersPage() {
  const { user, loading: userLoading } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");

  // Người mua chỉ trả tiền hàng (grandTotal = subTotal).
  const getPayableTotal = (order: Order) =>
    order.grandTotal ?? (order.subTotal ?? order.totalAmount);

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
            <LinkButton href="/login" className="mt-4">
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
          {(["all", "pending", "deposited", "confirmed", "shipping", "delivered", "completed", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${filter === f
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:border-stone-300"
                }`}
            >
              {f === "all" ? "Tất cả" : STATUS_UI[f].label}
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
            {orders.map((order) => {
              return (
                <Card key={order.id} className="transition-shadow hover:shadow-md">
                  <CardBody>
                    {/* Header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-stone-900">Đơn #{order.id.slice(0, 8)}</p>
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_UI[order.status].className}`}
                          >
                            {STATUS_UI[order.status].label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-500">
                          {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-emerald-600">
                          {getPayableTotal(order).toLocaleString("vi-VN")} VNĐ
                        </p>
                        {order.paymentStatus === "success" && (
                          <p className="mt-1 text-xs text-emerald-600">✓ Đã thanh toán</p>
                        )}
                        {order.paymentStatus === "pending" && (
                          <p className="mt-1 text-xs text-amber-600">⏳ Chờ thanh toán</p>
                        )}
                      </div>
                    </div>

                    {/* Order Details */}
                    <div className="mt-4 grid gap-3 border-t border-stone-100 pt-3 sm:grid-cols-2">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-medium text-stone-500 uppercase">Sản phẩm</p>
                        <div className="mt-1 space-y-1">
                          {order.items?.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-sm text-stone-700">
                              • {item.name} x{item.quantity}
                            </p>
                          ))}
                          {order.items && order.items.length > 2 && (
                            <p className="text-xs text-stone-500">+{order.items.length - 2} sản phẩm khác</p>
                          )}
                        </div>
                      </div>

                      {/* Seller */}
                      <div className="space-y-2">
                        {order.sellerName && (
                          <div>
                            <p className="text-xs font-medium text-stone-500 uppercase">Người bán</p>
                            <p className="text-sm text-stone-700">{order.sellerName}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="mt-4 border-t border-stone-100 pt-3">
                      <LinkButton href={`/orders/${order.id}`} variant="secondary" className="w-full sm:w-auto">
                        Xem chi tiết
                      </LinkButton>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
