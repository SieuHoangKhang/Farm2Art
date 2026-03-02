'use client';

import React, { useState } from 'react';

type PaymentMethodType = 'card' | 'bank' | 'ewallet' | 'installment';

interface PaymentOption {
  type: PaymentMethodType;
  name: string;
  icon: string;
  description: string;
  fee: number; // in percentage
}

interface PaymentMethodsProps {
  totalAmount: number;
  onSelect: (method: PaymentMethodType, fee: number) => void;
  selectedMethod?: PaymentMethodType;
}

export default function MultiplePaymentMethods({
  totalAmount,
  onSelect,
  selectedMethod,
}: PaymentMethodsProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState<PaymentMethodType>('card');

  const paymentOptions: PaymentOption[] = [
    {
      type: 'card',
      name: 'Thẻ tín dụng / Ghi nợ',
      icon: '💳',
      description: 'Visa, Mastercard, JCB',
      fee: 0,
    },
    {
      type: 'bank',
      name: 'Chuyển khoản ngân hàng',
      icon: '🏦',
      description: 'Chuyển trực tiếp từ tài khoản ngân hàng',
      fee: 0,
    },
    {
      type: 'ewallet',
      name: 'Ví điện tử',
      icon: '📱',
      description: 'Momo, Zalopay, Airpay',
      fee: 0.5,
    },
    {
      type: 'installment',
      name: 'Trả góp 0%',
      icon: '📅',
      description: 'Với các thẻ tín dụng',
      fee: 0,
    },
  ];

  const handleSelectMethod = (type: PaymentMethodType) => {
    setSelectedType(type);
    const option = paymentOptions.find(p => p.type === type);
    if (option) {
      onSelect(type, option.fee);
    }
  };

  const getFeeAmount = (fee: number) => {
    return Math.floor(totalAmount * (fee / 100));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      <h3 className="text-lg font-semibold text-stone-800">Chọn phương thức thanh toán</h3>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentOptions.map(option => {
          const fee = getFeeAmount(option.fee);
          const isSelected = selectedMethod === option.type;

          return (
            <button
              key={option.type}
              onClick={() => handleSelectMethod(option.type)}
              className={`p-4 rounded-lg border-2 text-left transition ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-sage-200 hover:border-sage-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-semibold text-stone-800">{option.name}</h4>
                      <p className="text-sm text-stone-500">{option.description}</p>
                    </div>
                  </div>
                </div>
                {fee > 0 && (
                  <span className="text-sm text-orange-600 font-medium">+{fee.toLocaleString('vi-VN')}đ</span>
                )}
              </div>
              <div className="mt-3">
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-sage-300'
                  }`}
                ></div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Payment Method Details */}
      {selectedType === 'card' && (
        <div className="bg-sage-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-stone-800">Thông tin thẻ</h4>
          <div>
            <label className="block text-sm font-medium text-stone-800 mb-1">Số thẻ</label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">MM/YY</label>
              <input
                type="text"
                placeholder="12/25"
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-800 mb-1">CVV</label>
              <input
                type="text"
                placeholder="123"
                className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {selectedType === 'bank' && (
        <div className="bg-sage-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-stone-800">Chọn ngân hàng</h4>
          <select className="w-full px-4 py-2 border border-sage-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option>Vietcombank (VCB)</option>
            <option>Techcombank (TCB)</option>
            <option>ACB (ACB)</option>
            <option>BIDV (BIDV)</option>
            <option>Agribank (AGR)</option>
          </select>
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg text-sm">
            ℹ️ Bạn sẽ được chuyển hướng tới trang ngân hàng của bạn để hoàn tất thanh toán
          </div>
        </div>
      )}

      {selectedType === 'ewallet' && (
        <div className="bg-sage-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-stone-800">Chọn ví điện tử</h4>
          <div className="grid grid-cols-3 gap-3">
            {['Momo', 'Zalopay', 'Airpay'].map(wallet => (
              <button
                key={wallet}
                className="px-4 py-2 border border-sage-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition font-medium text-sm"
              >
                {wallet}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedType === 'installment' && (
        <div className="bg-sage-50 rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-stone-800">Chọn kỳ hạn</h4>
          <div className="space-y-2">
            {[3, 6, 12].map(months => {
              const monthlyAmount = Math.floor(totalAmount / months);
              return (
                <button
                  key={months}
                  className="w-full px-4 py-3 border border-sage-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition text-left"
                >
                  <div className="font-medium text-stone-800">{months} kỳ</div>
                  <div className="text-sm text-stone-500">
                    {monthlyAmount.toLocaleString('vi-VN')}đ/tháng
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fee Summary */}
      {selectedMethod && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Phí thanh toán</span>
            <span className="font-semibold text-stone-800">
              +{getFeeAmount(
                paymentOptions.find(p => p.type === selectedMethod)?.fee || 0
              ).toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="flex justify-between items-center mt-2 pt-2 border-t">
            <span className="font-semibold text-stone-800">Tổng thanh toán</span>
            <span className="text-2xl font-bold text-orange-500">
              {(
                totalAmount +
                getFeeAmount(paymentOptions.find(p => p.type === selectedMethod)?.fee || 0)
              ).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
