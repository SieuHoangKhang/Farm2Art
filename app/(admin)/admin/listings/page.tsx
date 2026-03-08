"use client";

import { useEffect, useState, Fragment } from "react";
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
  const [approvalFilter, setApprovalFilter] = useState<"all" | "pending_approval" | "approved" | "rejected">("pending_approval");
  const [toast, setToast] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("");
  const [showRejectDialog, setShowRejectDialog] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  async function approveListing(id: string) {
    try {
      setSaving(id);
      const response = await fetch(`/api/admin/listings/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "approve" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi duyệt");
      setListings((prev) => prev.map((l) => l.id === id 
        ? { ...l, approvalStatus: "approved", status: "active" } 
        : l
      ));
      showToast("✅ Đơn hàng đã được duyệt!");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi duyệt tin đăng");
    } finally {
      setSaving(null);
    }
  }

  async function rejectListing(id: string, reason: string) {
    try {
      setSaving(id);
      const response = await fetch(`/api/admin/listings/approval`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "reject", rejectionReason: reason }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lỗi từ chối");
      setListings((prev) => prev.map((l) => l.id === id 
        ? { ...l, approvalStatus: "rejected", status: "inactive" } 
        : l
      ));
      showToast("✅ Tin đăng đã bị từ chối");
      setShowRejectDialog(null);
      setRejectReason("");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi từ chối tin đăng");
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

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function loadSellerDetails(sellerId: string) {
    setLoadingDetails(true);
    try {
      // Load seller info
      const { doc: fDoc, getDoc } = await import("firebase/firestore");
      const sellerRef = fDoc(firebaseDb, "users", sellerId);
      const sellerSnap = await getDoc(sellerRef);
      setSellerInfo(sellerSnap.exists() ? sellerSnap.data() : null);

      // Load seller reviews (without orderBy to avoid needing composite index)
      const { collection: fCollection, getDocs: fGetDocs, query: fQuery, where } = await import("firebase/firestore");
      const reviewsSnap = await fGetDocs(fQuery(
        fCollection(firebaseDb, "reviews"),
        where("sellerId", "==", sellerId)
      ));
      const reviews = reviewsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      // Sort by createdAt on client side
      reviews.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setSellerReviews(reviews);
    } catch (err) {
      console.error("Load seller details error:", err);
    } finally {
      setLoadingDetails(false);
    }
  }

  function toggleExpanded(listingId: string, sellerId: string) {
    if (expandedId === listingId) {
      setExpandedId(null);
    } else {
      setExpandedId(listingId);
      loadSellerDetails(sellerId);
    }
  }

  const fmt = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
  const fmtDate = (ts: number) => new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const filtered = listings.filter((l) => {
    const matchSearch = search === "" || l.title.toLowerCase().includes(search.toLowerCase()) || l.sellerId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    const matchType = typeFilter === "all" || l.type === typeFilter;
    const matchApproval = approvalFilter === "all" || l.approvalStatus === approvalFilter;
    return matchSearch && matchStatus && matchType && matchApproval;
  });

  const statusCounts: Record<string, number> = { all: listings.length, active: 0, hidden: 0, draft: 0, inactive: 0 };
  const approvalCounts: Record<string, number> = { all: listings.length, pending_approval: 0, approved: 0, rejected: 0 };
  listings.forEach((l) => { 
    statusCounts[l.status] = (statusCounts[l.status] || 0) + 1;
    approvalCounts[l.approvalStatus || "all"] = (approvalCounts[l.approvalStatus || "all"] || 0) + 1;
  });

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
      {toast && (
        <div className="fixed top-4 right-4 z-50 glass-dark text-white px-5 py-3 rounded-2xl text-sm shadow-xl animate-fadeInDown font-medium">{toast}</div>
      )}

      {/* Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 px-6 md:px-8 py-8 shadow-lg overflow-hidden animate-fadeInUp">
        <div className="absolute inset-0 pattern-dots opacity-10" />
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/80 mb-2">Quản lý</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Tin đăng</h1>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
          <p className="text-sm text-emerald-100/70 mt-3">{listings.length} tin đăng trong hệ thống</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 animate-fadeInUp" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text" placeholder="Tìm theo tiêu đề, seller ID..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl border border-sage-300 bg-white/90 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        {/* Approval Status Filter */}
        <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-1.5">
          {(["pending_approval", "approved", "rejected", "all"] as const).map((a) => (
            <button key={a} onClick={() => setApprovalFilter(a)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${approvalFilter === a ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-500/20" : "text-stone-600 hover:bg-blue-50/60 hover:text-blue-700"}`}>
              {a === "pending_approval" ? "⏳ Chờ duyệt" : a === "approved" ? "✅ Đã duyệt" : a === "rejected" ? "❌ Từ chối" : "Tất cả"}
              <span className="ml-1.5 opacity-70">({approvalCounts[a] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden" style={{ animationDelay: '200ms' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-50/80 via-white to-cream-50/60">
                <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Tin đăng</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Loại</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Seller</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Giá</th>
                <th className="text-center px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Trạng thái</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right px-6 py-4 text-xs font-bold text-stone-500 uppercase tracking-wider">Thao tác</th>
              </tr>
              <tr><td colSpan={7}><div className="h-px bg-gradient-to-r from-emerald-300/40 via-amber-300/30 to-transparent" /></td></tr>
            </thead>
            <tbody className="divide-y divide-sage-100/60">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-stone-400 text-sm">Không tìm thấy tin đăng</td></tr>
              ) : filtered.map((l) => (
                <Fragment key={l.id}>
                  <tr className="hover:bg-emerald-50/30 transition-colors duration-200 group">
                    <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-stone-700 truncate max-w-[240px]">{l.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[240px]">{l.description?.slice(0, 60) || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${l.type === "art" ? "bg-purple-100 text-purple-800" : "bg-amber-100 text-amber-800"}`}>
                      {l.type === "art" ? "Nghệ thuật" : "Phụ phẩm"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs text-stone-500 bg-stone-50 px-2 py-1 rounded-lg">{l.sellerId?.slice(0, 12) || "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-bold text-stone-800">{fmt(l.price)}</span>
                    {l.unit && <span className="text-xs text-stone-400 ml-1">/{l.unit}</span>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                      l.status === "active" ? "bg-green-100 text-green-800" :
                      l.status === "hidden" ? "bg-red-100 text-red-800" :
                      "bg-stone-100 text-stone-600"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${l.status === "active" ? "bg-green-500" : l.status === "hidden" ? "bg-red-400" : "bg-stone-400"}`} />
                      {l.status === "active" ? "Active" : l.status === "hidden" ? "Ẩn" : l.status === "draft" ? "Nháp" : l.status}
                    </span>
                    {l.approvalStatus && (
                      <div className="text-xs mt-2">
                        {l.approvalStatus === "pending_approval" ? (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">⏳ Chờ duyệt</span>
                        ) : l.approvalStatus === "approved" ? (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">✅ Đã duyệt</span>
                        ) : (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full">❌ Từ chối</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-stone-500 font-medium">
                    {typeof l.createdAt === "number" ? fmtDate(l.createdAt) : "—"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                      {l.approvalStatus === "pending_approval" ? (
                        <>
                          <button
                            onClick={() => toggleExpanded(l.id, l.sellerId)}
                            disabled={saving === l.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition-all duration-200"
                          >
                            {expandedId === l.id ? "▼ Ẩn" : "▶ Chi tiết"}
                          </button>
                          <button
                            onClick={() => approveListing(l.id)}
                            disabled={saving === l.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-all duration-200"
                          >
                            ✅ Duyệt
                          </button>
                          <button
                            onClick={() => setShowRejectDialog(l.id)}
                            disabled={saving === l.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-all duration-200"
                          >
                            ❌ Từ chối
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => toggleStatus(l.id, l.status)}
                            disabled={saving === l.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-sage-300 bg-white text-stone-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50 transition-all duration-200"
                          >
                            {l.status === "active" ? "Ẩn" : "Hiện"}
                          </button>
                          <button
                            onClick={() => deleteListing(l.id)}
                            disabled={saving === l.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all duration-200"
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                      </tr>
                  
                  {/* Expand Details */}
                  {expandedId === l.id && (
                    <tr className="bg-blue-50/50 border-t-2 border-blue-200">
                      <td colSpan={7} className="px-6 py-6">
                        <div className="grid md:grid-cols-2 gap-8">
                          {/* Seller Info */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-stone-900 text-base">👤 Thông tin người bán</h4>
                            {loadingDetails ? (
                              <div className="text-sm text-stone-500">Đang tải...</div>
                            ) : sellerInfo ? (
                              <div className="space-y-3 bg-white p-4 rounded-lg border border-blue-200">
                                <div>
                                  <p className="text-xs text-stone-500 font-semibold">Tên hiển thị</p>
                                  <p className="text-sm text-stone-800 font-medium">{sellerInfo.displayName || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-500 font-semibold">Email</p>
                                  <p className="text-sm text-stone-800 break-all">{sellerInfo.email || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-500 font-semibold">Điện thoại</p>
                                  <p className="text-sm text-stone-800 font-medium">{sellerInfo.phone || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-500 font-semibold">Xác minh</p>
                                  <p className="text-sm">
                                    {sellerInfo.sellerVerified ? (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">✅ Đã xác minh</span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">❌ Chưa xác minh</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-stone-500 font-semibold">Trạng thái tài khoản</p>
                                  <p className="text-sm">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                      sellerInfo.accountStatus === "active" ? "bg-green-100 text-green-700" :
                                      sellerInfo.accountStatus === "suspended" ? "bg-red-100 text-red-700" :
                                      "bg-stone-100 text-stone-700"
                                    }`}>
                                      {sellerInfo.accountStatus === "active" ? "✅ Hoạt động" :
                                       sellerInfo.accountStatus === "suspended" ? "🔒 Bị khóa" :
                                       "❓ Không xác định"
                                      }
                                    </span>
                                  </p>
                                </div>
                                {sellerInfo.businessName && (
                                  <div>
                                    <p className="text-xs text-stone-500 font-semibold">Tên kinh doanh</p>
                                    <p className="text-sm text-stone-800 font-medium">{sellerInfo.businessName}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-stone-500">Không tìm thấy thông tin</div>
                            )}
                          </div>

                          {/* Seller Reviews */}
                          <div className="space-y-4">
                            <h4 className="font-bold text-stone-900 text-base">⭐ Đánh giá ({sellerReviews.length})</h4>
                            {loadingDetails ? (
                              <div className="text-sm text-stone-500">Đang tải...</div>
                            ) : sellerReviews.length > 0 ? (
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {sellerReviews.slice(0, 5).map((review: any) => (
                                  <div key={review.id} className="bg-white p-3 rounded-lg border border-blue-200 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-1">
                                        {[...Array(5)].map((_, i) => (
                                          <span key={i} className={i < (review.rating || 0) ? "text-yellow-400 text-lg" : "text-stone-300 text-lg"}>
                                            ★
                                          </span>
                                        ))}
                                      </div>
                                      <p className="text-xs text-stone-400">
                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString("vi-VN") : "—"}
                                      </p>
                                    </div>
                                    <p className="text-sm text-stone-800">{review.comment || "—"}</p>
                                    <p className="text-xs text-stone-500">Từ: {review.buyerName || review.buyerId?.slice(0, 8)}...</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-stone-500">Chưa có đánh giá</div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-fadeIn">
            <h3 className="text-lg font-bold text-stone-900">❌ Từ chối tin đăng</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Nhập lý do từ chối (tùy chọn)..."
              className="w-full h-24 p-3 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectDialog(null);
                  setRejectReason("");
                }}
                disabled={saving === showRejectDialog}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => rejectListing(showRejectDialog, rejectReason)}
                disabled={saving === showRejectDialog}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
