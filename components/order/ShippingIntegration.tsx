'use client';

import React, { useState, useEffect } from 'react';

interface ShippingOption {
  id: string;
  carrier: string;
  estimatedDays: number;
  cost: number;
  description: string;
}

interface ShippingFormProps {
  toDistrict: string;
  toCity: string;
  cartTotal: number;
  onSelect: (option: ShippingOption, totalCost: number) => void;
  selectedOption?: string;
}

export default function ShippingIntegration({
  toDistrict,
  toCity,
  cartTotal,
  onSelect,
  selectedOption,
}: ShippingFormProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchShippingOptions();
  }, [toDistrict, toCity]);

  const fetchShippingOptions = async () => {
    if (!toDistrict || !toCity) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toDistrict,
          toCity,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch shipping options');

      const data = await response.json();
      setOptions(data.options);

      // Auto-select default option
      if (data.options.length > 0 && !selectedOption) {
        onSelect(data.options[0], data.options[0].cost);
      }
    } catch (err) {
      setError('Không thể lấy giá vận chuyển');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (option: ShippingOption) => {
    onSelect(option, option.cost);
  };

  if (!toDistrict || !toCity) {
    return (
      <div className="bg-sage-50 rounded-lg p-4 text-center text-stone-500">
        Vui lòng chọn địa chỉ giao hàng trước
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-stone-800 mb-4"> Lựa chọn vận chuyển</h3>

      <div className="text-sm text-stone-500 mb-4">
        Giao tới: <span className="font-medium text-stone-800">{toDistrict}, {toCity}</span>
      </div>

      <div className="space-y-3">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => handleSelectOption(option)}
            className={`w-full p-4 rounded-lg border-2 text-left transition ${
              selectedOption === option.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-sage-200 hover:border-sage-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-stone-800">{option.carrier}</h4>
                <p className="text-sm text-stone-500">{option.description}</p>
                <p className="text-xs text-stone-400 mt-1">
                   Khoảng {option.estimatedDays > 0 ? `${option.estimatedDays}-${option.estimatedDays + 1}` : 'hôm nay'} ngày
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-orange-500">
                  {option.cost.toLocaleString('vi-VN')}đ
                </div>
                <div className="text-xs text-stone-500 mt-1">+ từ tổng giá</div>
              </div>
            </div>

            {/* Checkbox */}
            <div className="mt-3">
              <div
                className={`w-4 h-4 rounded border-2 ${
                  selectedOption === option.id ? 'bg-emerald-500 border-emerald-500' : 'border-sage-300'
                }`}
              ></div>
            </div>
          </button>
        ))}
      </div>

      {/* Price Breakdown */}
      {selectedOption && (
        <div className="mt-6 border-t pt-4">
          <div className="text-sm text-stone-500">
            <div className="flex justify-between py-1">
              <span>Tạm tính</span>
              <span className="font-medium text-stone-800">{cartTotal.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Phí vận chuyển</span>
              <span className="font-medium text-stone-800">
                +{options
                  .find(o => o.id === selectedOption)
                  ?.cost.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between py-2 border-t mt-2 pt-2">
              <span className="font-semibold text-stone-800">Tổng</span>
              <span className="text-lg font-bold text-orange-500">
                {(cartTotal + (options.find(o => o.id === selectedOption)?.cost || 0)).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
