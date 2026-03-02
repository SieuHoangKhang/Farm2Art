"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy,
} from "firebase/firestore";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: "Chờ xử lý",   color: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700 border-blue-200" },
  shipping:  { label: "Đang giao",   color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  delivered: { label: "Đã giao",     color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  completed: { label: "Hoàn thành",  color: "bg-green-50 text-green-700 border-green-200" },
  cancelled: { label: "Đã hủy",     color: "bg-red-50 text-red-700 border-red-200" },
};

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered", "completed"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const snap = await getDocs(query(collection(firebaseDb, "orders"), orderBy("createdAt", "desc")));
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    } catch (err) {
      console.error("Load orders error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function advanceStatus(order: Order) {
    const idx = STATUS_FLOW.indexOf(order.status);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return;
    const next = STATUS_FLOW[idx + 1];
    const tsField = next === "confirmed" ? "confirmedAt" : next === "shipping" ? "shippedAt" : next === "delivered" ? "deliveredAt" : "completedAt";
    try {
      setSaving(order.id);
      await updateDoc(doc(firebaseDb, "orders", order.id), { status: next, [tsField]: Date.now() });
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: next, [tsField]: Date.now() } : o));
      showToast(`Cập nhật → ${STATUS_MAP[next].label}`);
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật trạng thái");
    } finally {
      setSaving(null);
    }
  }

  async function cancelOrder(id: string) {
    if (!confirm("Bạn chắc chắn muốn hủy đơn hàng này?")) return;
    try {
      setSaving(id);
      await updateDoc(doc(firebaseDb, "orders", id), { status: "cancelled" as OrderStatus, cancelledAt: Date.now() });
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "cancelled" as OrderStatus, cancelledAt: Date.now() } : o));
      showToast("Đã hủy đơn hàng");
    } catch (err) {
      console.error(err);
      showToast("Lỗi hủy đơn");
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const fmtTime = (ts?: number) => ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const filtered = orders.filter((o) => {
    const matchSearch = search === "" || o.id.toLowerCase().includes(search.toLowerCase()) || o.buyerId.toLowerCase().includes(search.toLowerCase()) || o.sellerId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const revenue = orders.filter((o) => o.status === "completed").reduce((s, o) => s + o.totalAmount, 0);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded-lg w-48" />
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-stone-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Quản lý đơn hàng</h1>
          <p className="text-sm text-stone-500 mt-0.5">{orders.length} đơn hàng — Doanh thu hoàn thành: <span className="font-semibold text-emerald-600">{fmt(revenue)}</span></p>
        </div>
      </div>

      {/* KPI mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {([
          { label: "Chờ xử lý", count: statusCounts["pending"] || 0, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Đang giao", count: statusCounts["shipping"] || 0, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Hoàn thành", count: statusCounts["completed"] || 0, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Đã hủy", count: statusCounts["cancelled"] || 0, color: "text-red-600", bg: "bg-red-50" },
        ]).map((k) => (
          <div key={k.label} className={`${k.bg} rounded-xl p-4 border border-stone-100`}>
            <p className={`text-2xl font-bold ${k.color}`}>{k.count}</p>
            <p className="text-xs text-stone-500 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Tìm theo mã đơn, buyer ID, seller ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-white rounded-xl border border-stone-200 p-1 overflow-x-auto">
          {(["all", "pending", "confirmed", "shipping", "delivered", "completed", "cancelled"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-emerald-500 text-white shadow-sm" : "text-stone-600 hover:bg-stone-50"}`}>
              {s === "all" ? "Tất cả" : STATUS_MAP[s].label}
              <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 py-12 text-center text-stone-400 text-sm">Không tìm thấy đơn hàng</div>
        ) : filtered.map((o) => (
          <div key={o.id} className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
            {/* Order header row */}
            <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="w-full px-5 py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left hover:bg-stone-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">#{o.id.slice(0, 12)}</p>
                <p className="text-xs text-stone-400 mt-0.5">Buyer: {o.buyerId.slice(0, 12)} — Seller: {(o.sellerName || o.sellerId).slice(0, 20)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-bold text-stone-800">{fmt(o.totalAmount)}</span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_MAP[o.status].color}`}>
                  {STATUS_MAP[o.status].label}
                </span>
                <span className="text-xs text-stone-400">{fmtDate(o.createdAt)}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform ${expandedId === o.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === o.id && (
              <div className="border-t border-stone-100 px-5 py-4 space-y-4 bg-stone-50/30">
                {/* Items */}
                <div>
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Sản phẩm</p>
                  <div className="space-y-1">
                    {o.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-stone-600">{item.name} × {item.quantity}</span>
                        <span className="font-medium text-stone-700">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div><p className="text-stone-400">Thanh toán</p><p className="text-stone-700 font-medium mt-0.5">{o.paymentMethod === "vnpay" ? "VNPay" : o.paymentMethod === "transfer" ? "Chuyển khoản" : "—"}</p></div>
                  <div><p className="text-stone-400">TT thanh toán</p><p className={`font-medium mt-0.5 ${o.paymentStatus === "success" ? "text-emerald-600" : "text-red-500"}`}>{o.paymentStatus === "success" ? "Thành công" : o.paymentStatus === "failed" ? "Thất bại" : "—"}</p></div>
                  <div><p className="text-stone-400">Mã giao dịch</p><p className="text-stone-700 font-mono mt-0.5">{o.transactionRef || "—"}</p></div>
                  <div><p className="text-stone-400">Tracking</p><p className="text-stone-700 font-mono mt-0.5">{o.trackingNumber || "—"}</p></div>
                </div>

                {o.shippingAddress && (
                  <div className="text-xs"><p className="text-stone-400">Địa chỉ giao hàng</p><p className="text-stone-700 mt-0.5">{o.shippingAddress}</p></div>
                )}
                {o.buyerNote && (
                  <div className="text-xs"><p className="text-stone-400">Ghi chú</p><p className="text-stone-700 mt-0.5">{o.buyerNote}</p></div>
                )}

                {/* Timeline */}
                <div className="text-xs space-y-1">
                  <p className="text-stone-400 font-semibold uppercase tracking-wider">Lịch sử</p>
                  {[
                    { label: "Tạo đơn", ts: o.createdAt },
                    { label: "Thanh toán", ts: o.paidAt },
                    { label: "Xác nhận", ts: o.confirmedAt },
                    { label: "Giao hàng", ts: o.shippedAt },
                    { label: "Đã giao", ts: o.deliveredAt },
                    { label: "Hoàn thành", ts: o.completedAt },
                    { label: "Đã hủy", ts: o.cancelledAt },
                  ].filter((e) => e.ts).map((e, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-stone-500">{e.label}: <span className="text-stone-700">{fmtTime(e.ts)}</span></span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {o.status !== "completed" && o.status !== "cancelled" && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => advanceStatus(o)}
                      disabled={saving === o.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm"
                    >
                      {STATUS_FLOW.indexOf(o.status) < STATUS_FLOW.length - 1
                        ? `→ ${STATUS_MAP[STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1]].label}`
                        : "—"}
                    </button>
                    <button
                      onClick={() => cancelOrder(o.id)}
                      disabled={saving === o.id}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      Hủy đơn
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
