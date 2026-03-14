"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  collection, getCountFromServer, getDocs, limit, orderBy, query, where,
} from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { AppUser } from "@/types/user";
import type { Listing } from "@/types/listing";
import type { Order } from "@/types/order";

type Stats = {
  totalUsers: number;
  totalListings: number;
  totalOrders: number;
  totalTransactionValue: number;
  platformRevenue: number;
  totalSellerPayout: number;
  activeListings: number;
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) loadDashboard();
  }, [mounted]);

  async function loadDashboard() {
    try {
      // Dọn dữ liệu đơn cũ hơn 4 ngày để số liệu dashboard được làm sạch.
      await fetch('/api/orders/cleanup-old', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'all', olderThanDays: 4 }),
      }).catch(() => null);

      const [
        usersSnap, listingsSnap, ordersSnap,
        activeListingsSnap,
        recentUsersSnap, recentListingsSnap, recentOrdersSnap,
        pendingListingsSnap,
      ] = await Promise.all([
        getCountFromServer(collection(firebaseDb, "users")),
        getCountFromServer(collection(firebaseDb, "listings")),
        getCountFromServer(collection(firebaseDb, "orders")),
        getCountFromServer(query(collection(firebaseDb, "listings"), where("status", "==", "active"))),
        getDocs(query(collection(firebaseDb, "users"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(collection(firebaseDb, "listings"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(collection(firebaseDb, "orders"), orderBy("createdAt", "desc"), limit(5))),
        getDocs(query(collection(firebaseDb, "listings"), where("approvalStatus", "==", "pending_approval"), limit(5))),
      ]);

      let totalTransactionValue = 0;
      let platformRevenue = 0;
      let totalSellerPayout = 0;
      const allOrders = await getDocs(collection(firebaseDb, "orders"));
      allOrders.forEach((d) => {
        const o = d.data();
        if (o.status !== "cancelled") {
          const orderTotal = o.grandTotal ?? (o.subTotal ?? o.totalAmount);
          const subTotal = (o.subTotal ?? o.totalAmount) || 0;
          const platformFee = o.platformFee ?? Math.round(subTotal * 0.025);
          const sellerPayout = o.sellerPayout ?? Math.max(subTotal - platformFee, 0);
          
          totalTransactionValue += orderTotal;
          platformRevenue += platformFee;
          totalSellerPayout += sellerPayout;
        }
      });

      setStats({
        totalUsers: usersSnap.data().count,
        totalListings: listingsSnap.data().count,
        totalOrders: ordersSnap.data().count,
        totalTransactionValue,
        platformRevenue,
        totalSellerPayout,
        activeListings: activeListingsSnap.data().count,
      });

      setRecentUsers(recentUsersSnap.docs.map((d) => ({ uid: d.id, ...d.data() } as AppUser)));
      setRecentListings(recentListingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)));
      setRecentOrders(recentOrdersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setPendingListings(pendingListingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing)).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  const fmtTime = (ts: number) => new Date(ts).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  const getOrderTotal = (order: Order) => order.grandTotal ?? (order.subTotal ?? order.totalAmount);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipping: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const statusLabels: Record<string, string> = {
    pending: "Chờ xử lý", confirmed: "Đã xác nhận", shipping: "Đang giao",
    delivered: "Đã giao", completed: "Hoàn thành", cancelled: "Đã hủy",
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-32 bg-white/80 rounded-2xl border border-slate-200" />)}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Tổng người dùng", value: stats?.totalUsers ?? 0, link: "/admin/users",
      gradient: "from-blue-500 to-blue-600", bgLight: "bg-blue-50", textColor: "text-blue-600", shadowColor: "shadow-blue-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: "Tin đăng", value: `${stats?.activeListings ?? 0} / ${stats?.totalListings ?? 0}`, subLabel: "active / tổng", link: "/admin/listings",
      gradient: "from-emerald-500 to-emerald-600", bgLight: "bg-emerald-50", textColor: "text-emerald-600", shadowColor: "shadow-emerald-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
    },
    {
      label: "Đơn hàng", value: stats?.totalOrders ?? 0, link: "/admin/orders",
      gradient: "from-amber-400 to-amber-500", bgLight: "bg-amber-50", textColor: "text-amber-600", shadowColor: "shadow-amber-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    },
    {
      label: "Tổng GTGD", value: fmt(stats?.totalTransactionValue ?? 0), subLabel: "Giá trị giao dịch trên sàn", link: "/admin/orders",
      gradient: "from-purple-500 to-purple-600", bgLight: "bg-purple-50", textColor: "text-purple-600", shadowColor: "shadow-purple-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    },
    {
      label: "Doanh thu sàn", value: fmt(stats?.platformRevenue ?? 0), subLabel: "Phí nền tảng (2.5%)", link: "/admin/orders",
      gradient: "from-green-500 to-green-600", bgLight: "bg-green-50", textColor: "text-green-600", shadowColor: "shadow-green-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      label: "Trả người bán", value: fmt(stats?.totalSellerPayout ?? 0), subLabel: "Tổng tiền người bán nhận", link: "/admin/orders",
      gradient: "from-orange-400 to-orange-500", bgLight: "bg-orange-50", textColor: "text-orange-600", shadowColor: "shadow-orange-500/20",
      icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-6 md:px-8 py-8 md:py-10 shadow-lg overflow-hidden animate-fadeInUp">
        {/* Decorative elements */}
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />

        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-2">Bảng điều khiển</p>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Tổng quan</h1>
            <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
            <p className="text-sm text-emerald-100/70 mt-3">Dữ liệu realtime từ Firestore</p>
          </div>

        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {kpis.map((kpi, i) => (
          <Link key={kpi.label} href={kpi.link} className="group animate-fadeInUp" style={{ animationDelay: `${(i + 1) * 100}ms` }}>
            <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-5 hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 hover-lift overflow-hidden">
              {/* Decorative gradient corner */}
              <div className={`absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br ${kpi.gradient} opacity-[0.07] rounded-full blur-xl`} />
              <div className="relative flex items-start justify-between">
                <div className={`p-3 rounded-2xl ${kpi.bgLight} shadow-sm ${kpi.shadowColor}`}>
                  <span className={kpi.textColor}>{kpi.icon}</span>
                </div>
                <svg className="w-5 h-5 text-stone-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-extrabold text-stone-800">{kpi.value}</p>
                <p className="text-xs text-stone-500 mt-1 font-medium">{kpi.subLabel || kpi.label}</p>
              </div>
              {/* Bottom gradient accent */}
              <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${kpi.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          </Link>
        ))}
      </div>

      {/* Recent sections */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending Listings - NEW */}
        <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-blue-200/60 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ring-1 ring-blue-100 xl:col-span-2" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-50/80 via-white to-blue-50/40">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">!</span>
              <h3 className="font-semibold text-blue-900">⏳ Tin đăng chờ duyệt</h3>
              {pendingListings.length > 0 && <span className="ml-2 px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{pendingListings.length}</span>}
            </div>
            <Link href="/admin/listings?approval=pending_approval" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">Xem tất cả →</Link>
          </div>
          <div className="h-px bg-gradient-to-r from-blue-300/40 via-blue-300/20 to-transparent" />
          {pendingListings.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">✅ Không có tin chờ duyệt</div>
          ) : (
            <div className="divide-y divide-stone-100/60">
              {pendingListings.map((l, i) => (
                <Link key={l.id} href={`/admin/listings?approval=pending_approval`} className="px-6 py-4 hover:bg-blue-50/50 transition-colors duration-200 flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-700 truncate">{l.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${l.type === "art" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`}>
                        {l.type === "art" ? "Nghệ thuật" : "Phụ phẩm"}
                      </span>
                      <span className="text-xs text-stone-500">Người bán: {l.sellerId.slice(0, 8)}...</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                    <span className="text-sm font-bold text-stone-800">{fmt(l.price)}</span>
                    <svg className="w-4 h-4 text-stone-300 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
            <h3 className="font-semibold text-amber-900">Lịch sử đơn hàng</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Xem tất cả </Link>
          </div>
          <div className="h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" />
          {recentOrders.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">Chưa có đơn hàng</div>
          ) : (
            <div className="divide-y divide-sage-100/60">
              {recentOrders.map((order, i) => (
                <div key={order.id} className="px-6 py-4 hover:bg-emerald-50/30 transition-colors duration-200" style={{ animationDelay: `${600 + i * 80}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-stone-700 truncate">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{fmtTime(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-stone-800">{fmt(getOrderTotal(order))}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[order.status] || "bg-stone-100 text-stone-600"}`}>
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
        <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ animationDelay: '600ms' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
            <h3 className="font-semibold text-amber-900">Người dùng mới</h3>
            <Link href="/admin/users" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Xem tất cả </Link>
          </div>
          <div className="h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" />
          {recentUsers.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">Chưa có người dùng</div>
          ) : (
            <div className="divide-y divide-sage-100/60">
              {recentUsers.map((u, i) => (
                <div key={u.uid} className="px-6 py-4 flex items-center gap-3.5 hover:bg-emerald-50/30 transition-colors duration-200">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-emerald-500/20">
                    {(u.displayName || u.email || "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-700 truncate">{u.displayName || "Chưa có tên"}</p>
                    <p className="text-xs text-stone-400 truncate">{u.email}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    u.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-stone-100 text-stone-600"
                  }`}>
                    {u.role === "admin" ? "Admin" : "User"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Listings */}
        <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden xl:col-span-2" style={{ animationDelay: '700ms' }}>
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
            <h3 className="font-semibold text-amber-900">Tin đăng gần đây</h3>
            <Link href="/admin/listings" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Xem tất cả </Link>
          </div>
          <div className="h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" />
          {recentListings.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-sm">Chưa có tin đăng</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-sage-50/60 to-cream-50/40">
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Tiêu đề</th>
                    <th className="text-left px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Loại</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Giá</th>
                    <th className="text-center px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="text-right px-6 py-3.5 text-xs font-bold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-100/60">
                  {recentListings.map((l) => (
                    <tr key={l.id} className="hover:bg-emerald-50/30 transition-colors duration-200">
                      <td className="px-6 py-4 font-medium text-stone-700 truncate max-w-[200px]">{l.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${l.type === "art" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"}`}>
                          {l.type === "art" ? "Nghệ thuật" : "Phụ phẩm"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-stone-700">{fmt(l.price)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${l.status === "active" ? "bg-green-100 text-green-800" : l.status === "hidden" ? "bg-red-100 text-red-800" : "bg-stone-100 text-stone-600"}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${l.status === "active" ? "bg-green-500" : l.status === "hidden" ? "bg-red-400" : "bg-stone-400"}`} />
                          {l.status === "active" ? "Active" : l.status === "hidden" ? "Ẩn" : l.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-stone-500">{fmtDate(l.createdAt)}</td>
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
