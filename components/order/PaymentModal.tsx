'use client';

import React, { useState } from 'react';

interface PaymentModalProps {
  orderId: string;
  amount: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaymentModal({
  orderId,
  amount,
  isOpen,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'card' | 'momo' | 'bank'>('vnpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async () => {
    setIsProcessing(true);
    setError('');

    try {
      // Mock payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate payment success (90% success rate for demo)
      if (Math.random() > 0.1) {
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount,
            method: paymentMethod,
            status: 'success',
          }),
        });

        if (response.ok) {
          onSuccess();
        } else {
          throw new Error('Payment processing failed');
        }
      } else {
        throw new Error('Thanh toán thất bại. Vui lòng thử lại.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi thanh toán');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Thanh toán</h2>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Amount */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Số tiền cần thanh toán</p>
              <p className="text-4xl font-bold text-emerald-600">
                {amount.toLocaleString('vi-VN')} VNĐ
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-900">Chọn phương thức thanh toán:</label>

              {[
                { value: 'vnpay', label: '💳 VNPay', desc: 'Thẻ ngân hàng / Ví điện tử' },
                { value: 'card', label: '🏦 Thẻ tín dụng', desc: 'Visa / Mastercard' },
                { value: 'momo', label: '📱 Momo', desc: 'Ví điện tử Momo' },
                { value: 'bank', label: '🏛️ Chuyển khoản', desc: 'Ngân hàng trực tiếp' },
              ].map(method => (
                <label
                  key={method.value}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition ${
                    paymentMethod === method.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value as any)}
                    className="w-4 h-4 text-blue-500"
                    disabled={isProcessing}
                  />
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{method.label}</p>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Note */}
            <p className="text-xs text-gray-500 text-center">
              Này là DEMO. Thanh toán mô phỏng sẽ thành công (90% khả năng).
            </p>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Hủy
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 font-medium transition"
            >
              {isProcessing ? 'Đang xử lý...' : 'Thanh toán'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
