export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed'; // percentage discount or fixed amount
  value: number; // % or amount in đ
  minPurchaseAmount?: number;
  maxUsageCount?: number;
  usedCount: number;
  expiryDate: number; // timestamp
  description: string;
  applicableCategories?: string[];
  active: boolean;
  createdAt: number;
}

export interface CouponValidation {
  valid: boolean;
  coupon?: Coupon;
  error?: string;
  discountAmount: number;
}
