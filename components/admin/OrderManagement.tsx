"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { Order } from "@/types/marketplace";
import { ORDER_STATUS_LABEL } from "@/lib/marketplace/stateMachine";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | Order["status"]>("ALL");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const snap = await getDocs(query(collection(firebaseDb, MP_COLLECTIONS.orders), orderBy("createdAt", "desc")));
      setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Order)));
    } catch (e) {
      console.error(e);
      showToast("Lỗi tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        search.trim() === "" ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.buyerId.toLowerCase().includes(search.toLowerCase()) ||
        o.sellerId.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  async function confirmOrder(orderId: string) {
    try {
      setSavingId(orderId);
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không thể xác nhận đơn.");
      showToast(data?.message || "Xác nhận đơn hàng thành công.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi xác nhận đơn hàng.";
      showToast(msg);
    } finally {
      setSavingId(null);
    }
  }

  async function completeOrder(orderId: string) {
    try {
      setSavingId(orderId);
      const res = await fetch(`/api/orders/${orderId}/complete`, { method: "PUT" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không thể hoàn thành đơn.");
      showToast(data?.message || "Hoàn thành đơn hàng thành công.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi hoàn thành đơn hàng.";
      showToast(msg);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl text-sm shadow-xl">
          {toast}
        </div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-200/80">Admin Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">Quản lý đơn hàng</h1>
        <p className="text-emerald-100/80 text-sm mt-2">
          Theo dõi trạng thái: <span className="font-bold">Chờ xác nhận → Đang giao → Hoàn thành</span>
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn, buyer ID, seller ID..."
          className="flex-1 px-4 py-3 rounded-2xl border border-sage-200 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="flex gap-2 bg-white/90 border border-sage-200 rounded-2xl p-2 overflow-x-auto">
          {(["ALL", "PENDING", "SHIPPING", "COMPLETED", "CANCELLED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === s ? "bg-emerald-600 text-white" : "text-stone-600 hover:bg-emerald-50"
              }`}
            >
              {s === "ALL" ? "Tất cả" : ORDER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Đang tải đơn hàng...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Không có đơn hàng.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((o) => (
            <div key={o.id} className="bg-white/90 border border-sage-200 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-stone-800">#{o.id.slice(0, 12)}</p>
                  <p className="text-xs text-stone-500 mt-1">
                    Buyer: <span className="font-semibold">{o.buyerId}</span> — Seller:{" "}
                    <span className="font-semibold">{o.sellerId}</span>
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Trạng thái: <span className="font-bold text-emerald-700">{ORDER_STATUS_LABEL[o.status]}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-xs text-stone-500">Tổng tiền</p>
                    <p className="text-lg font-extrabold text-stone-900">{fmtMoney(o.totalAmount)}</p>
                  </div>

                  {o.status === "PENDING" && (
                    <button
                      onClick={() => confirmOrder(o.id)}
                      disabled={savingId === o.id}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Xác nhận đơn
                    </button>
                  )}

                  {o.status === "SHIPPING" && (
                    <button
                      onClick={() => completeOrder(o.id)}
                      disabled={savingId === o.id}
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Đã giao thành công
                    </button>
                  )}

                  {o.status === "COMPLETED" && (
                    <span className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700">
                      Đã hoàn thành
                    </span>
                  )}

                  {o.status === "CANCELLED" && (
                    <span className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700">Đã hủy</span>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-sage-100 pt-4 text-sm">
                <p className="font-bold text-stone-700">Sản phẩm</p>
                <ul className="mt-2 space-y-1">
                  {o.items.map((it, idx) => (
                    <li key={idx} className="flex justify-between text-stone-600">
                      <span className="truncate pr-3">
                        {it.title} × {it.quantity}
                      </span>
                      <span className="font-semibold">{fmtMoney(it.unitPrice * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-stone-500 mt-3">
                  Địa chỉ giao: <span className="font-medium text-stone-700">{o.shippingAddress}</span>
                </p>
                {o.buyerNote && <p className="text-xs text-stone-500 mt-1">Ghi chú: {o.buyerNote}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

