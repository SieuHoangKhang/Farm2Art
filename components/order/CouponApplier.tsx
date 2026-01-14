'use client';

import React, { useState } from 'react';
import { Coupon } from '@/types/coupon';

interface CouponApplierProps {
  cartTotal: number;
  onApply: (coupon: Coupon, discountAmount: number) => void;
  appliedCoupon?: Coupon;
}

export default function CouponApplier({
  cartTotal,
  onApply,
  appliedCoupon,
}: CouponApplierProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [showAvailable, setShowAvailable] = useState(false);

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('Vui lòng nhập mã coupon');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/coupons?action=validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.toUpperCase(),
          totalAmount: cartTotal,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Mã coupon không hợp lệ');
        return;
      }

      setSuccessMessage(`Áp dụng thành công! Tiết kiệm ${data.discountAmount.toLocaleString('vi-VN')}đ`);
      onApply(data.coupon, data.discountAmount);
      setCode('');
    } catch (err) {
      setError('Lỗi khi xác nhận mã coupon');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchAvailable = async () => {
    try {
      const response = await fetch('/api/coupons?action=list');
      const coupons = await response.json();
      setAvailableCoupons(coupons);
      setShowAvailable(!showAvailable);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    }
  };

  const handleQuickApply = (coupon: Coupon) => {
    setCode(coupon.code);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">🎟️ Mã giảm giá</h3>

      {appliedCoupon && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-semibold text-green-900">{appliedCoupon.code}</p>
              <p className="text-sm text-green-700">{appliedCoupon.description}</p>
            </div>
            <button
              onClick={() => {
                setCode('');
                onApply(null as any, 0);
              }}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Nhập mã coupon"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!appliedCoupon}
          />
          <button
            onClick={handleValidate}
            disabled={loading || !!appliedCoupon}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition disabled:opacity-50"
          >
            {loading ? 'Đang kiểm tra...' : 'Áp dụng'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        <button
          onClick={handleFetchAvailable}
          className="w-full text-center text-sm text-blue-500 hover:text-blue-700 py-2"
        >
          {showAvailable ? '▼ Ẩn coupon có sẵn' : '▶ Xem coupon có sẵn'}
        </button>
      </div>

      {showAvailable && availableCoupons.length > 0 && (
        <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
          {availableCoupons.map(coupon => (
            <div
              key={coupon.id}
              className="bg-white border border-gray-300 rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition"
              onClick={() => handleQuickApply(coupon)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">{coupon.code}</p>
                  <p className="text-sm text-gray-600">{coupon.description}</p>
                </div>
                <span className="text-sm font-bold text-orange-500">
                  {coupon.type === 'percentage' ? `${coupon.value}%` : `${coupon.value.toLocaleString('vi-VN')}đ`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
