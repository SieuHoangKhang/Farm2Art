"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy,
} from "firebase/firestore";
import type { AppUser, UserRole } from "@/types/user";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    try {
      const snap = await getDocs(query(collection(firebaseDb, "users"), orderBy("createdAt", "desc")));
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
    } catch (err) {
      console.error("Load users error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(uid: string, newRole: UserRole) {
    try {
      setSaving(uid);
      await updateDoc(doc(firebaseDb, "users", uid), { role: newRole });
      setUsers((prev) => prev.map((u) => u.uid === uid ? { ...u, role: newRole } : u));
      showToast(`Đã cập nhật vai trò thành "${newRole}"`);
    } catch (err) {
      console.error(err);
      showToast("Lỗi: không thể cập nhật vai trò");
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const filtered = users.filter((u) => {
    const matchSearch = search === "" ||
      (u.displayName || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      u.uid.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleCounts = { all: users.length, admin: 0, seller: 0, user: 0 };
  users.forEach((u) => { if (u.role in roleCounts) roleCounts[u.role as keyof typeof roleCounts]++; });

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-emerald-100/50" />
        <div className="h-12 bg-white/80 rounded-2xl border border-sage-200" />
        {[1, 2, 3].map(i => <div key={i} className="h-18 bg-white/80 rounded-2xl border border-sage-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark text-white px-5 py-3 rounded-2xl text-sm shadow-xl animate-fadeInDown font-medium">
          {toast}
        </div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-6 md:px-8 py-8 shadow-lg overflow-hidden animate-fadeInUp">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-2">Quản lý</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Người dùng</h1>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
          <p className="text-sm text-emerald-100/70 mt-3">{users.length} người dùng trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Tìm theo tên, email, UID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sage-300 bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-1.5">
          {(["all", "admin", "seller", "user"] as const).map((role) => (
            <button key={role} onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                roleFilter === role
                  ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : "text-stone-600 hover:bg-emerald-50/60 hover:text-emerald-700"
              }`}>
              {role === "all" ? "Tất cả" : role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="ml-1.5 opacity-70">({roleCounts[role]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
                <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Người dùng</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">UID</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Vai trò</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Xác minh</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Thao tác</th>
              </tr>
              <tr><td colSpan={6}><div className="h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" /></td></tr>
            </thead>
            <tbody className="divide-y divide-sage-100/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-16 text-center text-stone-400 text-sm">Không tìm thấy người dùng</td></tr>
              ) : filtered.map((u, i) => (
                <tr key={u.uid} className="hover:bg-emerald-50/30 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-emerald-500/20">
                        {(u.displayName || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-stone-700 truncate">{u.displayName || "Chưa có tên"}</p>
                        <p className="text-xs text-stone-400 truncate">{u.email || u.phone || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">{u.uid.slice(0, 12)}...</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.uid, e.target.value as UserRole)}
                      disabled={saving === u.uid}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 transition-all duration-200 ${
                        u.role === "admin" ? "bg-purple-100 text-purple-800 border-purple-200" :
                        u.role === "seller" ? "bg-green-100 text-green-800 border-green-200" :
                        "bg-stone-100 text-stone-600 border-stone-200"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.sellerVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span className="text-xs font-semibold">Đã xác minh</span>
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-stone-500 font-medium">
                    {typeof u.createdAt === "number" ? fmtDate(u.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {saving === u.uid && (
                      <span className="text-xs text-emerald-600 font-semibold animate-pulse">Đang lưu...</span>
                    )}
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
