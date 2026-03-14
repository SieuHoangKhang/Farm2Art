/**
 * State machine cho Order/Inventory theo yêu cầu đề bài.
 */

import type { InventoryStatus, OrderStatus, ProductStatus } from "@/types/marketplace";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Chờ xác nhận",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = {
  IN_STOCK: "Còn hàng",
  RESERVED: "Tạm giữ",
  DISPATCHED: "Đã xuất kho",
  SOLD: "Đã bán",
};

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
  ACTIVE: "Đang hiển thị",
  HIDDEN: "Đang ẩn",
  SOLD_OUT: "Hết hàng",
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ["SHIPPING", "CANCELLED"],
    SHIPPING: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    CANCELLED: [],
  };
  return allowed[from].includes(to);
}

