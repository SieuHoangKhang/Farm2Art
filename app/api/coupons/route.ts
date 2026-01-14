import { NextRequest, NextResponse } from 'next/server';
import { Coupon, CouponValidation } from '@/types/coupon';

// In-memory coupon storage
const couponsStore: Record<string, Coupon> = {
  'FARM2024': {
    id: 'coupon_1',
    code: 'FARM2024',
    type: 'percentage',
    value: 20,
    minPurchaseAmount: 100000,
    maxUsageCount: 1000,
    usedCount: 245,
    expiryDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days from now
    description: 'Giảm 20% cho đơn hàng từ 100K',
    active: true,
    createdAt: Date.now(),
  },
  'FRESH50K': {
    id: 'coupon_2',
    code: 'FRESH50K',
    type: 'fixed',
    value: 50000,
    minPurchaseAmount: 200000,
    maxUsageCount: 500,
    usedCount: 123,
    expiryDate: Date.now() + 15 * 24 * 60 * 60 * 1000,
    description: 'Giảm 50K cho đơn hàng từ 200K',
    applicableCategories: ['Rau xanh', 'Trái cây'],
    active: true,
    createdAt: Date.now(),
  },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'list') {
    // Get all active coupons
    const activeCoupons = Object.values(couponsStore).filter(
      c => c.active && c.expiryDate > Date.now()
    );
    return NextResponse.json(activeCoupons);
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'validate') {
    const { code, totalAmount, category } = await request.json();

    const coupon = couponsStore[code.toUpperCase()];
    const validation: CouponValidation = {
      valid: false,
      discountAmount: 0,
    };

    // Check if coupon exists
    if (!coupon) {
      validation.error = 'Mã coupon không tồn tại';
      return NextResponse.json(validation, { status: 404 });
    }

    // Check if coupon is active
    if (!coupon.active) {
      validation.error = 'Mã coupon đã bị vô hiệu hóa';
      return NextResponse.json(validation, { status: 400 });
    }

    // Check if expired
    if (coupon.expiryDate < Date.now()) {
      validation.error = 'Mã coupon đã hết hạn';
      return NextResponse.json(validation, { status: 400 });
    }

    // Check usage limit
    if (coupon.maxUsageCount && coupon.usedCount >= coupon.maxUsageCount) {
      validation.error = 'Mã coupon đã hết lượt sử dụng';
      return NextResponse.json(validation, { status: 400 });
    }

    // Check minimum purchase amount
    if (coupon.minPurchaseAmount && totalAmount < coupon.minPurchaseAmount) {
      validation.error = `Đơn hàng tối thiểu ${coupon.minPurchaseAmount.toLocaleString('vi-VN')}đ`;
      return NextResponse.json(validation, { status: 400 });
    }

    // Check applicable categories
    if (coupon.applicableCategories && category && !coupon.applicableCategories.includes(category)) {
      validation.error = 'Mã coupon không áp dụng cho danh mục này';
      return NextResponse.json(validation, { status: 400 });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = Math.floor(totalAmount * (coupon.value / 100));
    } else {
      discountAmount = Math.min(coupon.value, totalAmount);
    }

    validation.valid = true;
    validation.coupon = coupon;
    validation.discountAmount = discountAmount;

    return NextResponse.json(validation);
  }

  if (action === 'apply') {
    const { code } = await request.json();
    const coupon = couponsStore[code.toUpperCase()];

    if (!coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      );
    }

    // Increment usage
    coupon.usedCount++;

    return NextResponse.json({ success: true, coupon });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
