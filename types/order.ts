export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "completed" | "cancelled";

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
  | "awaiting_intake"
  | "in_storage"
  | "processing"
  | "ready_to_ship"
  | "shipped";

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
  grandTotal?: number;
  sellerPayout?: number;
  status: OrderStatus;
  paymentMethod?: "vnpay" | "transfer";
  paymentStatus?: "success" | "failed";
  transactionRef?: string;
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
  
  // ⭐ ESCROW MODEL (Mới)
  paymentReceivedAt?: number;        // Khi Admin nhận tiền từ customer
  escrowStatus?: EscrowStatus;        // Trạng thái tiền (pending/held/released/refunded)
  commissionRate?: number;            // % Hoa hồng (mặc định 10%)
  commissionAmount?: number;          // Số tiền hoa hồng (tính = grandTotal * commissionRate)
  payoutAmount?: number;              // Số tiền seller sẽ nhận (= grandTotal - commissionAmount)
  payoutStatus?: PayoutStatus;        // Trạng thái thanh toán (pending/scheduled/completed/failed)
  payoutAt?: number;                  // Khi nào seller được thanh toán
  
  createdAt: number;
};
