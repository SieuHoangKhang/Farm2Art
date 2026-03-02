"use client";

import { useEffect, useState } from "react";
import { firebaseDb } from "@/lib/firebase/client";
import {
  collection, getDocs, doc, updateDoc, query, orderBy, getDoc,
} from "firebase/firestore";
import type { SellerVerification, VerificationStatus } from "@/types/seller";

const STATUS_MAP: Record<VerificationStatus, { label: string; color: string }> = {
  pending:  { label: "Chờ duyệt",      color: "bg-yellow-100 text-yellow-800" },
  approved: { label: "Đã phê duyệt",   color: "bg-green-100 text-green-800" },
  rejected: { label: "Bị từ chối",      color: "bg-red-100 text-red-800" },
  none:     { label: "Chưa gửi",        color: "bg-stone-100 text-stone-600" },
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
    if (reason === null) return;
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
      <div className="space-y-6 animate-pulse">
        <div className="h-36 rounded-2xl bg-emerald-100/50" />
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/80 rounded-2xl border border-sage-200" />)}
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Xác minh Seller</h1>
          <div className="h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-emerald-400 mt-3" />
          <p className="text-sm text-emerald-100/70 mt-3">{items.length} yêu cầu — {counts["pending"] || 0} đang chờ duyệt</p>
        </div>
      </div>

      {/* Pending alert */}
      {(counts["pending"] || 0) > 0 && (
        <div className="animate-fadeInUp bg-gradient-to-r from-amber-50 to-cream-50 border border-amber-200/80 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm" style={{ animationDelay: '100ms' }}>
          <div className="p-2 rounded-xl bg-amber-100">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-amber-800 font-medium">Có <span className="font-extrabold">{counts["pending"]}</span> yêu cầu xác minh đang chờ phê duyệt</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 p-1.5 w-fit animate-fadeInUp" style={{ animationDelay: '150ms' }}>
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${filter === s ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/20" : "text-stone-600 hover:bg-emerald-50/60 hover:text-emerald-700"}`}>
            {s === "all" ? "Tất cả" : STATUS_MAP[s].label}
            <span className="ml-1.5 opacity-70">({counts[s] || 0})</span>
          </button>
        ))}
      </div>

      {/* Verification cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 py-16 text-center text-stone-400 text-sm shadow-sm">Không có yêu cầu xác minh</div>
        ) : filtered.map((v, i) => (
          <div key={v.sellerId} className="animate-fadeInUp bg-white/90 backdrop-blur-sm rounded-2xl border border-sage-200/80 shadow-sm hover:shadow-lg hover:border-emerald-200/60 transition-all duration-300 overflow-hidden" style={{ animationDelay: `${200 + i * 60}ms` }}>
            {/* Header row */}
            <button onClick={() => setExpandedId(expandedId === v.sellerId ? null : v.sellerId)} className="w-full px-6 py-5 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 text-left hover:bg-emerald-50/20 transition-colors duration-200">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <p className="text-sm font-bold text-stone-800">{v.businessName || "Chưa có tên"}</p>
                  {v.verificationBadge && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-green-100 rounded-full px-2 py-0.5">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400 mt-0.5 font-medium">{v.ownerName} — {v.phone || "N/A"}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[v.status].color}`}>
                  {STATUS_MAP[v.status].label}
                </span>
                <span className="text-xs text-stone-400 font-medium">{fmtDate(v.documentSubmittedAt)}</span>
                <svg className={`w-4 h-4 text-stone-400 transition-transform duration-300 ${expandedId === v.sellerId ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded content */}
            {expandedId === v.sellerId && (
              <div className="border-t border-sage-100/60 px-6 py-5 space-y-5 bg-gradient-to-b from-emerald-50/20 to-cream-50/20">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  {[
                    { label: "Seller ID", value: v.sellerId, mono: true },
                    { label: "Tên doanh nghiệp", value: v.businessName || "—" },
                    { label: "Chủ sở hữu", value: v.ownerName || "—" },
                    { label: "Điện thoại", value: v.phone || "—" },
                    { label: "Email", value: v.email || "—", break: true },
                    { label: "Địa chỉ", value: v.businessAddress || "—" },
                    { label: "Ngân hàng", value: `${v.bankName || "—"} — ${v.bankAccount || "—"}` },
                  ].map((f, idx) => (
                    <div key={idx} className="bg-white/60 rounded-xl p-3 border border-sage-100">
                      <p className="text-stone-400 font-medium">{f.label}</p>
                      <p className={`text-stone-700 mt-1 font-semibold ${f.mono ? "font-mono text-[11px] break-all" : ""} ${f.break ? "break-all" : ""}`}>{f.value}</p>
                    </div>
                  ))}
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">ĐKKD</p>
                    <p className="mt-1">{v.businessRegistration ? <a href={v.businessRegistration} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:text-emerald-700 underline decoration-emerald-300 transition-colors">Xem tài liệu</a> : <span className="text-stone-400">—</span>}</p>
                  </div>
                  <div className="bg-white/60 rounded-xl p-3 border border-sage-100">
                    <p className="text-stone-400 font-medium">CMND/CCCD</p>
                    <p className="mt-1">{v.ownerID ? <a href={v.ownerID} target="_blank" rel="noopener noreferrer" className="text-emerald-600 font-semibold hover:text-emerald-700 underline decoration-emerald-300 transition-colors">Xem tài liệu</a> : <span className="text-stone-400">—</span>}</p>
                  </div>
                </div>

                {v.rejectionReason && (
                  <div className="bg-red-50 border border-red-200/80 rounded-xl px-4 py-3 text-xs">
                    <span className="font-bold text-red-700">Lý do từ chối:</span>
                    <span className="text-red-600 ml-1">{v.rejectionReason}</span>
                  </div>
                )}

                {v.approvedAt && (
                  <p className="text-xs text-emerald-600 font-semibold">Phê duyệt ngày: {fmtDate(v.approvedAt)}</p>
                )}

                {/* Actions */}
                {v.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => approve(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]">
                      Phê duyệt
                    </button>
                    <button onClick={() => reject(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]">
                      Từ chối
                    </button>
                  </div>
                )}
                {v.status === "rejected" && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => approve(v.sellerId)} disabled={saving === v.sellerId}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 transition-all duration-200 active:scale-[0.97]">
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
