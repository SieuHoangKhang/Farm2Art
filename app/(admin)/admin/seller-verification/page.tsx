"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy, getDoc,
} from "firebase/firestore";
import type { SellerVerification, VerificationStatus } from "@/types/seller";

const STATUS_MAP: Record<VerificationStatus, { label: string; color: string }> = {
  pending:  { label: "Chờ duyệt",      color: "bg-amber-50 text-amber-700 border-amber-200" },
  approved: { label: "Đã phê duyệt",   color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  rejected: { label: "Bị từ chối",      color: "bg-red-50 text-red-700 border-red-200" },
  none:     { label: "Chưa gửi",        color: "bg-stone-50 text-stone-500 border-stone-200" },
};

export default function AdminSellerVerificationPage() {
  const [items, setItems] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | VerificationStatus>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const snap = await getDocs(query(collection(firebaseDb, "sellerVerifications"), orderBy("documentSubmittedAt", "desc")));
      setItems(snap.docs.map((d) => ({ sellerId: d.id, ...d.data() } as SellerVerification)));
    } catch (err) {
      console.error("Load verification error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function approve(sellerId: string) {
    try {
      setSaving(sellerId);
      const data = { status: "approved" as VerificationStatus, approvedAt: Date.now(), verificationBadge: true };
      await updateDoc(doc(firebaseDb, "sellerVerifications", sellerId), data);
      // Also update the user doc if it exists
      const userRef = doc(firebaseDb, "users", sellerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, { sellerVerified: true, role: "seller" });
      }
      setItems((prev) => prev.map((v) => v.sellerId === sellerId ? { ...v, ...data } : v));
      showToast("Đã phê duyệt seller");
    } catch (err) {
      console.error(err);
      showToast("Lỗi phê duyệt");
    } finally {
      setSaving(null);
    }
  }

  async function reject(sellerId: string) {
    const reason = prompt("Lý do từ chối:");
    if (reason === null) return; // cancelled
    try {
      setSaving(sellerId);
      const data = { status: "rejected" as VerificationStatus, rejectionReason: reason || "Không đạt yêu cầu" };
      await updateDoc(doc(firebaseDb, "sellerVerifications", sellerId), data);
      setItems((prev) => prev.map((v) => v.sellerId === sellerId ? { ...v, ...data } : v));
      showToast("Đã từ chối yêu cầu");
    } catch (err) {
      console.error(err);
      showToast("Lỗi từ chối");
    } finally {
      setSaving(null);
    }
  }

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }
  const fmtDate = (ts?: number) => ts ? new Date(ts).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

  const filtered = items.filter((v) => filter === "all" || v.status === filter);
  const counts: Record<string, number> = { all: items.length };
  items.forEach((v) => { counts[v.status] = (counts[v.status] || 0) + 1; });

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-stone-200 rounded-lg w-56" />
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-stone-200" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-800 text-white px-4 py-2.5 rounded-xl text-sm shadow-lg">{toast}</div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-stone-800 tracking-tight">Xác minh Seller</h1>
        <p className="text-sm text-stone-500 mt-0.5">{items.length} yêu cầu — {counts["pending"] || 0} đang chờ duyệt</p>
      </div>

      {/* Pending alert */}
      {(counts["pending"] || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-800">Có <span className="font-bold">{counts["pending"]}</span> yêu cầu xác minh đang chờ phê duyệt</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1.5 bg-white rounded-xl border border-stone-200 p-1 w-fit">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === s ? "bg-emerald-500 text-white shadow-sm" : "text-stone-600 hover:bg-stone-50"}`}>
            {s === "all" ? "Tất cả" : STATUS_MAP[s].label}
            <span className="ml-1 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      {/* Verification cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200/80 py-12 text-center text-stone-400 text-sm">Không có yêu cầu xác minh</div>
        ) : filtered.map((v) => (
          <div key={v.sellerId} className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden">
            {/* Header row */}
            <button onClick={() => setExpandedId(expandedId === v.sellerId ? null : v.sellerId)} className="w-full px-5 py-4 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left hover:bg-stone-50/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-stone-700">{v.businessName || "Chưa có tên"}</p>
                  {v.verificationBadge && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5">{v.ownerName} — {v.phone || "N/A"}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border ${STATUS_MAP[v.status].color}`}>
                  {STATUS_MAP[v.status].label}
                </span>
                <span className="text-xs text-stone-400">{fmtDate(v.documentSubmittedAt)}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform ${expandedId === v.sellerId ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {expandedId === v.sellerId && (
              <div className="border-t border-stone-100 px-5 py-4 space-y-4 bg-stone-50/30">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div><p className="text-stone-400">Seller ID</p><p className="text-stone-700 font-mono mt-0.5 break-all">{v.sellerId}</p></div>
                  <div><p className="text-stone-400">Tên doanh nghiệp</p><p className="text-stone-700 font-medium mt-0.5">{v.businessName || "—"}</p></div>
                  <div><p className="text-stone-400">Chủ sở hữu</p><p className="text-stone-700 font-medium mt-0.5">{v.ownerName || "—"}</p></div>
                  <div><p className="text-stone-400">Điện thoại</p><p className="text-stone-700 mt-0.5">{v.phone || "—"}</p></div>
                  <div><p className="text-stone-400">Email</p><p className="text-stone-700 mt-0.5 break-all">{v.email || "—"}</p></div>
                  <div><p className="text-stone-400">Địa chỉ</p><p className="text-stone-700 mt-0.5">{v.businessAddress || "—"}</p></div>
                  <div><p className="text-stone-400">Ngân hàng</p><p className="text-stone-700 mt-0.5">{v.bankName || "—"} — {v.bankAccount || "—"}</p></div>
                  <div><p className="text-stone-400">ĐKKD</p><p className="text-stone-700 mt-0.5 truncate">{v.businessRegistration ? <a href={v.businessRegistration} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Xem tài liệu</a> : "—"}</p></div>
                  <div><p className="text-stone-400">CMND/CCCD</p><p className="text-stone-700 mt-0.5 truncate">{v.ownerID ? <a href={v.ownerID} target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Xem tài liệu</a> : "—"}</p></div>
                </div>

                {v.rejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
                    <span className="font-semibold">Lý do từ chối:</span> {v.rejectionReason}
                  </div>
                )}

                {v.approvedAt && (
                  <p className="text-xs text-emerald-600">Phê duyệt ngày: {fmtDate(v.approvedAt)}</p>
                )}

                {/* Actions */}
                {v.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => approve(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm">
                      Phê duyệt
                    </button>
                    <button onClick={() => reject(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-4 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors">
                      Từ chối
                    </button>
                  </div>
                )}
                {v.status === "rejected" && (
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => approve(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm">
                      Phê duyệt lại
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
