export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "completed" | "cancelled";

export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  sellerName?: string;
  listingId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentMethod?: "vnpay" | "transfer";
  paymentStatus?: "success" | "failed";
  transactionRef?: string;
  paidAt?: number;
  confirmedAt?: number;
  shippedAt?: number;
  deliveredAt?: number;
  completedAt?: number;
  cancelledAt?: number;
  shippingAddress?: string;
  trackingNumber?: string;
  buyerNote?: string;
  createdAt: number;
};
