import { NextRequest, NextResponse } from 'next/server';

export interface ShippingOption {
  id: string;
  carrier: string;
  estimatedDays: number;
  cost: number;
  description: string;
}

export interface ShippingQuote {
  toDistrict: string;
  toCity: string;
  options: ShippingOption[];
}

// Mock shipping rates
const shippingRates: Record<string, number> = {
  'TP.HCM|Quận 1': 25000,
  'TP.HCM|Quận 2': 30000,
  'TP.HCM|Quận 3': 25000,
  'Hà Nội|Ba Đình': 35000,
  'Hà Nội|Cầu Giấy': 35000,
  'Đà Nẵng|Hải Châu': 45000,
};

export async function POST(request: NextRequest) {
  try {
    const { toDistrict, toCity } = await request.json();

    if (!toDistrict || !toCity) {
      return NextResponse.json(
        { error: 'District and city are required' },
        { status: 400 }
      );
    }

    // Get base rate
    const key = `${toCity}|${toDistrict}`;
    const baseRate = shippingRates[key] || 50000; // Default rate

    // Mock shipping options from different carriers
    const options: ShippingOption[] = [
      {
        id: 'standard',
        carrier: 'GHN',
        estimatedDays: 3,
        cost: baseRate,
        description: 'Giao hàng tiêu chuẩn (3-4 ngày)',
      },
      {
        id: 'express',
        carrier: 'GHN Express',
        estimatedDays: 1,
        cost: Math.floor(baseRate * 1.5),
        description: 'Giao hàng nhanh (1-2 ngày)',
      },
      {
        id: 'economy',
        carrier: 'J&T',
        estimatedDays: 5,
        cost: Math.floor(baseRate * 0.7),
        description: 'Giao hàng tiết kiệm (4-5 ngày)',
      },
      {
        id: 'sameday',
        carrier: 'Grab',
        estimatedDays: 0,
        cost: Math.floor(baseRate * 2.5),
        description: 'Giao hàng cùng ngày (nếu đặt trước 2PM)',
      },
    ];

    // Filter options based on location (mock logic)
    const availableOptions = options.filter(opt => {
      if (toCity !== 'TP.HCM' && opt.id === 'sameday') return false;
      return true;
    });

    const quote: ShippingQuote = {
      toDistrict,
      toCity,
      options: availableOptions,
    };

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { error: 'Failed to get shipping quote' },
      { status: 500 }
    );
  }
}

// Get tracking info
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingNumber = searchParams.get('tracking');

  if (!trackingNumber) {
    return NextResponse.json(
      { error: 'Tracking number is required' },
      { status: 400 }
    );
  }

  // Mock tracking data
  const mockTracking = {
    trackingNumber,
    status: 'in_transit',
    carrier: 'GHN',
    events: [
      {
        status: 'picked_up',
        location: 'Kho Farm2Art, TP.HCM',
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
        description: 'Hàng đã nhận',
      },
      {
        status: 'in_transit',
        location: 'Phân loại, TP.HCM',
        timestamp: Date.now() - 12 * 60 * 60 * 1000,
        description: 'Hàng đang được sắp xếp',
      },
      {
        status: 'out_for_delivery',
        location: 'Giao hàng, Quận 1, TP.HCM',
        timestamp: Date.now() - 30 * 60 * 1000,
        description: 'Hàng đang giao',
      },
    ],
    estimatedDelivery: Date.now() + 2 * 60 * 60 * 1000,
  };

  return NextResponse.json(mockTracking);
}
