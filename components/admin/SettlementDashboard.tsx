"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Settlement } from "@/types/marketplace";

export default function SettlementDashboard() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Settlement["status"]>("ALL");

  useEffect(() => {
    load();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  async function load() {
    try {
      setLoading(true);
      const snap = await getDocs(
        query(collection(firebaseDb, MP_COLLECTIONS.settlements), orderBy("createdAt", "desc"))
      );
      setSettlements(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Settlement)));
    } catch (e) {
      console.error(e);
      showToast("Lỗi tải danh sách đối soát.");
    } finally {
      setLoading(false);
    }
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);
  const fmtDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const filtered = useMemo(() => {
    return settlements.filter((s) => {
      const matchSearch =
        search.trim() === "" ||
        s.id.toLowerCase().includes(search.toLowerCase()) ||
        s.orderId.toLowerCase().includes(search.toLowerCase()) ||
        s.sellerId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [settlements, search, statusFilter]);

  async function markPaid(settlementId: string) {
    if (!confirm("Bạn chắc chắn đã chuyển khoản cho người bán?")) return;
    try {
      setSavingId(settlementId);
      const res = await fetch(`/api/settlements/${settlementId}/pay`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không thể xác nhận thanh toán.");
      showToast(data?.message || "Xác nhận thanh toán thành công.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi xác nhận thanh toán.";
      showToast(msg);
    } finally {
      setSavingId(null);
    }
  }

  const totalUnpaid = settlements
    .filter((s) => s.status === "UNPAID")
    .reduce((sum, s) => sum + (s.sellerReceives || 0), 0);

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl text-sm shadow-xl">
          {toast}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-700 to-indigo-900 p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-200/80">Admin Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">Đối soát doanh thu</h1>
        <p className="text-indigo-100/80 text-sm mt-2">
          Tổng cần chuyển (chưa thanh toán): <span className="font-extrabold text-amber-300">{fmtMoney(totalUnpaid)}</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đối soát, mã đơn, seller ID..."
          className="flex-1 px-4 py-3 rounded-2xl border border-sage-200 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex gap-2 bg-white/90 border border-sage-200 rounded-2xl p-2">
          {(["ALL", "UNPAID", "PAID"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-xl text-xs font-extrabold transition ${
                statusFilter === s ? "bg-indigo-600 text-white" : "text-stone-600 hover:bg-indigo-50"
              }`}
            >
              {s === "ALL" ? "Tất cả" : s === "UNPAID" ? "Chưa thanh toán" : "Đã thanh toán"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Đang tải dữ liệu đối soát...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Không có bản ghi đối soát.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white/90">
          <table className="w-full text-sm">
            <thead className="bg-sage-50 text-stone-600">
              <tr>
                <th className="text-left px-4 py-3 font-extrabold">Seller</th>
                <th className="text-left px-4 py-3 font-extrabold">Mã đơn</th>
                <th className="text-right px-4 py-3 font-extrabold">Tổng tiền</th>
                <th className="text-right px-4 py-3 font-extrabold">Hoa hồng</th>
                <th className="text-right px-4 py-3 font-extrabold">Sơ chế</th>
                <th className="text-right px-4 py-3 font-extrabold">Vận chuyển</th>
                <th className="text-right px-4 py-3 font-extrabold">Cần chuyển</th>
                <th className="text-left px-4 py-3 font-extrabold">Trạng thái</th>
                <th className="text-right px-4 py-3 font-extrabold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-sage-100">
                  <td className="px-4 py-3">
                    <p className="font-extrabold text-stone-800">{s.sellerId}</p>
                    <p className="text-xs text-stone-500 mt-1">Tạo: {fmtDate(s.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-700">#{s.orderId.slice(0, 12)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtMoney(s.orderTotal)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">-{fmtMoney(s.commissionFee)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">-{fmtMoney(s.processingFee)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">-{fmtMoney(s.shippingFee)}</td>
                  <td className="px-4 py-3 text-right font-extrabold text-emerald-700">{fmtMoney(s.sellerReceives)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        s.status === "UNPAID" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {s.status === "UNPAID" ? "Chưa thanh toán" : "Đã thanh toán"}
                    </span>
                    {s.status === "PAID" && (
                      <p className="text-xs text-stone-500 mt-1">Ngày: {fmtDate(s.paidAt)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "UNPAID" ? (
                      <button
                        onClick={() => markPaid(s.id)}
                        disabled={savingId === s.id}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Xác nhận đã thanh toán
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-stone-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

