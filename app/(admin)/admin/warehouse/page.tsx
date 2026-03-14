"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, deleteDoc, doc, getDocs, query, orderBy, updateDoc,
} from "firebase/firestore";
import type { Order, WarehouseOrderStatus } from "@/types/order";

const WAREHOUSE_STATUS_LABEL: Record<string, string> = {
  in_stock: "Còn hàng trong kho",
  awaiting_intake: "Chờ nhập kho",
  in_storage: "Đang lưu kho",
  ready_to_ship: "Sẵn sàng xuất kho",
  shipped: "Đã xuất kho",
  completed: "Hoàn tất đơn kho",
};

const WAREHOUSE_STATUS_COLOR: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-800",
  awaiting_intake: "bg-yellow-100 text-yellow-800",
  in_storage: "bg-blue-100 text-blue-800",
  ready_to_ship: "bg-indigo-100 text-indigo-800",
  shipped: "bg-green-100 text-green-800",
  completed: "bg-teal-100 text-teal-800",
};

function getWarehouseStatusLabel(status?: string) {
  if (!status) return "—";
  return WAREHOUSE_STATUS_LABEL[status] || status;
}

export default function WarehouseManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WarehouseOrderStatus>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [warehouseStatusEditing, setWarehouseStatusEditing] = useState<Record<string, string>>({});
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

  useEffect(() => { loadOrders(); }, []);

  async function loadOrders() {
    try {
      const snap = await getDocs(
        query(
          collection(firebaseDb, "orders"),
          orderBy("createdAt", "desc")
        )
      );
      const allOrders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
      // Filter chỉ những đơn có warehouse service enabled
      const warehouseOrders = allOrders.filter(o => o.warehouseService?.enabled === true);
      setOrders(warehouseOrders);
    } catch (err) {
      console.error("Load orders error:", err);
      showToast("Lỗi tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  async function updateWarehouseStatus(orderId: string, newStatus: string) {
    try {
      setSaving(orderId);
      const res = await fetch(`/api/orders/${orderId}/warehouse`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ warehouseStatus: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Không thể cập nhật");
      }
      const data = await res.json();
      
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId && o.warehouseService
            ? {
                ...o,
                status: data.orderStatus || o.status, // Cập nhật order status nếu có auto-sync
                warehouseService: {
                  ...o.warehouseService,
                  warehouseStatus: newStatus as WarehouseOrderStatus,
                  updatedAt: data.updatedAt,
                },
                shippedAt: data.shippedAt || o.shippedAt, // Cập nhật nếu auto-sync sang shipping
                completedAt: data.completedAt || o.completedAt,
              }
            : o
        )
      );
      setWarehouseStatusEditing((prev) => ({ ...prev, [orderId]: "" }));
      const msg =
        newStatus === "shipped"
          ? "Kho đã xuất hàng -> đơn chuyển sang Đang giao"
          : newStatus === "completed"
            ? "Kho và đơn hàng đã hoàn tất"
            : `Cập nhật: ${getWarehouseStatusLabel(newStatus)}`;
      showToast(msg);
    } catch (err) {
      console.error(err);
      showToast(`Lỗi: ${err instanceof Error ? err.message : "Không thể cập nhật"}`);
    } finally {
      setSaving(null);
    }
  }

  async function generateInvoiceForOrder(order: Order) {
    try {
      setGeneratingInvoiceId(order.id);
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          sellerId: order.sellerId,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || "Không thể tạo hóa đơn");
      }

      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? {
                ...o,
                invoiceId: data?.invoice?.id || o.invoiceId,
              }
            : o
        )
      );

      showToast(`Đã phát hành hóa đơn ${data?.invoice?.invoiceNumber || ""}`.trim());
    } catch (err) {
      showToast(`Lỗi tạo hóa đơn: ${err instanceof Error ? err.message : "Không rõ"}`);
    } finally {
      setGeneratingInvoiceId(null);
    }
  }

  async function removeFromWarehouseQueue(order: Order) {
    if (!order.warehouseService?.enabled) return;
    if (!confirm("Xóa đơn này khỏi danh sách quản lý kho? Đơn hàng vẫn được giữ trong hệ thống.")) return;

    try {
      setSaving(order.id);
      await updateDoc(doc(firebaseDb, "orders", order.id), {
        "warehouseService.enabled": false,
        "warehouseService.updatedAt": Date.now(),
      });
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      showToast("Đã xóa đơn khỏi quản lý kho");
    } catch (err) {
      console.error(err);
      showToast("Lỗi xóa đơn khỏi kho");
    } finally {
      setSaving(null);
    }
  }

  async function deleteRelatedListing(order: Order) {
    if (!order.listingId) {
      showToast("Đơn này không có listing hợp lệ");
      return;
    }
    if (!confirm("Xóa luôn bài đăng sản phẩm liên quan đơn này?")) return;

    try {
      setSaving(order.id);
      await deleteDoc(doc(firebaseDb, "listings", order.listingId));
      showToast("Đã xóa tin đăng liên quan");
    } catch (err) {
      console.error(err);
      showToast("Lỗi xóa tin đăng");
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const getOrderTotal = (order: Order) =>
    order.grandTotal ?? (order.subTotal ?? order.totalAmount);
  const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
  const fmtTime = (ts?: number) => ts ? new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

  const filtered = orders.filter((o) => {
    const warehouseStatus = o.warehouseService?.warehouseStatus;
    const matchSearch = search === "" || 
      o.id.toLowerCase().includes(search.toLowerCase()) || 
      o.buyerId.toLowerCase().includes(search.toLowerCase()) || 
      o.sellerId.toLowerCase().includes(search.toLowerCase()) ||
      (o.sellerName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || warehouseStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => {
    const status = o.warehouseService?.warehouseStatus || "unknown";
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const totalStorageFee = orders.reduce((s, o) => s + (o.warehouseService?.serviceFeeTotal ?? 0), 0);

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
    { label: "Còn hàng", count: (statusCounts["in_stock"] || 0) + (statusCounts["awaiting_intake"] || 0) + (statusCounts["in_storage"] || 0), gradient: "from-emerald-400 to-emerald-500", text: "text-emerald-700" },
    { label: "Đã xuất kho", count: (statusCounts["shipped"] || 0) + (statusCounts["ready_to_ship"] || 0), gradient: "from-indigo-400 to-indigo-500", text: "text-indigo-700" },
    { label: "Hoàn tất", count: statusCounts["completed"] || 0, gradient: "from-teal-400 to-teal-500", text: "text-teal-700" },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark text-white px-5 py-3 rounded-2xl text-sm shadow-xl animate-fadeInDown font-medium">{toast}</div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-amber-800 via-amber-700 to-amber-900 px-6 md:px-8 py-8 shadow-lg overflow-hidden animate-fadeInUp">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-300/80 mb-2">Kho Farm2Art</p>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Quản lí kho</h1>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
            <p className="text-sm text-amber-100/70 mt-3">{orders.length} đơn hàng — Tổng phí dịch vụ: <span className="font-bold text-amber-300">{fmt(totalStorageFee)}</span></p>
          </div>
        </div>
      </div>

      {/* KPI mini cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {miniKpis.map((k, i) => (
          <div key={k.label} className="animate-fadeInUp relative bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-5 hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 hover-lift overflow-hidden" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
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
            type="text" placeholder="Tìm theo mã đơn, buyer, seller..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sage-300 bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex gap-1.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-1.5 overflow-x-auto">
          {(["all", "in_stock", "awaiting_intake", "in_storage", "ready_to_ship", "shipped", "completed"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${statusFilter === s ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md shadow-amber-500/20" : "text-stone-600 hover:bg-amber-50/60 hover:text-amber-700"}`}>
              {s === "all" ? "Tất cả" : getWarehouseStatusLabel(s)}
              <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 py-16 text-center text-stone-400 text-sm shadow-sm">Không tìm thấy đơn hàng nào</div>
        ) : filtered.map((o, i) => (
          <div key={o.id} className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 overflow-hidden" style={{ animationDelay: `${300 + i * 60}ms` }}>
            {/* Header */}
            <button onClick={() => setExpandedId(expandedId === o.id ? null : o.id)} className="w-full px-6 py-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left hover:bg-amber-50/20 transition-colors duration-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-800">#{o.id.slice(0, 12)}</p>
                <p className="text-xs text-stone-400 mt-0.5">Seller: {(o.sellerName || o.sellerId).slice(0, 20)}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-stone-500">Phí kho</p>
                  <p className="text-sm font-bold text-stone-800">{fmt(o.warehouseService?.serviceFeeTotal ?? 0)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${WAREHOUSE_STATUS_COLOR[o.warehouseService?.warehouseStatus || ""] || "bg-gray-100"}`}>
                  {getWarehouseStatusLabel(o.warehouseService?.warehouseStatus)}
                </span>
                <span className="text-xs text-stone-400 font-medium">{fmtDate(o.createdAt)}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedId === o.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded details */}
            {expandedId === o.id && o.warehouseService && (
              <div className="border-t border-sage-100/60 px-6 py-5 space-y-5 bg-gradient-to-b from-amber-50/20 to-cream-50/20">
                {/* Items */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Sản phẩm</p>
                  <div className="space-y-1.5">
                    {o.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm bg-white/60 rounded-xl px-4 py-2.5 border border-sage-100">
                        <span className="text-stone-600 font-medium">{item.name} × {item.quantity}</span>
                        <span className="font-bold text-stone-700">{fmt(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Warehouse details grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">Mô hình giao hàng</p>
                    <p className="text-stone-700 font-semibold mt-1">Kho Farm2Art</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">Lưu kho</p>
                    <p className="text-stone-700 font-semibold mt-1">{o.warehouseService.storageDays} ngày</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">Chi tiết phí</p>
                    <p className="text-stone-700 font-semibold mt-1 text-xs">{fmt(o.warehouseService.storageFee)} + {fmt(o.warehouseService.shippingFee)}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">Tổng phí</p>
                    <p className="text-stone-700 font-semibold mt-1">{fmt(o.warehouseService.serviceFeeTotal)}</p>
                  </div>
                </div>

                {/* Status management */}
                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                  <p className="text-sm font-bold text-amber-900 mb-3">Quản lí trạng thái kho</p>
                  {warehouseStatusEditing[o.id] ? (
                    <div className="space-y-3">
                      <select
                        value={warehouseStatusEditing[o.id] || o.warehouseService.warehouseStatus || ""}
                        onChange={(e) => setWarehouseStatusEditing((prev) => ({ ...prev, [o.id]: e.target.value }))}
                        disabled={saving === o.id}
                        className="w-full px-3 py-2 text-sm border border-amber-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Chọn trạng thái...</option>
                        <option value="in_stock">Còn hàng trong kho</option>
                        <option value="awaiting_intake">Chờ nhập kho</option>
                        <option value="in_storage">Đang lưu kho</option>
                        <option value="ready_to_ship">Sẵn sàng xuất kho</option>
                        <option value="shipped">Đã xuất kho</option>
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateWarehouseStatus(o.id, warehouseStatusEditing[o.id])}
                          disabled={saving === o.id || !warehouseStatusEditing[o.id]}
                          className="flex-1 px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-all"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setWarehouseStatusEditing((prev) => ({ ...prev, [o.id]: "" }))}
                          disabled={saving === o.id}
                          className="flex-1 px-4 py-2 text-sm font-semibold border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 disabled:opacity-50 transition-all"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-stone-600 mb-1">Trạng thái hiện tại:</p>
                        <p className="text-lg font-bold text-amber-900">{getWarehouseStatusLabel(o.warehouseService.warehouseStatus)}</p>
                      </div>
                      <button
                        onClick={() => setWarehouseStatusEditing((prev) => ({ ...prev, [o.id]: o.warehouseService?.warehouseStatus || "" }))}
                        disabled={saving === o.id}
                        className="px-5 py-2 text-sm font-semibold rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition-all"
                      >
                        Cập nhật trạng thái
                      </button>
                    </div>
                  )}
                </div>

                {/* Timeline */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-amber-600 mb-2">Lịch sử</p>
                  <div className="space-y-2">
                    {[
                      { label: "Tạo đơn", ts: o.createdAt },
                      { label: "Thanh toán", ts: o.paidAt },
                      { label: "Xác nhận", ts: o.confirmedAt },
                      { label: "Giao hàng", ts: o.shippedAt },
                      { label: "Đã giao", ts: o.deliveredAt },
                      { label: "Hoàn thành", ts: o.completedAt },
                    ].filter((e) => e.ts).map((e, idx) => (
                      <div key={idx} className="flex items-center gap-3 text-xs">
                        <div className="relative flex-shrink-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 block shadow-sm shadow-amber-500/30" />
                          {idx > 0 && <span className="absolute bottom-full left-1/2 -translate-x-1/2 w-px h-3 bg-amber-200" />}
                        </div>
                        <span className="text-stone-500 font-medium">{e.label}: <span className="text-stone-700 font-semibold">{fmtTime(e.ts)}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                {o.shippingAddress && (
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100 text-xs">
                    <p className="text-stone-400 font-medium">Địa chỉ giao hàng</p>
                    <p className="text-stone-700 mt-1">{o.shippingAddress}</p>
                  </div>
                )}

                <div className="bg-white/60 rounded-xl p-3 border border-sage-100 text-xs">
                  <p className="text-stone-400 font-medium">Hóa đơn dịch vụ seller</p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-stone-700">
                      {o.invoiceId ? `Đã phát hành: ${o.invoiceId}` : "Chưa phát hành hóa đơn"}
                    </p>
                    <button
                      onClick={() => generateInvoiceForOrder(o)}
                      disabled={generatingInvoiceId === o.id || !!o.invoiceId}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {o.invoiceId
                        ? "Đã phát hành"
                        : generatingInvoiceId === o.id
                          ? "Đang tạo..."
                          : "Phát hành hóa đơn"}
                    </button>
                  </div>
                </div>

                <div className="bg-white/60 rounded-xl p-3 border border-sage-100 text-xs">
                  <p className="text-stone-400 font-medium">Tác vụ sau giao hàng</p>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <p className="text-stone-700">
                      Chỉ áp dụng khi đơn đã hoàn tất hoặc đã xuất kho.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => removeFromWarehouseQueue(o)}
                        disabled={saving === o.id || !["completed", "shipped"].includes(o.warehouseService.warehouseStatus || "")}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-amber-300 text-amber-700 bg-white hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Xóa đơn khỏi kho
                      </button>
                      <button
                        onClick={() => deleteRelatedListing(o)}
                        disabled={saving === o.id || o.status !== "completed"}
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Xóa listing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
