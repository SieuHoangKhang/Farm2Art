/**
 * Marketplace v2 models cho quy trình: Đặt hàng → Giao hàng → Quản lý kho → Đối soát.
 *
 * Lưu ý:
 * - Tên biến/hàm/model dùng tiếng Anh chuẩn.
 * - Comment dùng tiếng Việt để dễ đọc hiểu.
 */

export type MarketplaceUserRole = "ADMIN" | "SELLER" | "BUYER";

export type MarketplaceUser = {
  id: string;
  role: MarketplaceUserRole;
  displayName?: string;
  email?: string;
  phone?: string;
  createdAt: number;
};

/**
 * Loại hình xử lý đơn hàng:
 * - warehouse: Farm2Art giữ hàng/sơ chế → xuất hàng từ kho Farm2Art để giao
 * - seller_pickup: Lấy hàng trực tiếp từ người bán sau khi khách đặt
 */
export type FulfillmentType = "warehouse" | "seller_pickup";

/**
 * Product Post = bài đăng sản phẩm (Admin đăng).
 * Soft delete: không xoá khỏi DB, chỉ đánh dấu isDeleted/deletedAt.
 */
export type ProductStatus = "ACTIVE" | "HIDDEN" | "SOLD_OUT";

export type Product = {
  id: string;
  title: string;
  description?: string;
  price: number; // giá bán cho buyer (VNĐ)
  sellerId: string; // người sở hữu hàng (seller thực tế)
  adminId: string; // admin đăng bài

  // Phí mặc định (có thể override theo từng đơn/thoả thuận)
  defaultCommissionRate: number; // ví dụ 0.1 = 10%
  defaultProcessingFee: number; // VNĐ/đơn (nếu có)
  defaultShippingFee: number; // VNĐ/đơn (nếu có)

  status: ProductStatus;
  isDeleted?: boolean;
  deletedAt?: number;
  createdAt: number;
  updatedAt?: number;
};

/**
 * Inventory: quản lý tồn kho theo Product.
 * Trạng thái theo state machine yêu cầu.
 */
export type InventoryStatus = "IN_STOCK" | "RESERVED" | "DISPATCHED" | "SOLD";

export type Inventory = {
  id: string; // doc id
  productId: string;
  quantityInStock: number; // số lượng đang có thể bán
  quantityReserved: number; // số lượng đang tạm giữ
  quantityDispatched: number; // số lượng đã xuất kho
  quantitySold: number; // số lượng đã bán
  status: InventoryStatus;
  updatedAt?: number;
  createdAt: number;
};

export type OrderStatus = "PENDING" | "SHIPPING" | "COMPLETED" | "CANCELLED";

export type OrderItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

/**
 * Order: đơn hàng của buyer.
 * totalAmount: tổng buyer thanh toán (VNĐ).
 * 
 * Quy trình xử lý:
 * - Người mua trả tiền theo giá công khai trên trang
 * - Admin nhận tiền, trừ phí hoa hồng, vận chuyển, dịch vụ (sơ chế, giữ hàng)
 * - fulfillmentType xác định cách lấy hàng:
 *   + warehouse: Farm2Art giữ hàng/sơ chế → xuất hàng từ kho để giao
 *   + seller_pickup: Lấy hàng từ người bán sau khi khách đặt
 */
export type Order = {
  id: string;
  buyerId: string;
  sellerId: string;
  adminId: string;
  items: OrderItem[];

  status: OrderStatus;
  shippingAddress: string;
  buyerNote?: string;

  // Loại hình xử lý đơn hàng
  fulfillmentType: FulfillmentType;
  // Ngày hẹn lấy hàng từ seller (cho seller_pickup)
  pickupDate?: number;
  // Thông tin pickup từ seller đã được xác nhận
  pickupConfirmedAt?: number;

  subTotal: number; // tổng tiền hàng (buyer trả)
  totalAmount: number; // tổng tiền buyer thanh toán (có thể = subTotal)

  createdAt: number;
  confirmedAt?: number;
  shippedAt?: number;
  completedAt?: number;
  cancelledAt?: number;
};

export type SettlementStatus = "UNPAID" | "PAID";

/**
 * Settlement: đối soát doanh thu sau khi Order COMPLETED.
 * sellerReceives = orderTotal - (commission + processing + shipping)
 */
export type Settlement = {
  id: string;
  orderId: string;
  sellerId: string;
  adminId: string;

  orderTotal: number;
  commissionFee: number;
  processingFee: number;
  shippingFee: number;
  sellerReceives: number;

  status: SettlementStatus;
  createdAt: number;
  paidAt?: number;
  paidByAdminId?: string;
  note?: string;
};

