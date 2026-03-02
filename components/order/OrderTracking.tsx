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
          { id: '1', name: 'Rơm lúa mì chất lượng cao', quantity: 5, price: 450000 },
          { id: '2', name: 'Túi xách thủ công từ rơm', quantity: 1, price: 350000 },
        ],
        shippingAddress: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        shippingCost: 30000,
        subtotal: 2600000,
        discount: 50000,
        total: 2580000,
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
            <h2 className="text-2xl font-semibold text-stone-800">Đơn hàng {orderId}</h2>
            <p className="text-stone-500 text-sm">
              Dự kiến giao trong {Math.max(0, daysUntilDelivery)} ngày
            </p>
          </div>
          <div className="text-right">
            {trackingNumber && (
              <div>
                <p className="text-sm text-stone-500">Mã vận đơn</p>
                <p className="font-semibold text-stone-800">{trackingNumber}</p>
              </div>
            )}
            {carrier && (
              <div className="text-sm text-stone-500 mt-2">{carrier}</div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="py-4">
        <h3 className="text-lg font-semibold text-stone-800 mb-6">Trạng thái đơn hàng</h3>

        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute top-0 left-8 h-full w-1 bg-stone-200"></div>

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
                          : 'bg-sage-100 text-stone-300 border-4 border-sage-200'
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
                      <h4 className={`font-semibold text-lg ${isCompleted ? 'text-stone-800' : 'text-stone-400'}`}>
                        {step.label}
                      </h4>
                      {step.timestamp && (
                        <p className="text-sm text-stone-500">
                          {new Date(step.timestamp).toLocaleString('vi-VN')}
                        </p>
                      )}
                      {isCurrent && (
                        <p className="text-sm text-emerald-600 font-medium mt-1">Hiện tại</p>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedStep === step.status && orderData?.events && (
                    <div className="ml-16 mt-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
                      {orderData.events
                        .filter((event: any) => event.status === step.status)
                        .map((event: any, eventIdx: number) => (
                          <div key={eventIdx}>
                            <p className="text-sm font-medium text-stone-800">{event.description}</p>
                            <p className="text-xs text-stone-500">
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
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Địa chỉ giao hàng</h3>
            <div className="bg-sage-50 rounded-lg p-4">
              <p className="text-stone-800 font-medium">📍 {orderData.shippingAddress}</p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-stone-800 mb-4">Sản phẩm</h3>
            <div className="space-y-3">
              {orderData.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div>
                    <p className="text-stone-800 font-medium">{item.name}</p>
                    <p className="text-sm text-stone-500">Số lượng: {item.quantity}</p>
                  </div>
                  <p className="text-stone-800 font-semibold">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-6">
            <div className="space-y-2 text-right">
              <div className="flex justify-between text-stone-500">
                <span>Tạm tính</span>
                <span>{orderData.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Phí vận chuyển</span>
                <span>{orderData.shippingCost.toLocaleString('vi-VN')}đ</span>
              </div>
              {orderData.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span>
                  <span>-{orderData.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-stone-800 pt-2 border-t">
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
