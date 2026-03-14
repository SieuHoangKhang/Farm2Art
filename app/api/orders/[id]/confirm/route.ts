import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Inventory, Order } from "@/types/marketplace";
import { canTransitionOrder } from "@/lib/marketplace/stateMachine";

export const runtime = "nodejs";

/**
 * PUT /api/orders/:id/confirm
 * Admin xác nhận và cho đi giao:
 * - Order: PENDING -> SHIPPING
 * - Inventory: RESERVED -> DISPATCHED (theo quantity)
 */
export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Thiếu mã đơn hàng." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection(MP_COLLECTIONS.orders).doc(orderId);

    await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) throw new Error("Không tìm thấy đơn hàng.");
      const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, "id">) } as Order;

      if (!canTransitionOrder(order.status, "SHIPPING")) {
        throw new Error(`Không thể xác nhận đơn từ trạng thái "${order.status}".`);
      }

      // Inventory doc id = productId
      const item = order.items?.[0];
      if (!item?.productId) throw new Error("Đơn hàng không hợp lệ (thiếu sản phẩm).");

      const inventoryRef = db.collection(MP_COLLECTIONS.inventories).doc(item.productId);
      const invSnap = await tx.get(inventoryRef);
      if (!invSnap.exists) throw new Error("Không tìm thấy tồn kho của sản phẩm.");
      const inv = { id: invSnap.id, ...(invSnap.data() as Omit<Inventory, "id">) } as Inventory;

      if (inv.quantityReserved < item.quantity) {
        throw new Error("Tồn kho tạm giữ không đủ để xuất kho.");
      }

      const now = Date.now();
      tx.update(orderRef, {
        status: "SHIPPING",
        confirmedAt: now,
        shippedAt: now,
      });

      const newReserved = inv.quantityReserved - item.quantity;
      const newDispatched = inv.quantityDispatched + item.quantity;
      const nextStatus: Inventory["status"] =
        newDispatched > 0 ? "DISPATCHED" : newReserved > 0 ? "RESERVED" : inv.quantityInStock > 0 ? "IN_STOCK" : inv.status;

      tx.update(inventoryRef, {
        quantityReserved: newReserved,
        quantityDispatched: newDispatched,
        status: nextStatus,
        updatedAt: now,
      });
    });

    return NextResponse.json({ success: true, message: "Xác nhận đơn hàng thành công. Đơn đang được giao." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi xác nhận đơn hàng.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

