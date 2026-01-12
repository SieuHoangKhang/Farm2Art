export type OrderStatus = "pending" | "completed" | "cancelled";

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
  createdAt: number;
};
