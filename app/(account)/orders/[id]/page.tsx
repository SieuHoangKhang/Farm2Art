"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Order } from "@/types/order";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const { user, loading: userLoading } = useAuthUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (userLoading || !user) return;

    async function loadOrder() {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(firebaseDb, "orders", orderId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
          setError("Không tìm thấy đơn hàng");
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as Order;
        if (user && data.buyerId !== user.uid) {
          setError("Bạn không có quyền xem đơn hàng này");
          return;
        }

        setOrder(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải thông tin đơn hàng");
      } finally {
        setLoading(false);
      }
    }

    void loadOrder();
  }, [user, userLoading, orderId]);

  async function handlePayment() {
    if (!order) return;
    setPaymentLoading(true);
    try {
      const response = await fetch("/api/payments/vnpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Lỗi khi tạo yêu cầu thanh toán");
      }

      const { paymentUrl } = await response.json();
      window.location.href = paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi xử lý thanh toán");
    } finally {
      setPaymentLoading(false);
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
            <p className="text-stone-600">Vui lòng đăng nhập.</p>
            <LinkButton href="/auth/login" className="mt-4">
              Đăng nhập
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-red-700">{error || "Không tìm thấy đơn hàng"}</p>
            <LinkButton href="/account/orders" className="mt-4">
              Quay lại
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={`Đơn hàng #${orderId.slice(0, 8)}`} subtitle="Chi tiết đơn hàng của bạn" />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

        <div className="space-y-4">
          {/* Status Section */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-600">Trạng thái đơn hàng</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">
                    {order.status === "pending"
                      ? "Chờ xử lý"
                      : order.status === "completed"
                        ? "Hoàn thành"
                        : "Hủy"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${
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
              </div>
            </CardBody>
          </Card>

          {/* Order Info */}
          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-stone-900">Thông tin đơn hàng</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Mã đơn:</span>
                  <span className="font-medium text-stone-900">{orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Ngày đặt:</span>
                  <span className="font-medium text-stone-900">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Người bán:</span>
                  <span className="font-medium text-stone-900">{order.sellerName || order.sellerId}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Items */}
          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-stone-900">Sản phẩm</p>
              <div className="mt-4 space-y-3 border-t border-stone-200 pt-4">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <p className="text-stone-900">{item.name}</p>
                      <p className="text-xs text-stone-500">Số lượng: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-stone-900">{item.price.toLocaleString("vi-VN")} VNĐ</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Amount Summary */}
          <Card>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Subtotal:</span>
                  <span className="text-stone-900">{order.totalAmount.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng tiền:</span>
                    <span className="text-emerald-600">{order.totalAmount.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payment Section */}
          {order.status === "pending" && !order.paymentMethod && (
            <Card>
              <CardBody>
                <p className="mb-4 text-sm font-semibold text-stone-900">Thanh toán</p>
                <p className="mb-4 text-sm text-stone-600">
                  Chọn phương thức thanh toán để hoàn tất đơn hàng của bạn.
                </p>
                <Button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                >
                  {paymentLoading ? "Đang xử lý..." : "Thanh toán qua VNPay"}
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Return to list */}
          <div className="text-center">
            <LinkButton href="/account/orders" variant="secondary">
              Quay lại danh sách đơn hàng
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
