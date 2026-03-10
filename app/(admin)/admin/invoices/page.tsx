"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import type { SellerInvoice } from "@/types/invoice";

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/invoices/generate?all=true", { method: "GET" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || "Không thể tải hóa đơn");
        }
        const data = (await res.json()) as { invoices?: SellerInvoice[] };
        setInvoices(data.invoices || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải hóa đơn");
      } finally {
        setLoading(false);
      }
    }

    void loadInvoices();
  }, []);

  async function updateInvoiceStatus(id: string, status: SellerInvoice["status"]) {
    try {
      setSavingId(id);
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Không thể cập nhật trạng thái");
      }
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi cập nhật hóa đơn");
    } finally {
      setSavingId(null);
    }
  }

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
  const fmtDateTime = (ts?: number) =>
    ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hóa đơn dịch vụ seller"
        subtitle="Theo dõi hóa đơn phí kho, sơ chế, vận chuyển và hoa hồng đã phát hành"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardBody>
          {loading ? (
            <p className="text-sm text-stone-500">Đang tải...</p>
          ) : invoices.length === 0 ? (
            <p className="text-sm text-stone-500">Chưa có hóa đơn.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-stone-500">
                    <th className="px-3 py-2">Mã hóa đơn</th>
                    <th className="px-3 py-2">Seller</th>
                    <th className="px-3 py-2">Doanh thu</th>
                    <th className="px-3 py-2">Khoản trừ</th>
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
                      <td className="px-3 py-2 text-stone-700">{inv.sellerName || inv.sellerId}</td>
                      <td className="px-3 py-2">{fmtCurrency(inv.grossRevenue)}</td>
                      <td className="px-3 py-2 text-red-600">{fmtCurrency(inv.totalDeductions)}</td>
                      <td className="px-3 py-2 text-emerald-700 font-semibold">{fmtCurrency(inv.netPayout)}</td>
                      <td className="px-3 py-2"><span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-700">{inv.status}</span></td>
                      <td className="px-3 py-2 text-stone-500">{fmtDateTime(inv.createdAt)}</td>
                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700 hover:bg-slate-200"
                          >
                            PDF
                          </a>
                          <button
                            onClick={() => updateInvoiceStatus(inv.id, "sent")}
                            disabled={savingId === inv.id || inv.status === "sent" || inv.status === "paid"}
                            className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 disabled:opacity-50"
                          >
                            Đã gửi
                          </button>
                          <button
                            onClick={() => updateInvoiceStatus(inv.id, "paid")}
                            disabled={savingId === inv.id || inv.status === "paid"}
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
    </div>
  );
}
