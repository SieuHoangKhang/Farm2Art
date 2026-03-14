/**
 * Utility functions cho Escrow Model
 */

import type { Order, EscrowStatus, PayoutStatus } from '@/types/order';
import { PLATFORM_CONFIG } from '@/lib/config/platformFees';

/**
 * Tính toán mới cho order (Escrow model)
 * 
 * Flow thanh toán mới:
 * 1. Buyer thanh toán: grandTotal (tiền hàng)
 * 2. Admin nhận đủ tiền, trừ tất cả phí:
 *    - Commission (hoa hồng platform)
 *    - Pickup fee (phí đi lấy)
 *    - Processing fee (phí sơ chế)
 *    - Storage fee (phí lưu kho)
 *    - Shipping fee (phí vận chuyển)
 * 3. Seller nhận: grandTotal - Tổng các phí trên
 */
export interface PaymentBreakdown {
  subtotal: number; // Giá gốc sản phẩm
  platformFee: number; // Phí nền tảng (commission)
  warehouseServiceFee: number; // Phí dịch vụ kho (pickup + processing + storage + shipping)
  grandTotal: number; // Tổng khách trả
  commissionAmount: number; // 10% commission
  pickupFee: number; // Phí đi lấy
  processingFee: number; // Phí sơ chế
  storageFee: number; // Phí lưu kho
  shippingFee: number; // Phí vận chuyển
  totalPlatformFees: number; // Tổng tất cả phí platform giữ lại
  payoutAmount: number; // Số seller nhận (đã trừ tất cả phí)
  escrowHeld: number; // Tiền đang giữ (= grandTotal)
}

export const calculatePaymentBreakdown = (
  subtotal: number,
  warehouseServiceFee: number = 0,
  shippingFee: number = 0,
  commissionRate: number = PLATFORM_CONFIG.defaultCommissionRate,
  pickupFee: number = PLATFORM_CONFIG.pickupFeePerOrder,
  processingFee: number = 0,
  storageFee: number = 0
): PaymentBreakdown => {
  const platformFee = Math.round(subtotal * commissionRate);
  const grandTotal = subtotal + platformFee + warehouseServiceFee + shippingFee;
  
  // Tổng tất cả phí platform giữ lại
  const totalPlatformFees = platformFee + pickupFee + processingFee + storageFee + shippingFee;
  
  // Số tiền seller nhận = grandTotal - Tất cả phí
  const payoutAmount = grandTotal - totalPlatformFees;

  return {
    subtotal,
    platformFee,
    warehouseServiceFee,
    shippingFee,
    grandTotal,
    commissionAmount: platformFee,
    pickupFee,
    processingFee,
    storageFee,
    totalPlatformFees,
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

  // Commission + Payout should equal grandTotal (with new logic: all fees + payout = grandTotal)
  // grandTotal = commissionAmount + pickupFee + processingFee + storageFee + shippingFee + payoutAmount
  const feeBreakdown = order.feeBreakdown;
  const calc = feeBreakdown
    ? (order.commissionAmount || 0) +
      (feeBreakdown.pickupFee || 0) +
      (feeBreakdown.processingFee || 0) +
      (feeBreakdown.storageFee || 0) +
      (feeBreakdown.shippingFee || 0) +
      (order.payoutAmount || 0)
    : (order.commissionAmount || 0) + (order.payoutAmount || 0);
  
  const expected = order.grandTotal || 0;
  if (Math.abs(calc - expected) > 1) {
    // Allow 1đ tolerance for rounding
    errors.push(`Tổng phí (commission + pickup + processing + storage + shipping + payout) != GrandTotal (${calc} vs ${expected})`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
