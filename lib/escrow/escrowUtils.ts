/**
 * Utility functions cho Escrow Model
 */

import type { Order, EscrowStatus, PayoutStatus } from '@/types/order';
import { PLATFORM_CONFIG } from '@/lib/config/platformFees';

/**
 * Kiểm tra listing có được approving để bán không
 */
export const isListingApproved = (approvalStatus?: string): boolean => {
  return approvalStatus === 'approved';
};

/**
 * Tính toán mới cho order (Escrow model)
 */
export interface PaymentBreakdown {
  subtotal: number; // Giá gốc sản phẩm
  platformFee: number; // Phí nền tảng (commission)
  warehouseServiceFee: number; // Phí dịch vụ kho (nếu có)
  shippingFee: number; // Phí vận chuyển
  grandTotal: number; // Tổng khách trả
  commissionAmount: number; // 10% commission
  payoutAmount: number; // Số seller nhận
  escrowHeld: number; // Tiền đang giữ (= grandTotal)
}

export const calculatePaymentBreakdown = (
  subtotal: number,
  seriousServiceFee: number = 0,
  shippingFee: number = 0,
  commissionRate: number = PLATFORM_CONFIG.defaultCommissionRate
): PaymentBreakdown => {
  const platformFee = Math.round(subtotal * commissionRate);
  const grandTotal = subtotal + platformFee + seriousServiceFee + shippingFee;
  const payoutAmount = grandTotal - platformFee; // Seller gets grand total trừ commission

  return {
    subtotal,
    platformFee,
    warehouseServiceFee: seriousServiceFee,
    shippingFee,
    grandTotal,
    commissionAmount: platformFee,
    payoutAmount,
    escrowHeld: grandTotal,
  };
};

/**
 * Timeline cho Escrow Model
 */
export interface EscrowTimeline {
  paymentReceivedAt?: number; // Lúc nhận tiền từ VNPay
  orderCompletedAt?: number; // Lúc order completed (khách xác nhận)
  payoutScheduledAt?: number; // Lúc lên lịch thanh toán
  payoutCompletedAt?: number; // Lúc hoàn thành thanh toán cho seller
  daysSincePaymentReceived?: number;
  daysSinceOrderCompleted?: number;
  canPayoutNow?: boolean; // Có được payout ngay không (3 ngày sau completed)
}

export const getEscrowTimeline = (order: Order): EscrowTimeline => {
  const now = Date.now();
  const paymentReceivedAt = order.paymentReceivedAt;
  const orderCompletedAt = order.completedAt;

  let daysSincePaymentReceived = undefined;
  let daysSinceOrderCompleted = undefined;
  let canPayoutNow = false;

  if (paymentReceivedAt) {
    daysSincePaymentReceived = Math.floor((now - paymentReceivedAt) / (1000 * 60 * 60 * 24));
  }

  if (orderCompletedAt) {
    daysSinceOrderCompleted = Math.floor((now - orderCompletedAt) / (1000 * 60 * 60 * 24));
    canPayoutNow = daysSinceOrderCompleted >= PLATFORM_CONFIG.payoutAfterDaysOfDelivery;
  }

  return {
    paymentReceivedAt,
    orderCompletedAt,
    payoutScheduledAt: order.payoutAt,
    daysSincePaymentReceived,
    daysSinceOrderCompleted,
    canPayoutNow,
  };
};

/**
 * Escrow Status labels
 */
export const ESCROW_STATUS_LABEL: Record<EscrowStatus, string> = {
  pending: 'Chờ thanh toán',
  held: 'Tiền đang giữ',
  released: 'Đã phát hành',
  refunded: 'Hoàn tiền',
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: 'Chờ xử lí',
  scheduled: 'Lên lịch',
  completed: 'Đã thanh toán',
  failed: 'Thất bại',
};

/**
 * Validate Escrow state
 */
export interface EscrowValidation {
  isValid: boolean;
  errors: string[];
}

export const validateEscrowOrder = (order: Order): EscrowValidation => {
  const errors: string[] = [];

  // Check payment
  if (order.paymentStatus !== 'success') {
    errors.push('Thanh toán chưa thành công');
  }

  if (!order.escrowStatus) {
    errors.push('Escrow status chưa được set');
  }

  // Check amounts
  if (!order.commissionAmount) {
    errors.push('Commission amount chưa được tính');
  }

  if (!order.payoutAmount) {
    errors.push('Payout amount chưa được tính');
  }

  // Commission + Payout should equal grandTotal
  const calc = (order.commissionAmount || 0) + (order.payoutAmount || 0);
  const expected = order.grandTotal || 0;
  if (Math.abs(calc - expected) > 1) {
    // Allow 1đ tolerance for rounding
    errors.push(`Commission + Payout != GrandTotal (${calc} vs ${expected})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
