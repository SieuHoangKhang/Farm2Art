"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy,
} from "firebase/firestore";
import type { Order, OrderStatus } from "@/types/order";

const STATUS_MAP: Record<OrderStatus, { label: string; color: string }> = {
  pending:   { label: "Chờ xử lý",   color: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-800" },
  shipping:  { label: "Đang giao",   color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "Đã giao",     color: "bg-green-100 text-green-800" },
  completed: { label: "Hoàn thành",  color: "bg-green-100 text-green-800" },
  cancelled: { label: "Đã hủy",     color: "bg-red-100 text-red-800" },
};

const STATUS_FLOW: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered", "completed"];

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
      showToast(`Cập nhật  ${STATUS_MAP[next].label}`);
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
  const getPayableTotal = (order: Order) =>
    order.grandTotal ??
    (order.subTotal ?? order.totalAmount) +
      (order.platformFee ?? 0) +
      (order.warehouseService?.serviceFeeTotal ?? 0);
  const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const fmtTime = (ts?: number) => ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const filtered = orders.filter((o) => {
    const matchSearch = search === "" || o.id.toLowerCase().includes(search.toLowerCase()) || o.buyerId.toLowerCase().includes(search.toLowerCase()) || o.sellerId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => { statusCounts[o.status] = (statusCounts[o.status] || 0) + 1; });

  const revenue = orders
    .filter((o) => o.status === "completed")
    .reduce((s, o) => s + getPayableTotal(o), 0);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-emerald-100/50" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white/80 rounded-2xl border border-sage-200" />)}
        </div>
      </div>
    );
  }

  const miniKpis = [
    { label: "Chờ xử lý", count: statusCounts["pending"] || 0, gradient: "from-amber-400 to-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
    { label: "Đang giao", count: statusCounts["shipping"] || 0, gradient: "from-indigo-400 to-indigo-500", bg: "bg-indigo-50", text: "text-indigo-700" },
    { label: "Hoàn thành", count: statusCounts["completed"] || 0, gradient: "from-emerald-400 to-emerald-500", bg: "bg-emerald-50", text: "text-emerald-700" },
    { label: "Đã hủy", count: statusCounts["cancelled"] || 0, gradient: "from-red-400 to-red-500", bg: "bg-red-50", text: "text-red-700" },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark text-white px-5 py-3 rounded-2xl text-sm shadow-xl animate-fadeInDown font-medium">{toast}</div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-6 md:px-8 py-8 shadow-lg overflow-hidden animate-fadeInUp">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-2">Quản lý</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Đơn hàng</h1>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
            <p className="text-sm text-emerald-100/70 mt-3">{orders.length} đơn hàng — Doanh thu: <span className="font-bold text-amber-300">{fmt(revenue)}</span></p>
          </div>
        </div>
      </div>

      {/* KPI mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {miniKpis.map((k, i) => (
          <div key={k.label} className="animate-fadeInUp relative bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-5 hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 hover-lift overflow-hidden" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
            <div className={`absolute -top-6 -right-6 w-16 h-16 bg-gradient-to-br ${k.gradient} opacity-[0.08] rounded-full blur-xl`} />
            <p className={`text-3xl font-extrabold ${k.text}`}>{k.count}</p>
            <p className="text-xs text-stone-500 mt-1 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 animate-fadeInUp" style={{ animationDelay: '200ms' }}>
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Tìm theo mã đơn, buyer ID, seller ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sage-300 bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex gap-1.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-1.5 overflow-x-auto">
          {(["all", "pending", "confirmed", "shipping", "delivered", "completed", "cancelled"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${statusFilter === s ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-stone-600 hover:bg-emerald-50/60 hover:text-emerald-700"}`}>
              {s === "all" ? "Tất cả" : STATUS_MAP[s].label}
              <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 py-16 text-center text-stone-400 text-sm shadow-sm">Không tìm thấy đơn hàng</div>
        ) : filtered.map((o, i) => (
          <div key={o.id} className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 overflow-hidden" style={{ animationDelay: `${300 + i * 60}ms` }}>
            {/* Order header row */}
            <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="w-full px-6 py-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left hover:bg-emerald-50/20 transition-colors duration-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-800">#{o.id.slice(0, 12)}</p>
                <p className="text-xs text-stone-400 mt-0.5">Buyer: {o.buyerId.slice(0, 12)} — Seller: {(o.sellerName || o.sellerId).slice(0, 20)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-sm font-extrabold text-stone-800">{fmt(getPayableTotal(o))}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[o.status].color}`}>
                  {STATUS_MAP[o.status].label}
                </span>
                <span className="text-xs text-stone-400 font-medium">{fmtDate(o.createdAt)}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedId === o.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded detail */}
            {expandedId === o.id && (
              <div className="border-t border-sage-100/60 px-6 py-5 space-y-5 bg-gradient-to-b from-emerald-50/20 to-cream-50/20">
                {/* Items */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Sản phẩm</p>
                  <div className="space-y-1.5">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white/60 rounded-xl px-4 py-2.5 border border-sage-100">
                        <span className="text-stone-600 font-medium">{item.name} × {item.quantity}</span>
                        <span className="font-bold text-stone-700">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Thanh toán</p><p className="text-stone-700 font-semibold mt-1">{o.paymentMethod === "vnpay" ? "VNPay" : o.paymentMethod === "transfer" ? "Chuyển khoản" : "—"}</p></div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">TT thanh toán</p><p className={`font-semibold mt-1 ${o.paymentStatus === "success" ? "text-emerald-600" : "text-red-500"}`}>{o.paymentStatus === "success" ? "Thành công" : o.paymentStatus === "failed" ? "Thất bại" : "—"}</p></div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Mã giao dịch</p><p className="text-stone-700 font-mono mt-1">{o.transactionRef || "—"}</p></div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Tracking</p><p className="text-stone-700 font-mono mt-1">{o.trackingNumber || "—"}</p></div>
                </div>

                {o.warehouseService && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Sơ chế</p><p className="text-stone-700 font-semibold mt-1">{o.warehouseService.processingMode === "warehouse" ? "Kho Farm2Art" : "Người bán tự sơ chế"}</p></div>
                    <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Lưu kho</p><p className="text-stone-700 font-semibold mt-1">{o.warehouseService.storageDays} ngày</p></div>
                    <div className="bg-white/60 rounded-xl p-3 border border-sage-100"><p className="text-stone-400 font-medium">Phí dịch vụ kho</p><p className="text-stone-700 font-semibold mt-1">{fmt(o.warehouseService.serviceFeeTotal)}</p></div>
                    <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                      <p className="text-stone-400 font-medium">Trạng thái kho</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-stone-700 font-semibold">{getWarehouseStatusLabel(o.warehouseService.warehouseStatus)}</p>
                        <a href={`/admin/warehouse`} className="text-xs px-2 py-1 ml-2 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all font-semibold">
                          Quản lí
                        </a>
                      </div>
                      {o.warehouseService.warehouseStatus === "shipped" && o.status !== "shipping" && (
                        <p className="text-blue-600 text-xs mt-2 font-semibold">💡 Sẽ tự động sang "Đang giao"</p>
                      )}
                    </div>
                  </div>
                )}

                {o.shippingAddress && (
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100 text-xs"><p className="text-stone-400 font-medium">Địa chỉ giao hàng</p><p className="text-stone-700 mt-1">{o.shippingAddress}</p></div>
                )}
                {o.buyerNote && (
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100 text-xs"><p className="text-stone-400 font-medium">Ghi chú</p><p className="text-stone-700 mt-1">{o.buyerNote}</p></div>
                )}

                {/* Timeline */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-2">Lịch sử</p>
                  <div className="space-y-2">
                    {[
                      { label: "Tạo đơn", ts: o.createdAt },
                      { label: "Thanh toán", ts: o.paidAt },
                      { label: "Xác nhận", ts: o.confirmedAt },
                      { label: "Giao hàng", ts: o.shippedAt },
                      { label: "Đã giao", ts: o.deliveredAt },
                      { label: "Hoàn thành", ts: o.completedAt },
                      { label: "Đã hủy", ts: o.cancelledAt },
                    ].filter((e) => e.ts).map((e, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="relative flex-shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 block shadow-sm shadow-emerald-500/30" />
                          {idx > 0 && <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-3 bg-emerald-200" />}
                        </div>
                        <span className="text-stone-500 font-medium">{e.label}: <span className="text-stone-700 font-semibold">{fmtTime(e.ts)}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {o.status !== "completed" && o.status !== "cancelled" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => advanceStatus(o)}
                      disabled={saving === o.id}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]"
                    >
                      {STATUS_FLOW.indexOf(o.status) < STATUS_FLOW.length - 1
                        ? ` ${STATUS_MAP[STATUS_FLOW[STATUS_FLOW.indexOf(o.status) + 1]].label}`
                        : "—"}
                    </button>
                    <button
                      onClick={() => cancelOrder(o.id)}
                      disabled={saving === o.id}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]"
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
