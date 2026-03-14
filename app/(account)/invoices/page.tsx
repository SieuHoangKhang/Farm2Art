"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { SellerInvoice, InvoiceLineItem } from "@/types/invoice";

const FEE_TYPE_LABELS: Record<InvoiceLineItem["type"], string> = {
  pickup_fee: "Phí đi lấy hàng",
  processing_fee: "Phí dịch vụ",
  storage_fee: "Phí lưu kho",
  commission: "Hoa hồng platform",
  adjustment: "Điều chỉnh",
};

export default function SellerInvoicesPage() {
  const { user, loading } = useAuthUser();
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAcceptedAt, setContractAcceptedAt] = useState<number | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);
  const [detailInvoice, setDetailInvoice] = useState<SellerInvoice | null>(null);
  const [paymentLoadingId, setPaymentLoadingId] = useState<string | null>(null);

  const getAmountDue = (inv: SellerInvoice) =>
    Math.max((inv.totalDeductions ?? 0) - (inv.adjustmentsTotal ?? 0), 0);

  const totals = useMemo(() => {
    const totalGross = invoices.reduce((s, i) => s + (i.grossRevenue || 0), 0);
    const totalDeduction = invoices.reduce((s, i) => s + (i.totalDeductions || 0), 0);
    const totalNet = invoices.reduce((s, i) => s + (i.netPayout || 0), 0);
    return { totalGross, totalDeduction, totalNet };
  }, [invoices]);

  // Hiển thị kết quả thanh toán VNPay (khi redirect về từ /invoices?payment=success|failed)
  const paymentResult = searchParams.get("payment");
  useEffect(() => {
    if (paymentResult === "failed") {
      setError("Thanh toán không thành công. Vui lòng thử lại.");
    }
  }, [paymentResult]);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadAll() {
      setLoadingData(true);
      if (paymentResult !== "failed") setError(null);
      try {
        const [invoicesRes, userSnap] = await Promise.all([
          fetch(`/api/invoices/generate?sellerId=${user.uid}`, { method: "GET" }),
          getDoc(doc(firebaseDb, "users", user.uid)),
        ]);

        if (!invoicesRes.ok) {
          const data = await invoicesRes.json().catch(() => ({}));
          throw new Error(data?.error || "Không thể tải hóa đơn");
        }

        const invoicesData = (await invoicesRes.json()) as { invoices?: SellerInvoice[] };
        setInvoices(invoicesData.invoices || []);

        // Trạng thái chấp thuận được lưu vĩnh viễn trong Firestore (users/{uid}.sellerContractAcceptedAt) — người bán chỉ cần chấp thuận một lần
        const acceptedAt = userSnap.exists() ? (userSnap.data() as { sellerContractAcceptedAt?: number }).sellerContractAcceptedAt : undefined;
        setContractAcceptedAt(acceptedAt || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    }

    void loadAll();
  }, [user?.uid, paymentResult]);

  async function acceptContract() {
    if (!user?.uid) return;
    setAccepting(true);
    try {
      const now = Date.now();
      // Lưu vào Firestore (merge: true) để lần sau đăng nhập vẫn hiển thị "Đã chấp thuận", không cần chấp thuận lại
      await setDoc(
        doc(firebaseDb, "users", user.uid),
        {
          sellerContractAcceptedAt: now,
          sellerContractVersion: "v1-service-fees",
        },
        { merge: true }
      );
      setContractAcceptedAt(now);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể cập nhật hợp đồng");
    } finally {
      setAccepting(false);
    }
  }

  async function updateInvoiceStatus(id: string, status: SellerInvoice["status"]) {
    try {
      setSavingInvoiceId(id);
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Không thể cập nhật hóa đơn");
      }

      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
      if (detailInvoice?.id === id) setDetailInvoice((prev) => (prev ? { ...prev, status } : null));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi cập nhật hóa đơn");
    } finally {
      setSavingInvoiceId(null);
    }
  }

  async function payInvoiceViaVnpay(inv: SellerInvoice) {
    if (!user?.uid || inv.status === "paid" || getAmountDue(inv) <= 0) return;
    setPaymentLoadingId(inv.id);
    setError(null);
    try {
      const res = await fetch("/api/payments/vnpay/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id, sellerId: user?.uid }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Không thể tạo giao dịch thanh toán");
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      throw new Error("Không nhận được link thanh toán");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi thanh toán VNPay");
    } finally {
      setPaymentLoadingId(null);
    }
  }

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
  const fmtDateTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  if (loading) {
    return <div className="py-8 text-sm text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return <div className="py-8 text-sm text-stone-600">Vui lòng đăng nhập để xem hóa đơn.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hợp đồng & hóa đơn dịch vụ"
        subtitle="Nơi người bán quản lý hợp đồng dịch vụ và theo dõi các khoản tiền admin đã chi trả sau khi đơn hoàn thành"
      />

      {paymentResult === "success" && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Thanh toán qua VNPay đã thành công. Hóa đơn đã được cập nhật trạng thái.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Điều khoản dịch vụ người bán</p>
              <p className="mt-1 text-sm text-stone-600">
                Seller xác nhận Farm2Art được thu phí dịch vụ gồm: phí đi lấy hàng, phí lưu kho và phí vận chuyển theo từng đơn thực tế.
              </p>
              <p className="mt-2 text-xs text-stone-500">
                Trạng thái: {contractAcceptedAt ? `Đã chấp thuận lúc ${fmtDateTime(contractAcceptedAt)}` : "Chưa chấp thuận"}
              </p>
            </div>
            <Button onClick={acceptContract} disabled={accepting || !!contractAcceptedAt}>
              {contractAcceptedAt ? "Đã chấp thuận" : accepting ? "Đang xử lý..." : "Chấp thuận hợp đồng"}
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card><CardBody><p className="text-xs text-stone-500">Tổng doanh thu</p><p className="mt-2 text-xl font-bold text-stone-900">{fmtCurrency(totals.totalGross)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-stone-500">Tổng khoản trừ</p><p className="mt-2 text-xl font-bold text-red-600">{fmtCurrency(totals.totalDeduction)}</p></CardBody></Card>
        <Card><CardBody><p className="text-xs text-stone-500">Thực nhận</p><p className="mt-2 text-xl font-bold text-emerald-700">{fmtCurrency(totals.totalNet)}</p></CardBody></Card>
      </div>

      <Card>
        <CardBody>
          <p className="text-sm font-semibold text-stone-900">Danh sách hóa đơn</p>

          {loadingData ? (
            <p className="mt-4 text-sm text-stone-500">Đang tải hóa đơn...</p>
          ) : invoices.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">Chưa có hóa đơn nào được phát hành.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="px-3 py-2">Mã hóa đơn</th>
                    <th className="px-3 py-2">Tổng phí trừ</th>
                    <th className="px-3 py-2">Thực nhận</th>
                    <th className="px-3 py-2">Trạng thái</th>
                    <th className="px-3 py-2">Ngày tạo</th>
                    <th className="px-3 py-2">Tác vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100">
                      <td className="px-3 py-2 font-medium text-stone-800">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2 text-red-600">{fmtCurrency(inv.totalDeductions)}</td>
                      <td className="px-3 py-2 text-emerald-700 font-semibold">{fmtCurrency(inv.netPayout)}</td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{inv.status}</span>
                      </td>
                      <td className="px-3 py-2 text-stone-500">{fmtDateTime(inv.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailInvoice(inv)}
                            className="rounded bg-stone-100 px-2 py-1 text-xs text-stone-700 hover:bg-stone-200"
                          >
                            Xem chi tiết
                          </button>
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                            onClick={() => {
                              if (inv.status === "generated" || inv.status === "sent") {
                                void updateInvoiceStatus(inv.id, "viewed");
                              }
                            }}
                          >
                            Tải/In PDF
                          </a>
                          {inv.status !== "paid" && getAmountDue(inv) > 0 && (
                            <button
                              type="button"
                              onClick={() => payInvoiceViaVnpay(inv)}
                              disabled={paymentLoadingId === inv.id}
                              className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                            >
                              {paymentLoadingId === inv.id ? "Đang chuyển..." : `Thanh toán VNPay (${fmtCurrency(getAmountDue(inv))})`}
                            </button>
                          )}
                          <button
                            onClick={() => updateInvoiceStatus(inv.id, "paid")}
                            disabled={savingInvoiceId === inv.id || inv.status === "paid"}
                            className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                          >
                            Xác nhận đã trả phí
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal chi tiết hóa đơn - các loại phí */}
      {detailInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetailInvoice(null)}>
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-stone-800">Chi tiết hóa đơn {detailInvoice.invoiceNumber}</h3>
              <button type="button" onClick={() => setDetailInvoice(null)} className="text-stone-400 hover:text-stone-600">✕</button>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-stone-500">Ngày tạo: {fmtDateTime(detailInvoice.createdAt)}</p>
              <p className="font-medium text-stone-700">Các khoản phí:</p>
              <ul className="space-y-2 rounded-lg border border-stone-200 p-3">
                {(detailInvoice.lineItems || []).map((item, idx) => (
                  <li key={item.id || idx} className="flex justify-between gap-2 border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                    <span className="text-stone-700">
                      {FEE_TYPE_LABELS[item.type]}: {item.description || ""}
                    </span>
                    <span className="font-medium text-stone-900 shrink-0">{fmtCurrency(item.amount)}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between border-t border-stone-200 pt-2">
                <span className="text-stone-600">Tổng doanh thu</span>
                <span>{fmtCurrency(detailInvoice.grossRevenue)}</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Tổng khoản trừ</span>
                <span>{fmtCurrency(detailInvoice.totalDeductions)}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <span>Thực nhận</span>
                <span>{fmtCurrency(detailInvoice.netPayout)}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`/api/invoices/${detailInvoice.id}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              >
                Tải/In PDF
              </a>
              {detailInvoice.status !== "paid" && getAmountDue(detailInvoice) > 0 && (
                <button
                  type="button"
                  onClick={() => payInvoiceViaVnpay(detailInvoice)}
                  disabled={paymentLoadingId === detailInvoice.id}
                  className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {paymentLoadingId === detailInvoice.id ? "Đang chuyển..." : `Thanh toán qua VNPay (${fmtCurrency(getAmountDue(detailInvoice))})`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
