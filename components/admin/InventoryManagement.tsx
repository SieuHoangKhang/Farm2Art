"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Inventory, Product } from "@/types/marketplace";
import { INVENTORY_STATUS_LABEL, PRODUCT_STATUS_LABEL } from "@/lib/marketplace/stateMachine";

type Row = {
  product: Product;
  inventory: Inventory | null;
};

export default function InventoryManagement() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
      const [pSnap, iSnap] = await Promise.all([
        getDocs(query(collection(firebaseDb, MP_COLLECTIONS.products), orderBy("createdAt", "desc"))),
        getDocs(query(collection(firebaseDb, MP_COLLECTIONS.inventories), orderBy("createdAt", "desc"))),
      ]);

      const products = pSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as Product));
      const inventories = new Map(iSnap.docs.map((d) => [d.id, ({ id: d.id, ...(d.data() as any) } as Inventory)]));

      setRows(
        products.map((p) => ({
          product: p,
          inventory: inventories.get(p.id) || null,
        }))
      );
    } catch (e) {
      console.error(e);
      showToast("Lỗi tải dữ liệu kho.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const s = search.trim().toLowerCase();
      if (!s) return true;
      return r.product.id.toLowerCase().includes(s) || r.product.title.toLowerCase().includes(s);
    });
  }, [rows, search]);

  async function hideProduct(productId: string) {
    if (!confirm("Bạn chắc chắn muốn ẩn bài đăng này (xóa mềm)?")) return;
    try {
      setSavingId(productId);
      const res = await fetch(`/api/products/${productId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không thể ẩn bài đăng.");
      showToast(data?.message || "Đã ẩn bài đăng thành công.");
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi ẩn bài đăng.";
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

      <div className="rounded-2xl bg-gradient-to-br from-amber-700 via-amber-600 to-amber-800 p-6 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-100/80">Admin Dashboard</p>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2">Quản lý kho</h1>
        <p className="text-amber-100/80 text-sm mt-2">
          Theo dõi tồn kho theo trạng thái: <span className="font-bold">Còn hàng / Tạm giữ / Đã xuất kho / Đã bán</span>
        </p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm theo mã sản phẩm hoặc tên sản phẩm..."
        className="w-full px-4 py-3 rounded-2xl border border-sage-200 bg-white/90 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />

      {loading ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Đang tải dữ liệu kho...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white/90 border border-sage-200 rounded-2xl p-10 text-center text-stone-500">
          Không có dữ liệu kho.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-sage-200 bg-white/90">
          <table className="w-full text-sm">
            <thead className="bg-sage-50 text-stone-600">
              <tr>
                <th className="text-left px-4 py-3 font-extrabold">Sản phẩm</th>
                <th className="text-left px-4 py-3 font-extrabold">Trạng thái bài đăng</th>
                <th className="text-right px-4 py-3 font-extrabold">Còn hàng</th>
                <th className="text-right px-4 py-3 font-extrabold">Tạm giữ</th>
                <th className="text-right px-4 py-3 font-extrabold">Đã xuất</th>
                <th className="text-right px-4 py-3 font-extrabold">Đã bán</th>
                <th className="text-left px-4 py-3 font-extrabold">Trạng thái kho</th>
                <th className="text-right px-4 py-3 font-extrabold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const inv = r.inventory;
                return (
                  <tr key={r.product.id} className="border-t border-sage-100">
                    <td className="px-4 py-3">
                      <p className="font-extrabold text-stone-800">{r.product.title}</p>
                      <p className="text-xs text-stone-500 mt-1">#{r.product.id.slice(0, 12)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-stone-100 text-stone-700">
                        {PRODUCT_STATUS_LABEL[r.product.status]}
                      </span>
                      {r.product.isDeleted && (
                        <p className="text-xs text-red-600 font-semibold mt-1">Đang xóa mềm</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{inv ? inv.quantityInStock : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inv ? inv.quantityReserved : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inv ? inv.quantityDispatched : "—"}</td>
                    <td className="px-4 py-3 text-right font-semibold">{inv ? inv.quantitySold : "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-700">
                        {inv ? INVENTORY_STATUS_LABEL[inv.status] : "Chưa có tồn kho"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => hideProduct(r.product.id)}
                        disabled={savingId === r.product.id}
                        className="px-4 py-2 rounded-xl text-xs font-extrabold border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Ẩn bài đăng
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

