export type OrderStatus = "pending" | "deposited" | "confirmed" | "shipping" | "delivered" | "completed" | "cancelled";

export type EscrowStatus = "pending" | "held" | "released" | "refunded";

export type PayoutStatus = "pending" | "scheduled" | "completed" | "failed";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  weight?: number; // kg (cho tính phí dịch vụ)
};

export type WarehouseProcessingMode = "seller_self" | "warehouse";

export type WarehouseOrderStatus =
  | "in_stock"
  | "awaiting_intake"
  | "in_storage"
  | "processing"
  | "ready_to_ship"
  | "shipped"
  | "completed";

export type WarehouseService = {
  enabled: boolean;
  processingMode: WarehouseProcessingMode;
  storageDays: number;
  storageFee: number;
  processingFee: number;
  shippingFee: number;
  serviceFeeTotal: number;
  warehouseStatus: WarehouseOrderStatus;
  updatedAt?: number;
};

export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName?: string;
  listingId: string;
  items: OrderItem[];
  subTotal?: number;
  totalAmount: number;
  platformFee?: number;
  warehouseService?: WarehouseService;
  /** Số tiền người mua thanh toán = chỉ tiền hàng (subTotal). Phí nền tảng, lưu kho, sơ chế, vận chuyển thuộc người bán (admin gửi hóa đơn cho seller). */
  grandTotal?: number;
  sellerPayout?: number;
  status: OrderStatus;
  paymentMethod?: "vnpay" | "transfer";
  // pending: tạo đơn nhưng chưa thanh toán (hiển thị UI)
  paymentStatus?: "pending" | "success" | "failed";
  depositAmount?: number;
  depositPaidAt?: number;
  remainingAmount?: number;
  remainingPaymentStatus?: "pending" | "submitted" | "received";
  remainingPaymentSubmittedAt?: number;
  remainingPaymentReceivedAt?: number;
  remainingPaymentReference?: string;
  transactionRef?: string;
  paidAmount?: number;
  paidAt?: number;
  confirmedAt?: number;
  pickupDate?: number;            // Khi admin đi lấy hàng
  pickupAt?: number;              // Alias cho pickupDate
  readyToShipDate?: number;       // 🆕 Khi sơ chế xong & sẳn vận chuyển
  shippedAt?: number;
  deliveredAt?: number;           // Khi buyer nhận hàng
  completedAt?: number;
  cancelledAt?: number;
  shippingAddress?: string;
  trackingNumber?: string;
  buyerNote?: string;
  cancelReason?: string;

  // ⭐ ESCROW MODEL (Mới)
  paymentReceivedAt?: number;        // Khi Admin nhận tiền từ customer
  escrowStatus?: EscrowStatus;        // Trạng thái tiền (pending/held/released/refunded)
  commissionRate?: number;            // % Hoa hồng (mặc định 10%)
  commissionAmount?: number;          // Số tiền hoa hồng (tính = grandTotal * commissionRate)
  payoutAmount?: number;              // Số tiền seller sẽ nhận (= grandTotal - commissionAmount - pickupFee - processingFee - storageFee - shippingFee)
  payoutStatus?: PayoutStatus;        // Trạng thái thanh toán (pending/scheduled/completed/failed)
  payoutAt?: number;                  // Khi nào seller được thanh toán
  invoiceId?: string;                 // Hóa đơn dịch vụ seller (nếu đã phát hành)

  // ⭐ Chi tiết các khoản phí được trừ từ tiền buyer
  feeBreakdown?: {
    commissionAmount: number;
    pickupFee: number;
    processingFee: number;
    storageFee: number;
    shippingFee: number;
    totalPlatformFees: number;
    grandTotal: number;
  };

  createdAt: number;
};
