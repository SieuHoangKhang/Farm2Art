"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy, where,
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

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
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded-lg w-48" />
        <div className="h-12 bg-white rounded-xl border border-stone-200" />
        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white rounded-xl border border-stone-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg animate-in fade-in">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Quản lý người dùng</h1>
        <p className="text-sm text-stone-500 mt-0.5">{users.length} người dùng trong hệ thống</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên, email, UID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-stone-200 p-1">
          {(["all", "admin", "seller", "user"] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                roleFilter === role
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-stone-600 hover:bg-stone-50"
              }`}
            >
              {role === "all" ? "Tất cả" : role.charAt(0).toUpperCase() + role.slice(1)}
              <span className="ml-1 opacity-70">({roleCounts[role]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Người dùng</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">UID</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Vai trò</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Xác minh</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-stone-400 text-sm">Không tìm thấy người dùng</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.uid} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(u.displayName || u.email || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-stone-700 truncate">{u.displayName || "Chưa có tên"}</p>
                        <p className="text-xs text-stone-400 truncate">{u.email || u.phone || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-stone-500">{u.uid.slice(0, 12)}...</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.uid, e.target.value as UserRole)}
                      disabled={saving === u.uid}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 ${
                        u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                        u.role === "seller" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        "bg-stone-50 text-stone-600 border-stone-200"
                      }`}
                    >
                      <option value="user">User</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {u.sellerVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        <span className="text-xs font-medium">Đã xác minh</span>
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right text-xs text-stone-500">
                    {typeof u.createdAt === "number" ? fmtDate(u.createdAt) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {saving === u.uid && (
                      <span className="text-xs text-emerald-600 font-medium">Đang lưu...</span>
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
