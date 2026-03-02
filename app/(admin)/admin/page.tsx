"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { firebaseDb } from "@/lib/firebase/client";
import type { AppUser } from "@/types/user";
import type { Listing } from "@/types/listing";
import type { Order } from "@/types/order";

type Stats = {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalRevenue: number;
  pendingVerifications: number;
  activeListings: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const [
        usersSnap, listingsSnap, ordersSnap,
        activeListingsSnap, pendingVerSnap,
        recentUsersSnap, recentListingsSnap, recentOrdersSnap,
      ] = await Promise.all([
        getCountFromServer(collection(firebaseDb, "users")),
        getCountFromServer(collection(firebaseDb, "listings")),
        getCountFromServer(collection(firebaseDb, "orders")),
        getCountFromServer(query(collection(firebaseDb, "listings"), where("status", "==", "active"))),
        getCountFromServer(query(collection(firebaseDb, "seller_verifications"), where("status", "==", "pending"))),
        getDocs(query(collection(firebaseDb, "users"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(collection(firebaseDb, "listings"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(collection(firebaseDb, "orders"), orderBy("createdAt", "desc"), limit(5))),
      ]);

      let totalRevenue = 0;
      const allOrders = await getDocs(collection(firebaseDb, "orders"));
      allOrders.forEach((d) => {
        const o = d.data();
        if (o.status !== "cancelled") totalRevenue += o.totalAmount || 0;
      });

      setStats({
        totalUsers: usersSnap.data().count,
        totalListings: listingsSnap.data().count,
        totalOrders: ordersSnap.data().count,
        totalRevenue,
        activeListings: activeListingsSnap.data().count,
        pendingVerifications: pendingVerSnap.data().count,
      });

      setRecentUsers(recentUsersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
      setRecentListings(recentListingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      setRecentOrders(recentOrdersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtTime = (ts: number) => new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

  const statusColors: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700 border-amber-200",
    confirmed: "bg-blue-50 text-blue-700 border-blue-200",
    shipping: "bg-indigo-50 text-indigo-700 border-indigo-200",
    delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
    completed: "bg-green-50 text-green-700 border-green-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipping: "Đang giao",
    delivered: "Đã giao", completed: "Hoàn thành", cancelled: "Đã hủy",
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-stone-200 rounded-lg w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl border border-stone-200" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Tổng người dùng", value: stats?.totalUsers ?? 0, bgLight: "bg-blue-50", textColor: "text-blue-600", link: "/admin/users",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: "Tin đăng", value: `${stats?.activeListings ?? 0} / ${stats?.totalListings ?? 0}`, subLabel: "active / tổng", bgLight: "bg-emerald-50", textColor: "text-emerald-600", link: "/admin/listings",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg> },
    { label: "Đơn hàng", value: stats?.totalOrders ?? 0, bgLight: "bg-amber-50", textColor: "text-amber-600", link: "/admin/orders",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
    { label: "Doanh thu", value: fmt(stats?.totalRevenue ?? 0), bgLight: "bg-purple-50", textColor: "text-purple-600", link: "/admin/orders",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Tổng quan</h1>
          <p className="text-sm text-stone-500 mt-0.5">Dữ liệu realtime từ Firestore</p>
        </div>
        {(stats?.pendingVerifications ?? 0) > 0 && (
          <Link href="/admin/seller-verification" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium hover:bg-amber-100 transition-colors">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold">{stats?.pendingVerifications}</span>
            Yêu cầu xác minh chờ duyệt
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.link} className="group">
            <div className="bg-white rounded-2xl border border-stone-200/80 p-5 hover:shadow-lg hover:border-stone-300/80 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div className={`p-2.5 rounded-xl ${kpi.bgLight}`}><span className={kpi.textColor}>{kpi.icon}</span></div>
                <svg className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-stone-800">{kpi.value}</p>
                <p className="text-xs text-stone-500 mt-0.5">{kpi.subLabel || kpi.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800">Đơn hàng gần đây</h3>
            <Link href="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Xem tất cả →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">Chưa có đơn hàng</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recentOrders.map((order) => (
                <div key={order.id} className="px-5 py-3.5 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-700 truncate">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{fmtTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-stone-700">{fmt(order.totalAmount)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${statusColors[order.status] || "bg-stone-50 text-stone-600 border-stone-200"}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800">Người dùng mới</h3>
            <Link href="/admin/users" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Xem tất cả →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">Chưa có người dùng</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recentUsers.map((u) => (
                <div key={u.uid} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50/50 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {(u.displayName || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-700 truncate">{u.displayName || "Chưa có tên"}</p>
                    <p className="text-xs text-stone-400 truncate">{u.email}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    u.role === "admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    u.role === "seller" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                    "bg-stone-50 text-stone-600 border-stone-200"
                  }`}>
                    {u.role === "admin" ? "Admin" : u.role === "seller" ? "Seller" : "User"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden xl:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <h3 className="font-semibold text-stone-800">Tin đăng gần đây</h3>
            <Link href="/admin/listings" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Xem tất cả →</Link>
          </div>
          {recentListings.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-sm">Chưa có tin đăng</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50/80">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Tiêu đề</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Loại</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Giá</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {recentListings.map((l) => (
                    <tr key={l.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-stone-700 truncate max-w-[200px]">{l.title}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${l.type === "art" ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-700"}`}>
                          {l.type === "art" ? "Nghệ thuật" : "Phụ phẩm"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right font-medium text-stone-700">{fmt(l.price)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block w-2 h-2 rounded-full ${l.status === "active" ? "bg-emerald-500" : l.status === "hidden" ? "bg-red-400" : "bg-stone-300"}`} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-stone-500">{fmtDate(l.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
