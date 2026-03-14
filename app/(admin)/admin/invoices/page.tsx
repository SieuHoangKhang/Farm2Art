"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import type { SellerInvoice } from "@/types/invoice";
import type { Order } from "@/types/order";

type PendingPayoutOrder = Order & {
  eligibilityInfo?: {
    isEligible: boolean;
    daysRemaining: number;
    escrowStatus?: string;
  };
};

type PayoutDraft = {
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  serviceFee: number;
  totalDeductions: number;
  netPayout: number;
};

function getPayoutDraft(order: PendingPayoutOrder): PayoutDraft {
  const grossRevenue = order.subTotal ?? order.grandTotal ?? order.totalAmount ?? 0;
  const commissionRate = Math.max(order.commissionRate ?? 0.2, 0);
  const commissionAmount = Math.round(grossRevenue * commissionRate);
  const serviceFee = Math.max(order.warehouseService?.serviceFeeTotal ?? 0, 0);
  const totalDeductions = commissionAmount + serviceFee;
  const netPayout = Math.max(grossRevenue - totalDeductions, 0);

  return { grossRevenue, commissionRate, commissionAmount, serviceFee, totalDeductions, netPayout };
}

export default function AdminInvoicesPage() {
  const searchParams = useSearchParams();
  const targetOrderId = searchParams.get("orderId") || "";
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingPayoutOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number>(Date.now());

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [invoicesRes, pendingRes] = await Promise.all([
        fetch("/api/invoices/generate?all=true", { method: "GET" }),
        fetch("/api/admin/payouts?status=pending&includeDueInfo=true", { method: "GET" }),
      ]);

      if (!invoicesRes.ok) {
        throw new Error("Khong the tai danh sach hoa don");
      }

      const invoicesData = (await invoicesRes.json()) as { invoices?: SellerInvoice[] };
      setInvoices(invoicesData.invoices || []);

      if (pendingRes.ok) {
        const pendingData = (await pendingRes.json()) as { orders?: PendingPayoutOrder[] };
        setPendingOrders(pendingData.orders || []);
      } else {
        setPendingOrders([]);
      }
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loi tai du lieu");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();

    const timer = setInterval(() => {
      void loadData();
    }, 15000);

    return () => clearInterval(timer);
  }, []);

  async function runAutoPayout(order: PendingPayoutOrder) {
    try {
      setProcessingOrderId(order.id);
      setError(null);
      setSuccess(null);

      const res = await fetch("/api/invoices/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          sellerId: order.sellerId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || data?.error || "Khong the chi tra tu dong");
      }

      await loadData();
      setSuccess(
        `Da chi tra thanh cong cho don #${order.id.slice(0, 8)}. Hoa don ${data?.invoice?.invoiceNumber || "da duoc tao"}.`
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loi chi tra tu dong");
    } finally {
      setProcessingOrderId(null);
    }
  }

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
  const fmtDateTime = (ts?: number) =>
    ts
      ? new Date(ts).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "-";

  const eligibleOrders = useMemo(
    () => pendingOrders.filter((o) => o.eligibilityInfo?.isEligible),
    [pendingOrders]
  );

  const highlightedOrder = useMemo(() => {
    if (!targetOrderId) return null;
    return pendingOrders.find((o) => o.id === targetOrderId) || null;
  }, [pendingOrders, targetOrderId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hoa don va chi tra seller"
        subtitle="Quan ly hoa don dich vu va xu ly chi tra cho nguoi ban"
      />

      {targetOrderId ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {highlightedOrder
            ? `Da mo tu don hang #${targetOrderId.slice(0, 8)}. Vui long thuc hien chi tra tai bang ben duoi.`
            : `Don #${targetOrderId.slice(0, 8)} khong nam trong danh sach cho chi tra (co the da duoc xu ly).`}
        </div>
      ) : null}

      <p className="text-xs text-stone-500">Cap nhat luc: {new Date(lastUpdatedAt).toLocaleTimeString("vi-VN")}</p>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardBody>
            <p className="text-sm text-stone-500">Don cho chi tra</p>
            <p className="mt-2 text-2xl font-bold text-stone-900">{pendingOrders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-stone-500">Don du dieu kien ngay</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{eligibleOrders.length}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-sm text-stone-500">Tong hoa don da tao</p>
            <p className="mt-2 text-2xl font-bold text-indigo-700">{invoices.length}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold text-stone-900">Danh sach don cho chi tra tu dong</p>
            <button
              onClick={() => void loadData()}
              className="rounded-lg border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              Tai lai
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-stone-500">Dang tai...</p>
          ) : pendingOrders.length === 0 ? (
            <p className="text-sm text-stone-500">Khong co don nao cho chi tra.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="px-3 py-2">Don hang</th>
                    <th className="px-3 py-2">Seller</th>
                    <th className="px-3 py-2">Doanh thu</th>
                    <th className="px-3 py-2">Khoan tru</th>
                    <th className="px-3 py-2">Thuc nhan</th>
                    <th className="px-3 py-2">Dieu kien</th>
                    <th className="px-3 py-2">Tac vu</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map((o) => {
                    const draft = getPayoutDraft(o);
                    const eligible = !!o.eligibilityInfo?.isEligible;
                    const daysRemaining = o.eligibilityInfo?.daysRemaining ?? 0;
                    const isTarget = targetOrderId && o.id === targetOrderId;
                    return (
                      <tr key={o.id} className={`border-b border-stone-100 ${isTarget ? "bg-emerald-50/60" : ""}`}>
                        <td className="px-3 py-2 font-medium text-stone-800">
                          #{o.id.slice(0, 8)}
                          {isTarget ? (
                            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Tu Don Hang</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-stone-700">{o.sellerName || o.sellerId}</td>
                        <td className="px-3 py-2">{fmtCurrency(draft.grossRevenue)}</td>
                        <td className="px-3 py-2 text-red-600">{fmtCurrency(draft.totalDeductions)}</td>
                        <td className="px-3 py-2 font-semibold text-emerald-700">{fmtCurrency(draft.netPayout)}</td>
                        <td className="px-3 py-2">
                          {eligible ? (
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs text-emerald-700">San sang</span>
                          ) : (
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs text-amber-700">
                              Cho {daysRemaining} ngay / escrow: {o.eligibilityInfo?.escrowStatus || "-"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => void runAutoPayout(o)}
                            disabled={!eligible || processingOrderId === o.id}
                            className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {processingOrderId === o.id ? "Dang xu ly..." : "Chi tra + tao hoa don"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <p className="mb-4 text-sm font-semibold text-stone-900">Lich su hoa don seller</p>
          {loading ? (
            <p className="text-sm text-stone-500">Dang tai...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-stone-500">Chua co hoa don.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="px-3 py-2">Ma hoa don</th>
                    <th className="px-3 py-2">Seller</th>
                    <th className="px-3 py-2">Doanh thu</th>
                    <th className="px-3 py-2">Khoan tru</th>
                    <th className="px-3 py-2">Thuc nhan</th>
                    <th className="px-3 py-2">Tai khoan nhan</th>
                    <th className="px-3 py-2">Ngay tao</th>
                    <th className="px-3 py-2">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100">
                      <td className="px-3 py-2 font-medium text-stone-800">{inv.invoiceNumber}</td>
                      <td className="px-3 py-2 text-stone-700">{inv.sellerName || inv.sellerId}</td>
                      <td className="px-3 py-2">{fmtCurrency(inv.grossRevenue)}</td>
                      <td className="px-3 py-2 text-red-600">{fmtCurrency(inv.totalDeductions)}</td>
                      <td className="px-3 py-2 font-semibold text-emerald-700">{fmtCurrency(inv.netPayout)}</td>
                      <td className="px-3 py-2 text-xs text-stone-600">
                        {inv.payoutDestination
                          ? `${inv.payoutDestination.bankName} - ${inv.payoutDestination.accountNumber}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-stone-500">{fmtDateTime(inv.createdAt)}</td>
                      <td className="px-3 py-2">
                        <a
                          href={`/api/invoices/${inv.id}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                        >
                          PDF
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
