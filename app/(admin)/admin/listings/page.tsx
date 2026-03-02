"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy,
} from "firebase/firestore";
import type { Listing } from "@/types/listing";

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Listing["status"]>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "byproduct" | "art">("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadListings(); }, []);

  async function loadListings() {
    try {
      const snap = await getDocs(query(collection(firebaseDb, "listings"), orderBy("createdAt", "desc")));
      setListings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
    } catch (err) {
      console.error("Load listings error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id: string, current: Listing["status"]) {
    const next: Listing["status"] = current === "active" ? "hidden" : "active";
    try {
      setSaving(id);
      await updateDoc(doc(firebaseDb, "listings", id), { status: next });
      setListings((prev) => prev.map((l) => l.id === id ? { ...l, status: next } : l));
      showToast(next === "hidden" ? "Đã ẩn tin đăng" : "Đã hiện tin đăng");
    } catch (err) {
      console.error(err);
      showToast("Lỗi cập nhật trạng thái");
    } finally {
      setSaving(null);
    }
  }

  async function deleteListing(id: string) {
    if (!confirm("Bạn chắc chắn muốn xóa tin đăng này?")) return;
    try {
      setSaving(id);
      await deleteDoc(doc(firebaseDb, "listings", id));
      setListings((prev) => prev.filter((l) => l.id !== id));
      showToast("Đã xóa tin đăng");
    } catch (err) {
      console.error(err);
      showToast("Lỗi xóa tin đăng");
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const filtered = listings.filter((l) => {
    const matchSearch = search === "" || l.title.toLowerCase().includes(search.toLowerCase()) || l.sellerId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType = typeFilter === "all" || l.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const statusCounts: Record<string, number> = { all: listings.length, active: 0, hidden: 0, draft: 0, inactive: 0 };
  listings.forEach((l) => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

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

      <div>
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Quản lý tin đăng</h1>
        <p className="text-sm text-stone-500 mt-0.5">{listings.length} tin đăng trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Tìm theo tiêu đề, seller ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-stone-200 p-1">
          {(["all", "active", "hidden", "draft"] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-emerald-500 text-white shadow-sm" : "text-stone-600 hover:bg-stone-50"}`}>
              {s === "all" ? "Tất cả" : s === "active" ? "Active" : s === "hidden" ? "Ẩn" : "Nháp"}
              <span className="ml-1 opacity-70">({statusCounts[s] || 0})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-stone-200 p-1">
          {(["all", "byproduct", "art"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter === t ? "bg-emerald-500 text-white shadow-sm" : "text-stone-600 hover:bg-stone-50"}`}>
              {t === "all" ? "Loại" : t === "art" ? "Nghệ thuật" : "Phụ phẩm"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Tin đăng</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Loại</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Seller</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-stone-400 text-sm">Không tìm thấy tin đăng</td></tr>
              ) : filtered.map((l) => (
                <tr key={l.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-stone-700 truncate max-w-[240px]">{l.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[240px]">{l.description?.slice(0, 60)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${l.type === "art" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}>
                      {l.type === "art" ? "Nghệ thuật" : "Phụ phẩm"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-stone-500">{l.sellerId.slice(0, 12)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-stone-700">{fmt(l.price)}</span>
                    {l.unit && <span className="text-xs text-stone-400 ml-1">/{l.unit}</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                      l.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      l.status === "hidden" ? "bg-red-50 text-red-700 border-red-200" :
                      "bg-stone-50 text-stone-600 border-stone-200"
                    }`}>
                      {l.status === "active" ? "Active" : l.status === "hidden" ? "Ẩn" : l.status === "draft" ? "Nháp" : l.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-stone-500">
                    {typeof l.createdAt === "number" ? fmtDate(l.createdAt) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleStatus(l.id, l.status)}
                        disabled={saving === l.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-50 transition-colors"
                      >
                        {l.status === "active" ? "Ẩn" : "Hiện"}
                      </button>
                      <button
                        onClick={() => deleteListing(l.id)}
                        disabled={saving === l.id}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
