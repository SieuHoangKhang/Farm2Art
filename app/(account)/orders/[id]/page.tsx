"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
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

const ORDER_PROGRESS_STEPS = [
  { key: "pending", label: "Đặt hàng", icon: "📝" },
  { key: "deposited", label: "Đã cọc 50%", icon: "💳" },
  { key: "shipping", label: "Admin xác nhận và giao hàng", icon: "🚚" },
  { key: "fully_paid", label: "Thanh toán 50% còn lại", icon: "💰" },
  { key: "completed", label: "Khách xác nhận nhận hàng", icon: "✅" },
] as const;

type OrderProgressKey = (typeof ORDER_PROGRESS_STEPS)[number]["key"];


function getCurrentStepIndex(order: Order): number {
  if (order.status === "cancelled") return -1;
  if (order.status === "completed") return 4;
  if (order.status === "delivered") return 3;

  const indexMap: Record<Order["status"], number> = {
    pending: 0,
    deposited: 1,
    confirmed: 1,
    shipping: 2,
    delivered: 3,
    completed: 4,
    cancelled: -1,
  };
  return indexMap[order.status] ?? 0;
}

function getStepTimestamp(order: Order, stepKey: OrderProgressKey): number | undefined {
  if (stepKey === "deposited") return order.depositPaidAt;
  if (stepKey === "shipping") return order.shippedAt;
  if (stepKey === "fully_paid") return order.remainingPaymentReceivedAt;
  if (stepKey === "completed") return order.completedAt;
  return undefined;
}

export default function OrderDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const orderId = params.id as string;
  const { user, loading: userLoading } = useAuthUser();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [remainingSubmitting, setRemainingSubmitting] = useState(false);

  async function handleConfirmDelivery() {
    if (!order || !user) return;
    const nextStatus: Order["status"] = order.status === "shipping" ? "delivered" : "completed";

    if (nextStatus === "completed" && remainingAmount > 0 && order.remainingPaymentStatus !== "received") {
      setError("Vui lòng gửi và chờ admin xác nhận 50% còn lại trước khi hoàn tất đơn.");
      return;
    }

    setConfirmingDelivery(true);
    try {
      const response = await fetch("/api/orders/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          status: nextStatus,
          buyerId: user.uid,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Lỗi khi xác nhận");
      }

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: nextStatus,
              deliveredAt: nextStatus === "delivered" ? Date.now() : prev.deliveredAt,
              completedAt: nextStatus === "completed" ? Date.now() : prev.completedAt,
            }
          : null
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi xác nhận");
    } finally {
      setConfirmingDelivery(false);
    }
  }

  async function handleSubmitRemainingPayment() {
    if (!order || !user) return;
    setRemainingSubmitting(true);
    try {
      const response = await fetch("/api/payments/vnpay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          phase: "remaining",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "Không thể tạo thanh toán VNPay");

      const paymentUrl = data?.paymentUrl as string | undefined;
      if (!paymentUrl) throw new Error("Không nhận được link thanh toán");

      window.location.href = paymentUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi thanh toán 50% còn lại");
    } finally {
      setRemainingSubmitting(false);
    }
  }

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

  const paymentResult = searchParams.get("payment");
  const queryTxnRef = searchParams.get("txnRef");
  const isPaymentSuccess = paymentResult === "success" || order?.paymentStatus === "success";
  const effectiveStatus: Order["status"] = order?.status ?? "pending";
  const effectivePaymentMethod = order?.paymentMethod ?? (isPaymentSuccess ? "vnpay" : undefined);
  const effectivePaymentStatus = order?.paymentStatus ?? (isPaymentSuccess ? "success" : undefined);
  const effectiveTransactionRef = order?.transactionRef || queryTxnRef || undefined;
  const itemSubTotal =
    order?.subTotal ??
    order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
    0;
  // Người mua chỉ trả tiền hàng; các phí (nền tảng, lưu kho, sơ chế, vận chuyển) thuộc người bán.
  const payableTotal = itemSubTotal;
  const depositAmount = Math.round(itemSubTotal * 0.5);
  const remainingAmount = Math.max(itemSubTotal - depositAmount, 0);
  const invoiceDate = new Date(order?.paidAt ?? order?.createdAt ?? Date.now());
  const invoiceCode = `INV-${orderId.slice(0, 8).toUpperCase()}-${invoiceDate.getFullYear()}`;
  const paymentProviderLabel = effectivePaymentMethod === "vnpay" ? "VNPay" : "cổng thanh toán";

  if (userLoading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-stone-600">Vui lòng đăng nhập.</p>
            <LinkButton href="/login" className="mt-4">
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
            <LinkButton href="/orders" className="mt-4">
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
          {isPaymentSuccess && order && (
            <Card>
              <CardBody>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-700">Hóa đơn thanh toán</p>
                    <p className="mt-1 text-xs text-stone-500">Thanh toán thành công qua {paymentProviderLabel}</p>
                  </div>
                  <Button
                    onClick={() => window.print()}
                    className="bg-stone-100 text-stone-800 hover:bg-stone-200"
                  >
                    In hóa đơn
                  </Button>
                </div>

                <div className="mt-4 grid gap-3 rounded-lg border border-sage-200 bg-sage-50 p-4 text-sm sm:grid-cols-2">
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Mã hóa đơn</span>
                    <p className="font-semibold text-stone-900">{invoiceCode}</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Mã đơn hàng</span>
                    <p className="font-semibold text-stone-900">{orderId}</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Ngày thanh toán</span>
                    <p className="font-semibold text-stone-900">
                      {invoiceDate.toLocaleString("vi-VN", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Mã giao dịch</span>
                    <p className="font-semibold text-stone-900">{effectiveTransactionRef || "—"}</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Người mua</span>
                    <p className="font-semibold text-stone-900">{user?.email || user?.uid || "—"}</p>
                  </div>
                  <div className="flex justify-between sm:block">
                    <span className="text-stone-500">Người bán</span>
                    <p className="font-semibold text-stone-900">{order.sellerName || order.sellerId || "—"}</p>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-stone-700">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold">Sản phẩm</th>
                        <th className="px-4 py-2 text-center font-semibold">SL</th>
                        <th className="px-4 py-2 text-right font-semibold">Đơn giá</th>
                        <th className="px-4 py-2 text-right font-semibold">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, idx) => (
                        <tr key={`${item.id}-${idx}`} className="border-t border-stone-100">
                          <td className="px-4 py-2 text-stone-900">{item.name}</td>
                          <td className="px-4 py-2 text-center text-stone-700">{item.quantity}</td>
                          <td className="px-4 py-2 text-right text-stone-700">{item.price.toLocaleString("vi-VN")} VNĐ</td>
                          <td className="px-4 py-2 text-right font-medium text-stone-900">
                            {(item.price * item.quantity).toLocaleString("vi-VN")} VNĐ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-2 rounded-lg border border-stone-200 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Tiền hàng</span>
                    <span className="text-stone-900">{itemSubTotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="border-t border-stone-200 pt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-stone-900">Số tiền cọc đã thanh toán</span>
                      <span className="text-emerald-600">{depositAmount.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Progress Timeline */}
          {order.status !== "cancelled" && (
            <Card>
              <CardBody>
                <p className="mb-4 text-sm font-semibold text-stone-900">Tiến trình đơn hàng</p>
                <div className="relative">
                  <div className="absolute left-4 top-0 h-full w-0.5 bg-stone-200" />
                  <div className="space-y-6">
                    {ORDER_PROGRESS_STEPS.map((step, index) => {
                      const currentIndex = getCurrentStepIndex(order);
                      const isCompleted = index < currentIndex;
                      const isCurrent = index === currentIndex;
                      const isPending = index > currentIndex;
                      const stepLabel =
                        step.key === "fully_paid" && order.remainingPaymentStatus === "received"
                          ? "Đã thanh toán đầy đủ"
                          : step.label;
                      const stepTimestamp = getStepTimestamp(order, step.key);

                      return (
                        <div key={step.key} className="relative flex items-start gap-4 pl-2">
                          <div
                            className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${
                              isCompleted
                                ? "bg-emerald-600 text-white"
                                : isCurrent
                                ? "bg-amber-500 text-white"
                                : "bg-stone-200 text-stone-500"
                            }`}
                          >
                            {isCompleted ? "✓" : isCurrent ? "●" : index + 1}
                          </div>
                          <div className="flex-1 pt-1">
                            <p
                              className={`text-sm font-medium ${
                                isPending ? "text-stone-400" : "text-stone-900"
                              }`}
                            >
                              {stepLabel}
                            </p>
                            {isCurrent && (
                              <p className="mt-1 text-xs text-amber-600">
                                {step.key === "fully_paid" && order.remainingPaymentStatus === "received"
                                  ? "Đã thanh toán đủ 100% qua VNPay"
                                  : "Đang ở bước này"}
                              </p>
                            )}
                            {(isCompleted || (isCurrent && !!stepTimestamp)) && stepTimestamp && (
                              <p className="mt-1 text-xs text-stone-500">
                                {new Date(stepTimestamp).toLocaleDateString("vi-VN", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Status Section */}
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-600">Trạng thái đơn hàng</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">
                    {STATUS_UI[effectiveStatus].label}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_UI[effectiveStatus].className}`}
                >
                  {STATUS_UI[effectiveStatus].label}
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

          {/* Amount Summary - Người mua chỉ trả tiền hàng */}
          <Card>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Tiền hàng:</span>
                  <span className="text-stone-900">{itemSubTotal.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Đã cọc 50%:</span>
                    <span className="text-stone-900">{depositAmount.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Còn lại 50%:</span>
                    <span className="text-stone-900">{remainingAmount.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng giá trị đơn:</span>
                    <span className="text-emerald-600">{payableTotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Payment Section */}
          {effectiveStatus === "pending" && !order.depositPaidAt && (
            <Card>
              <CardBody>
                <p className="mb-4 text-sm font-semibold text-stone-900">Thanh toán cọc 50%</p>
                <p className="mb-4 text-sm text-stone-600">
                  Bạn thanh toán trước 50% để admin xác nhận giao hàng. 50% còn lại thanh toán sau khi nhận hàng.
                </p>
                <Button
                  onClick={handlePayment}
                  disabled={paymentLoading}
                  className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                >
                  {paymentLoading ? "Đang xử lý..." : `Thanh toán cọc ${depositAmount.toLocaleString("vi-VN")} VNĐ qua VNPay`}
                </Button>
              </CardBody>
            </Card>
          )}

          {order.status === "delivered" && order.remainingPaymentStatus !== "received" && (
            <Card>
              <CardBody>
                <p className="font-semibold text-stone-900">Thanh toán 50% còn lại</p>
                <p className="mt-1 text-sm text-stone-600">
                  Sau khi nhận hàng, thanh toán nốt qua VNPay để có thể hoàn tất đơn ngay.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={handleSubmitRemainingPayment}
                    disabled={remainingSubmitting}
                    className="w-full bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                  >
                    {remainingSubmitting
                        ? "Đang gửi..."
                        : `Thanh toán VNPay ${remainingAmount.toLocaleString("vi-VN")} VNĐ`}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Confirm Delivery Button - Buyer xác nhận nhận hàng để hoàn tất */}
          {(order.status === "shipping" || order.status === "delivered") && (
            <Card>
              <CardBody>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-stone-900">Xác nhận đã nhận hàng</p>
                    <p className="mt-1 text-sm text-stone-600">
                      {order.status === "shipping"
                        ? "Khi hàng đã tới tay bạn, bấm xác nhận để chuyển sang trạng thái đã giao."
                        : order.remainingPaymentStatus === "received"
                          ? "Bạn đã thanh toán đủ 100%, bấm để kết thúc đơn hàng."
                          : "Vui lòng thanh toán 50% còn lại qua VNPay trước khi hoàn tất đơn."}
                    </p>
                  </div>
                  <Button
                    onClick={handleConfirmDelivery}
                    disabled={confirmingDelivery || (order.status === "delivered" && order.remainingPaymentStatus !== "received")}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                  >
                    {confirmingDelivery
                      ? "Đang xử lý..."
                      : order.status === "shipping"
                        ? "Xác nhận đã giao"
                        : "Hoàn tất đơn"}
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Return to list */}
          <div className="text-center">
            <LinkButton href="/orders" variant="secondary">
              Quay lại danh sách đơn hàng
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
