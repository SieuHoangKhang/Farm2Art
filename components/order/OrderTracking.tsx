'use client';

import React, { useState, useEffect } from 'react';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';

interface OrderStatusStep {
  status: OrderStatus;
  label: string;
  icon: string;
  timestamp?: number;
}

interface OrderTrackingProps {
  orderId: string;
  currentStatus: OrderStatus;
  estimatedDelivery: number;
  trackingNumber?: string;
  carrier?: string;
  timeline?: OrderStatusStep[];
}

export default function OrderTracking({
  orderId,
  currentStatus,
  estimatedDelivery,
  trackingNumber,
  carrier,
  timeline = [
    { status: 'pending', label: 'Đã đặt hàng', icon: '📋' },
    { status: 'confirmed', label: 'Xác nhận', icon: '✓' },
    { status: 'shipped', label: 'Gửi hàng', icon: '📦' },
    { status: 'in_transit', label: 'Đang giao', icon: '🚚' },
    { status: 'delivered', label: 'Đã giao', icon: '✅' },
  ],
}: OrderTrackingProps) {
  const [expandedStep, setExpandedStep] = useState<OrderStatus | null>(currentStatus);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // Fetch order details
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // Mock data
      const mockData = {
        orderId,
        status: currentStatus,
        items: [
          { id: '1', name: 'Rau cải xanh organic', quantity: 2, price: 45000 },
          { id: '2', name: 'Dâu tây tươi', quantity: 1, price: 89000 },
        ],
        shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        shippingCost: 25000,
        subtotal: 179000,
        discount: 20000,
        total: 184000,
        events: [
          {
            time: Date.now() - 24 * 60 * 60 * 1000,
            status: 'confirmed',
            description: 'Đơn hàng được xác nhận',
            location: 'Kho Farm2Art',
          },
          {
            time: Date.now() - 12 * 60 * 60 * 1000,
            status: 'shipped',
            description: 'Hàng đã gửi đi',
            location: 'Kho Farm2Art',
          },
          {
            time: Date.now() - 6 * 60 * 60 * 1000,
            status: 'in_transit',
            description: 'Hàng đang trên đường',
            location: 'Bình Dương',
          },
        ],
      };

      setOrderData(mockData);
    } catch (error) {
      console.error('Failed to fetch order:', error);
    }
  };

  const getStatusIndex = (status: OrderStatus) => {
    return timeline.findIndex(t => t.status === status);
  };

  const currentStatusIndex = getStatusIndex(currentStatus);
  const daysUntilDelivery = Math.ceil((estimatedDelivery - Date.now()) / (24 * 60 * 60 * 1000));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Order Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Đơn hàng {orderId}</h2>
            <p className="text-gray-600 text-sm">
              Dự kiến giao trong {Math.max(0, daysUntilDelivery)} ngày
            </p>
          </div>
          <div className="text-right">
            {trackingNumber && (
              <div>
                <p className="text-sm text-gray-600">Mã vận đơn</p>
                <p className="font-semibold text-gray-900">{trackingNumber}</p>
              </div>
            )}
            {carrier && (
              <div className="text-sm text-gray-600 mt-2">{carrier}</div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Trạng thái đơn hàng</h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-0 left-8 h-full w-1 bg-gray-200"></div>

          {/* Timeline Steps */}
          <div className="space-y-4 relative z-10">
            {timeline.map((step, idx) => {
              const isCompleted = idx <= currentStatusIndex;
              const isCurrent = idx === currentStatusIndex;

              return (
                <div key={step.status}>
                  <div
                    className="flex items-start cursor-pointer"
                    onClick={() => setExpandedStep(isCurrent ? null : step.status)}
                  >
                    {/* Timeline Dot */}
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0 relative z-20 transition ${
                        isCompleted
                          ? 'bg-green-100 text-green-600 border-4 border-green-500'
                          : 'bg-gray-100 text-gray-400 border-4 border-gray-200'
                      }`}
                    >
                      {isCurrent ? (
                        <span className="animate-pulse">{step.icon}</span>
                      ) : (
                        step.icon
                      )}
                    </div>

                    {/* Timeline Content */}
                    <div className="ml-4 pt-2 flex-1">
                      <h4 className={`font-semibold text-lg ${isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.label}
                      </h4>
                      {step.timestamp && (
                        <p className="text-sm text-gray-600">
                          {new Date(step.timestamp).toLocaleString('vi-VN')}
                        </p>
                      )}
                      {isCurrent && (
                        <p className="text-sm text-blue-600 font-medium mt-1">Hiện tại</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedStep === step.status && orderData?.events && (
                    <div className="ml-16 mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                      {orderData.events
                        .filter((event: any) => event.status === step.status)
                        .map((event: any, eventIdx: number) => (
                          <div key={eventIdx}>
                            <p className="text-sm font-medium text-gray-900">{event.description}</p>
                            <p className="text-xs text-gray-600">
                              📍 {event.location} • {new Date(event.time).toLocaleString('vi-VN')}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Order Details */}
      {orderData && (
        <>
          {/* Shipping Address */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ giao hàng</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-900 font-medium">📍 {orderData.shippingAddress}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sản phẩm</h3>
            <div className="space-y-3">
              {orderData.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <p className="text-gray-900 font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="text-gray-900 font-semibold">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span>
                <span>{orderData.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>{orderData.shippingCost.toLocaleString('vi-VN')}đ</span>
              </div>
              {orderData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{orderData.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
                <span>Tổng cộng</span>
                <span>{orderData.total.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
