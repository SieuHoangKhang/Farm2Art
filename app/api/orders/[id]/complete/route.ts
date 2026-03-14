import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Inventory, Order, Product, Settlement } from "@/types/marketplace";
import { calculateCommissionFee, calculateSellerReceives } from "@/lib/marketplace/fees";
import { canTransitionOrder } from "@/lib/marketplace/stateMachine";

export const runtime = "nodejs";

/**
 * PUT /api/orders/:id/complete
 * Hoàn thành đơn:
 * - Order: SHIPPING -> COMPLETED
 * - Inventory: DISPATCHED -> SOLD (theo quantity)
 * - Tạo Settlement status=UNPAID
 * - Nếu hết hàng: ẩn bài đăng (Product -> HIDDEN hoặc SOLD_OUT) + soft delete nếu muốn.
 */
export async function PUT(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Thiếu mã đơn hàng." }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection(MP_COLLECTIONS.orders).doc(orderId);

    const result = await db.runTransaction(async (tx) => {
      const orderSnap = await tx.get(orderRef);
      if (!orderSnap.exists) throw new Error("Không tìm thấy đơn hàng.");
      const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, "id">) } as Order;

      if (!canTransitionOrder(order.status, "COMPLETED")) {
        throw new Error(`Không thể hoàn thành đơn từ trạng thái "${order.status}".`);
      }

      const item = order.items?.[0];
      if (!item?.productId) throw new Error("Đơn hàng không hợp lệ (thiếu sản phẩm).");

      const productRef = db.collection(MP_COLLECTIONS.products).doc(item.productId);
      const inventoryRef = db.collection(MP_COLLECTIONS.inventories).doc(item.productId);

      const [productSnap, invSnap] = await Promise.all([tx.get(productRef), tx.get(inventoryRef)]);
      if (!productSnap.exists) throw new Error("Không tìm thấy sản phẩm.");
      if (!invSnap.exists) throw new Error("Không tìm thấy tồn kho.");

      const product = { id: productSnap.id, ...(productSnap.data() as Omit<Product, "id">) } as Product;
      const inv = { id: invSnap.id, ...(invSnap.data() as Omit<Inventory, "id">) } as Inventory;

      if (inv.quantityDispatched < item.quantity) {
        throw new Error("Tồn kho đã xuất không đủ để chốt bán.");
      }

      const now = Date.now();

      // 1) Update order
      tx.update(orderRef, {
        status: "COMPLETED",
        completedAt: now,
      });

      // 2) Update inventory
      const newDispatched = inv.quantityDispatched - item.quantity;
      const newSold = inv.quantitySold + item.quantity;
      const nextStatus: Inventory["status"] =
        newSold > 0 ? "SOLD" : newDispatched > 0 ? "DISPATCHED" : inv.quantityInStock > 0 ? "IN_STOCK" : inv.status;

      tx.update(inventoryRef, {
        quantityDispatched: newDispatched,
        quantitySold: newSold,
        status: nextStatus,
        updatedAt: now,
      });

      // 3) Create settlement (UNPAID)
      const orderTotal = order.totalAmount;
      const commissionFee = calculateCommissionFee(order.subTotal, product.defaultCommissionRate);
      const processingFee = product.defaultProcessingFee || 0;
      const shippingFee = product.defaultShippingFee || 0;
      const sellerReceives = calculateSellerReceives({
        orderTotal,
        commissionFee,
        processingFee,
        shippingFee,
      });

      const settlementDraft: Omit<Settlement, "id"> = {
        orderId: order.id,
        sellerId: order.sellerId,
        adminId: order.adminId,
        orderTotal,
        commissionFee,
        processingFee,
        shippingFee,
        sellerReceives,
        status: "UNPAID",
        createdAt: now,
      };

      const settlementRef = db.collection(MP_COLLECTIONS.settlements).doc();
      tx.set(settlementRef, settlementDraft);

      // 4) Nếu hết hàng thì ẩn bài đăng (SOLD_OUT hoặc HIDDEN)
      const remaining = inv.quantityInStock; // sau khi DISPATCHED->SOLD, inStock đã trừ từ lúc đặt hàng
      if (remaining <= 0) {
        tx.update(productRef, {
          status: "SOLD_OUT",
          updatedAt: now,
        });
      }

      return { settlementId: settlementRef.id, sellerReceives };
    });

    return NextResponse.json({
      success: true,
      message: "Cập nhật hoàn thành đơn hàng và tạo đối soát thành công.",
      settlementId: result.settlementId,
      sellerReceives: result.sellerReceives,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi hoàn thành đơn hàng.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

