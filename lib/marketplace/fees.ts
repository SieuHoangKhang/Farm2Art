/**
 * Hàm tính phí theo mô hình kinh doanh:
 * - commission_fee: theo % trên tổng tiền hàng
 * - processing_fee: cố định (VNĐ/đơn) hoặc 0
 * - shipping_fee: cố định (VNĐ/đơn) hoặc 0
 */

export function calculateCommissionFee(subTotal: number, commissionRate: number): number {
  // Làm tròn VNĐ để tránh số lẻ
  return Math.round(subTotal * commissionRate);
}

export function calculateSellerReceives(params: {
  orderTotal: number;
  commissionFee: number;
  processingFee: number;
  shippingFee: number;
}): number {
  const { orderTotal, commissionFee, processingFee, shippingFee } = params;
  return Math.max(orderTotal - (commissionFee + processingFee + shippingFee), 0);
}

