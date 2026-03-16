'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { Container } from '@/components/ui/Container';
import { ListingCard } from '@/components/listing/ListingCard';
import { useAuthUser } from '@/lib/auth/useAuthUser';
import { firebaseDb } from '@/lib/firebase/client';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import type { Listing } from '@/types/listing';
import type { AppUser } from '@/types/user';

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params.sellerId as string;
  const { user } = useAuthUser();

  const [sellerData, setSellerData] = useState<AppUser | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'about'>('listings');

  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    if (sellerId) loadAll();
  }, [sellerId]);

  async function loadAll() {
    setLoading(true);
    try {
      // Load seller info from Firestore
      const userRef = doc(firebaseDb, 'users', sellerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setSellerData({ uid: userSnap.id, ...userSnap.data() } as AppUser);
      }

      // Load seller's listings
      const listingsRef = collection(firebaseDb, 'listings');
      const listingsQuery = query(listingsRef, where('sellerId', '==', sellerId), where('status', '==', 'active'));
      const listingsSnap = await getDocs(listingsQuery);
      setListings(listingsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Listing)));

    } catch (err) {
      console.error('Load seller page error:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!sellerData) {
    return (
      <div className="py-20 text-center">
        <p className="text-stone-500 text-lg mb-4">Không tìm thấy người bán</p>
        <Link href="/search" className="text-emerald-600 hover:text-emerald-700 font-medium">
          ← Quay lại tìm kiếm
        </Link>
      </div>
    );
  }

  const displayName = sellerData.displayName || sellerData.email || 'Người bán';
  const joinDate = sellerData.createdAt ? new Date(sellerData.createdAt).toLocaleDateString('vi-VN') : '';

  return (
    <div>
      <PageHeader title={displayName} subtitle="Trang hồ sơ người bán" />

      <Container>
        <div className="py-8">
          {/* Seller Info Card */}
          <div className="bg-white rounded-2xl border border-sage-200/70 shadow-sm p-6 md:p-8 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Avatar & Name */}
              <div className="flex flex-col items-center">
                {sellerData.avatarUrl ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-emerald-100 mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sellerData.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-3xl text-white font-bold mb-4 ring-4 ring-emerald-100">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <h1 className="text-xl font-bold text-stone-800 text-center">{displayName}</h1>
                {sellerData.sellerVerified && (
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    ✓ Đã xác minh
                  </span>
                )}
                {joinDate && <p className="text-xs text-stone-400 mt-2">Tham gia: {joinDate}</p>}
              </div>

              {/* Ratings */}
              {/* Stats */}
              <div className="border-t md:border-t-0 pt-4 md:pt-0 flex flex-col justify-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Sản phẩm đang bán</p>
                    <p className="text-lg font-bold text-stone-800">{listings.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-stone-400">Sản phẩm đã đăng</p>
                    <p className="text-lg font-bold text-stone-800">{listings.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-sage-200">
              <p className="text-sm text-stone-600 text-center">Trang này chỉ hiển thị sản phẩm đang bán của người bán.</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-sage-200/70 shadow-sm overflow-hidden">
            <div className="flex border-b border-sage-200">
              {[
                { key: 'listings', label: `Sản phẩm (${listings.length})` },
                { key: 'about', label: 'Giới thiệu' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`flex-1 py-3.5 px-4 font-medium text-center border-b-2 transition text-sm ${
                    activeTab === tab.key
                      ? 'text-emerald-600 border-emerald-500 bg-emerald-50/40'
                      : 'text-stone-500 border-transparent hover:text-stone-800 hover:bg-stone-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Listings Tab */}
              {activeTab === 'listings' && (
                listings.length === 0 ? (
                  <div className="text-center py-12 text-stone-400">
                    <p className="text-lg mb-1">Chưa có sản phẩm</p>
                    <p className="text-sm">Người bán này chưa đăng sản phẩm nào.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map(l => (
                      <ListingCard key={l.id} listing={l} />
                    ))}
                  </div>
                )
              )}

              {/* Reviews Tab */}
              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="font-semibold text-stone-800 mb-2">Thông tin người bán</h3>
                    <div className="space-y-2 text-sm text-stone-600">
                      <p>👤 <strong>Tên:</strong> {displayName}</p>
                      {sellerData.phone && <p>📱 <strong>SĐT:</strong> {sellerData.phone}</p>}
                      {sellerData.city && <p>📍 <strong>Thành phố:</strong> {sellerData.city}</p>}
                      {sellerData.district && <p>🏘️ <strong>Quận/Huyện:</strong> {sellerData.district}</p>}
                      {joinDate && <p>📅 <strong>Ngày gia nhập:</strong> {joinDate}</p>}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-stone-800 mb-2">Chính sách</h3>
                    <ul className="space-y-1.5 text-stone-600 text-sm">
                      <li>✅ Hỗ trợ tư vấn miễn phí</li>
                      <li>✅ Đóng gói chuyên nghiệp</li>
                      <li>✅ Giao hàng an toàn</li>
                      <li>✅ Hỗ trợ trước/sau bán hàng</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
