'use client';

import React, { useState, useEffect } from 'react';

export interface OrderTrackingStep {
  status: 'pending' | 'confirmed' | 'shipped' | 'in-transit' | 'delivered' | 'cancelled';
  label: string;
  description: string;
  timestamp?: number;
  icon: string;
}

interface OrderTrackingProps {
  orderId: string;
  currentStatus: OrderTrackingStep['status'];
  steps?: OrderTrackingStep[];
  estimatedDelivery?: number;
}

export default function OrderTracking({ 
  orderId, 
  currentStatus, 
  steps,
  estimatedDelivery 
}: OrderTrackingProps) {
  const defaultSteps: OrderTrackingStep[] = [
    {
      status: 'pending',
      label: 'Chờ xác nhận',
      description: 'Đơn hàng đang chờ xác nhận từ người bán',
      icon: '📋',
    },
    {
      status: 'confirmed',
      label: 'Đã xác nhận',
      description: 'Người bán đã xác nhận đơn hàng',
      icon: '✓',
    },
    {
      status: 'shipped',
      label: 'Đã gửi hàng',
      description: 'Đơn hàng đã được gửi đi',
      icon: '📦',
    },
    {
      status: 'in-transit',
      label: 'Đang vận chuyển',
      description: 'Đơn hàng đang trên đường đến bạn',
      icon: '🚚',
    },
    {
      status: 'delivered',
      label: 'Đã giao',
      description: 'Đơn hàng đã được giao thành công',
      icon: '🎉',
    },
  ];

  const trackingSteps = steps || defaultSteps;
  const currentStepIndex = trackingSteps.findIndex(s => s.status === currentStatus);

  const getStepStatus = (stepStatus: OrderTrackingStep['status']) => {
    const stepIndex = trackingSteps.findIndex(s => s.status === stepStatus);
    const currentIdx = trackingSteps.findIndex(s => s.status === currentStatus);

    if (stepIndex < currentIdx) return 'completed';
    if (stepIndex === currentIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="w-full">
      {/* Timeline */}
      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-stone-300"></div>

        {/* Steps */}
        <div className="space-y-8">
          {trackingSteps.map((step, index) => {
            const status = getStepStatus(step.status);
            const isCompleted = status === 'completed';
            const isActive = status === 'active';

            return (
              <div key={step.status} className="relative pl-24">
                {/* Circle */}
                <div
                  className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isActive
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-200'
                      : 'bg-stone-300 text-stone-500'
                  }`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <div className={`py-2 ${isActive ? 'bg-emerald-50 p-4 rounded-lg' : ''}`}>
                  <h4 className={`font-semibold ${isActive ? 'text-emerald-600' : 'text-stone-800'}`}>
                    {step.label}
                  </h4>
                  <p className="text-sm text-stone-500 mt-1">{step.description}</p>
                  {step.timestamp && (
                    <p className="text-xs text-stone-400 mt-2">
                      {new Date(step.timestamp).toLocaleString('vi-VN')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Estimated Delivery */}
      {estimatedDelivery && currentStatus !== 'delivered' && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm text-emerald-900">
            <span className="font-semibold">Dự kiến giao hàng:</span>
            <br />
            {new Date(estimatedDelivery).toLocaleDateString('vi-VN')}
          </p>
        </div>
      )}

      {/* Tracking Info */}
      <div className="mt-8 p-4 bg-sage-50 rounded-lg">
        <p className="text-sm font-medium text-stone-800 mb-2">Mã đơn hàng: <code>{orderId}</code></p>
        <p className="text-xs text-stone-500">
          Cập nhật lần cuối: {new Date().toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </div>
  );
}
