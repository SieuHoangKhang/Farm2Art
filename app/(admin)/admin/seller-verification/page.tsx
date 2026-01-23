'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import type { SellerVerification } from '@/types/seller';

export default function SellerVerificationPage() {
  const [verifications, setVerifications] = useState<SellerVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    loadVerifications();
  }, []);

  const loadVerifications = async () => {
    try {
      // Mock data
      const mockVerifications: SellerVerification[] = [
        {
          sellerId: 'seller_001',
          status: 'pending',
          businessName: 'Farm Tây Ninh',
          businessRegistration: 'https://...',
          ownerName: 'Nguyễn Văn A',
          ownerID: 'https://...',
          bankAccount: '123456789',
          bankName: 'Vietcombank',
          businessAddress: '123 Đường Tây Ninh',
          phone: '0123456789',
          email: 'farm_taynin@example.com',
          documentSubmittedAt: Date.now() - 1000 * 60 * 60 * 24,
        },
        {
          sellerId: 'seller_002',
          status: 'approved',
          businessName: 'Recycled Art Studio',
          businessRegistration: 'https://...',
          ownerName: 'Trần Thị B',
          ownerID: 'https://...',
          bankAccount: '987654321',
          bankName: 'ACB',
          businessAddress: '456 Đường B, TP.HCM',
          phone: '0987654321',
          email: 'recycled_art@example.com',
          documentSubmittedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
          approvedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
          verificationBadge: true,
        },
      ];
      setVerifications(mockVerifications);
    } catch (error) {
      console.error('Failed to load verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sellerId: string) => {
    try {
      const response = await fetch(`/api/seller-verification/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        setVerifications(
          verifications.map(v =>
            v.sellerId === sellerId
              ? { ...v, status: 'approved', approvedAt: Date.now(), verificationBadge: true }
              : v
          )
        );
      }
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  const handleReject = async (sellerId: string) => {
    try {
      const reason = prompt('Lý do từ chối (optional):');
      const response = await fetch(`/api/seller-verification/${sellerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: reason || 'Từ chối không kèm lý do',
        }),
      });

      if (response.ok) {
        setVerifications(
          verifications.map(v =>
            v.sellerId === sellerId
              ? {
                  ...v,
                  status: 'rejected',
                  rejectionReason: reason || 'Từ chối',
                }
              : v
          )
        );
      }
    } catch (error) {
      console.error('Rejection failed:', error);
    }
  };

  const filtered = verifications.filter(v =>
    filter === 'all' ? true : v.status === filter
  );

  const getStatusColor = (status: SellerVerification['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: SellerVerification['status']) => {
    switch (status) {
      case 'approved':
        return '✓ Đã phê duyệt';
      case 'rejected':
        return '✗ Bị từ chối';
      case 'pending':
        return '⏳ Chờ duyệt';
      default:
        return '?';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Xác minh người bán"
        subtitle="Quản lý yêu cầu xác minh tài khoản người bán"
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {f === 'all' && 'Tất cả'}
              {f === 'pending' && `Chờ duyệt (${verifications.filter(v => v.status === 'pending').length})`}
              {f === 'approved' && `Đã phê duyệt (${verifications.filter(v => v.status === 'approved').length})`}
              {f === 'rejected' && `Bị từ chối (${verifications.filter(v => v.status === 'rejected').length})`}
            </button>
          ))}
        </div>

        {/* Verifications List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(verification => (
              <Card key={verification.sellerId}>
                <CardBody>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Info */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Cửa hàng</p>
                      <p className="font-semibold text-gray-900">
                        {verification.businessName}
                      </p>
                      <p className="text-sm text-gray-600">{verification.ownerName}</p>
                    </div>

                    {/* Contact */}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Liên hệ</p>
                      <p className="font-mono text-sm text-gray-900">{verification.phone}</p>
                      <p className="text-sm text-gray-600 truncate">
                        {verification.email}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Trạng thái</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          verification.status
                        )}`}
                      >
                        {getStatusLabel(verification.status)}
                      </span>
                      {verification.documentSubmittedAt && (
                        <p className="text-xs text-gray-600 mt-2">
                          Nộp: {new Date(verification.documentSubmittedAt).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 justify-end">
                      {verification.status === 'pending' && (
                        <>
                          <Button
                            onClick={() => handleApprove(verification.sellerId)}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm"
                          >
                            ✓ Phê duyệt
                          </Button>
                          <Button
                            onClick={() => handleReject(verification.sellerId)}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm"
                          >
                            ✗ Từ chối
                          </Button>
                        </>
                      )}
                      {verification.status !== 'pending' && (
                        <a
                          href={`#verify-${verification.sellerId}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Xem chi tiết
                        </a>
                      )}
                    </div>
                  </div>

                  {verification.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">
                        <strong>Lý do từ chối:</strong> {verification.rejectionReason}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">Không có yêu cầu xác minh cho bộ lọc này</p>
          </div>
        )}
      </div>
    </div>
  );
}
