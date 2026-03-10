"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { SellerInvoice } from "@/types/invoice";

export default function SellerInvoicesPage() {
  const { user, loading } = useAuthUser();
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contractAcceptedAt, setContractAcceptedAt] = useState<number | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [savingInvoiceId, setSavingInvoiceId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const totalGross = invoices.reduce((s, i) => s + (i.grossRevenue || 0), 0);
    const totalDeduction = invoices.reduce((s, i) => s + (i.totalDeductions || 0), 0);
    const totalNet = invoices.reduce((s, i) => s + (i.netPayout || 0), 0);
    return { totalGross, totalDeduction, totalNet };
  }, [invoices]);

  useEffect(() => {
    if (!user?.uid) return;

    async function loadAll() {
      setLoadingData(true);
      setError(null);
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

        const acceptedAt = userSnap.exists() ? (userSnap.data() as { sellerContractAcceptedAt?: number }).sellerContractAcceptedAt : undefined;
        setContractAcceptedAt(acceptedAt || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
      } finally {
        setLoadingData(false);
      }
    }

    void loadAll();
  }, [user?.uid]);

  async function acceptContract() {
    if (!user?.uid) return;
    setAccepting(true);
    try {
      const now = Date.now();
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi cập nhật hóa đơn");
    } finally {
      setSavingInvoiceId(null);
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
        subtitle="Quản lý điều khoản hợp tác và các hóa đơn phí kho, sơ chế, vận chuyển cho từng đơn hàng"
      />

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-stone-900">Điều khoản dịch vụ người bán</p>
              <p className="mt-1 text-sm text-stone-600">
                Seller xác nhận Farm2Art được thu phí dịch vụ gồm: phí đi lấy hàng, phí sơ chế (nếu chọn), phí lưu kho và phí vận chuyển theo từng đơn thực tế.
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
    </div>
  );
}
