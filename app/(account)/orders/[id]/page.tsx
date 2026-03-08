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
  pending: { label: "Chờ thanh toán", className: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã thanh toán", className: "bg-blue-100 text-blue-800" },
  shipping: { label: "Đang giao", className: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Đã giao", className: "bg-emerald-100 text-emerald-800" },
  completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
};

const WAREHOUSE_STATUS_LABEL: Record<string, string> = {
  awaiting_intake: "Chờ nhập kho",
  in_storage: "Đang lưu kho",
  processing: "Đang sơ chế",
  ready_to_ship: "Sẵn sàng xuất kho",
  shipped: "Đã xuất kho",
};

function getWarehouseStatusLabel(status?: string) {
  if (!status) return "—";
  return WAREHOUSE_STATUS_LABEL[status] || status;
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
  const effectiveStatus: Order["status"] =
    isPaymentSuccess && order?.status === "pending" ? "confirmed" : (order?.status ?? "pending");
  const effectivePaymentMethod = order?.paymentMethod ?? (isPaymentSuccess ? "vnpay" : undefined);
  const effectivePaymentStatus = order?.paymentStatus ?? (isPaymentSuccess ? "success" : undefined);
  const effectiveTransactionRef = order?.transactionRef || queryTxnRef || undefined;
  const itemSubTotal =
    order?.subTotal ??
    order?.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
    0;
  const warehouseService = order?.warehouseService;
  const storageFee = warehouseService?.storageFee ?? 0;
  const processingFee = warehouseService?.processingFee ?? 0;
  const shippingFee = warehouseService?.shippingFee ?? 0;
  const warehouseFeeTotal = warehouseService?.serviceFeeTotal ?? (storageFee + processingFee + shippingFee);
  const payableTotal =
    order?.grandTotal ??
    (order ? itemSubTotal + (order.platformFee ?? 0) + warehouseFeeTotal : 0);
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
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phí nền tảng</span>
                    <span className="text-stone-900">{(order.platformFee ?? 0).toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phí lưu kho</span>
                    <span className="text-stone-900">{storageFee.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phí sơ chế</span>
                    <span className="text-stone-900">{processingFee.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phí vận chuyển kho</span>
                    <span className="text-stone-900">{shippingFee.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                  <div className="border-t border-stone-200 pt-2">
                    <div className="flex justify-between text-base font-semibold">
                      <span className="text-stone-900">Tổng đã thanh toán</span>
                      <span className="text-emerald-600">{payableTotal.toLocaleString("vi-VN")} VNĐ</span>
                    </div>
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

          {/* Amount Summary */}
          <Card>
            <CardBody>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Tiền hàng:</span>
                  <span className="text-stone-900">{itemSubTotal.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Phí nền tảng:</span>
                  <span className="text-stone-900">{(order.platformFee ?? 0).toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Phí lưu kho:</span>
                  <span className="text-stone-900">{storageFee.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Phí sơ chế:</span>
                  <span className="text-stone-900">{processingFee.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Phí vận chuyển kho:</span>
                  <span className="text-stone-900">{shippingFee.toLocaleString("vi-VN")} VNĐ</span>
                </div>
                <div className="border-t border-stone-200 pt-3">
                  <div className="flex justify-between text-base font-semibold">
                    <span>Tổng thanh toán:</span>
                    <span className="text-emerald-600">{payableTotal.toLocaleString("vi-VN")} VNĐ</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {warehouseService && (
            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-stone-900">Kho lưu giữ và sơ chế</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phương án sơ chế:</span>
                    <span className="font-medium text-stone-900">
                      {warehouseService.processingMode === "warehouse"
                        ? "Kho Farm2Art sơ chế"
                        : "Người bán tự sơ chế"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Số ngày lưu kho:</span>
                    <span className="font-medium text-stone-900">{warehouseService.storageDays} ngày</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Trạng thái kho:</span>
                    <span className="font-medium text-stone-900">
                      {getWarehouseStatusLabel(warehouseService.warehouseStatus)}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {(effectivePaymentMethod || effectivePaymentStatus || effectiveTransactionRef) && (
            <Card>
              <CardBody>
                <p className="text-sm font-semibold text-stone-900">Thanh toán</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Phương thức:</span>
                    <span className="font-medium text-stone-900">{effectivePaymentMethod === "vnpay" ? "VNPay" : effectivePaymentMethod === "transfer" ? "Chuyển khoản" : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Trạng thái thanh toán:</span>
                    <span className="font-medium text-stone-900">{effectivePaymentStatus === "success" ? "Thành công" : effectivePaymentStatus === "failed" ? "Thất bại" : "—"}</span>
                  </div>
                  {effectiveTransactionRef && (
                    <div className="flex justify-between">
                      <span className="text-stone-600">Mã giao dịch:</span>
                      <span className="font-medium text-stone-900">{effectiveTransactionRef}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          {/* Payment Section */}
          {effectiveStatus === "pending" && !isPaymentSuccess && !effectivePaymentMethod && (
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
            <LinkButton href="/orders" variant="secondary">
              Quay lại danh sách đơn hàng
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
