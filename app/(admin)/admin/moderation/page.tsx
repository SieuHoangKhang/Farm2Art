'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import type { Listing } from '@/types/listing';

export default function ModerationPage() {
  const [listings, setListings] = useState<(Listing & { reportCount: number; reason: string })[]>([]);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'hidden'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadListings();
  }, [filter]);

  const loadListings = async () => {
    try {
      // Mock data
      const mockListings: (Listing & { reportCount: number; reason: string })[] = [
        {
          id: 'list-001',
          type: 'byproduct',
          title: 'Sản phẩm nghi ngờ',
          description: 'Mô tả sản phẩm',
          price: 100000,
          sellerId: 'seller_001',
          ownerId: 'seller_001',
          images: [],
          status: 'draft',
          createdAt: Date.now(),
          reportCount: 3,
          reason: 'Hình ảnh không phù hợp',
        },
      ];
      setListings(mockListings);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      await fetch(`/api/admin-moderation/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'active' }),
      });
      setListings(listings.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Failed to approve:', error);
    }
  };

  const handleHide = async (listingId: string) => {
    try {
      await fetch(`/api/admin-moderation/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'hidden' }),
      });
      setListings(listings.filter(l => l.id !== listingId));
    } catch (error) {
      console.error('Failed to hide:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Duyệt nội dung" subtitle="Kiểm duyệt và ẩn bài đăng vi phạm." />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Chờ duyệt</p>
              <p className="text-3xl font-bold text-yellow-600">12</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Đã phê duyệt</p>
              <p className="text-3xl font-bold text-green-600">256</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-sm text-gray-600">Bị ẩn</p>
              <p className="text-3xl font-bold text-red-600">8</p>
            </CardBody>
          </Card>
        </div>

        {/* Listings */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : listings.length > 0 ? (
            <div className="space-y-4 p-6">
              {listings.map(listing => (
                <div key={listing.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Người bán: <strong>{listing.sellerId}</strong>
                      </p>
                    </div>
                    <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-xs font-bold">
                      🚩 {listing.reportCount} báo cáo
                    </span>
                  </div>

                  <div className="p-3 bg-red-50 rounded mb-3 border border-red-200">
                    <p className="text-sm text-red-700">
                      <strong>Lý do báo cáo:</strong> {listing.reason}
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(listing.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
                    >
                      ✓ Phê duyệt
                    </button>
                    <button
                      onClick={() => handleHide(listing.id)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm font-medium"
                    >
                      ✕ Ẩn bài
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              Không có bài đăng chờ duyệt
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
