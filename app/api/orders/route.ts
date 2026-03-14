import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Inventory, Order, Product } from "@/types/marketplace";
import { calculateCommissionFee, calculateSellerReceives } from "@/lib/marketplace/fees";
import { mustString, parsePositiveInt } from "@/lib/marketplace/validators";

export const runtime = "nodejs";

/**
 * POST /api/orders
 * Khách đặt hàng:
 * - Tạo Order status=PENDING
 * - Trừ kho: IN_STOCK -> RESERVED (theo quantity)
 * - Dùng transaction để đảm bảo toàn vẹn dữ liệu (lỗi thì rollback).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const productId = body?.productId;
    const buyerId = body?.buyerId;
    const quantity = parsePositiveInt(body?.quantity);
    const shippingAddress = body?.shippingAddress;
    const buyerNote = typeof body?.buyerNote === "string" ? body.buyerNote : undefined;

    if (!mustString(productId) || !mustString(buyerId) || !quantity || !mustString(shippingAddress)) {
      return NextResponse.json(
        { success: false, message: "Thiếu thông tin đặt hàng (productId, buyerId, quantity, shippingAddress)." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const productRef = db.collection(MP_COLLECTIONS.products).doc(productId);
    const inventoryRef = db.collection(MP_COLLECTIONS.inventories).doc(productId); // 1 inventory / 1 product
    const ordersCol = db.collection(MP_COLLECTIONS.orders);

    const result = await db.runTransaction(async (tx) => {
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists) {
        throw new Error("Không tìm thấy sản phẩm.");
      }
      const product = { id: productSnap.id, ...(productSnap.data() as Omit<Product, "id">) } as Product;
      if (product.isDeleted) {
        throw new Error("Sản phẩm đã bị ẩn hoặc xóa.");
      }
      if (product.status !== "ACTIVE") {
        throw new Error("Sản phẩm hiện không khả dụng để đặt hàng.");
      }

      const invSnap = await tx.get(inventoryRef);
      if (!invSnap.exists) {
        throw new Error("Sản phẩm chưa được khởi tạo tồn kho.");
      }
      const inv = { id: invSnap.id, ...(invSnap.data() as Omit<Inventory, "id">) } as Inventory;

      if (inv.quantityInStock < quantity) {
        throw new Error("Sản phẩm đã hết hàng hoặc không đủ số lượng.");
      }

      // Tính tiền: buyer trả subTotal (chưa tính fee vào tổng buyer theo mô hình đề bài)
      const subTotal = product.price * quantity;
      const orderTotal = subTotal;

      // Lưu phí tham chiếu (đối soát sẽ tính lại khi complete, nhưng lưu sẵn giúp audit)
      const commissionFee = calculateCommissionFee(subTotal, product.defaultCommissionRate);
      const processingFee = product.defaultProcessingFee || 0;
      const shippingFee = product.defaultShippingFee || 0;
      const sellerReceives = calculateSellerReceives({
        orderTotal,
        commissionFee,
        processingFee,
        shippingFee,
      });

      const now = Date.now();
      const orderDraft: Omit<Order, "id"> = {
        buyerId,
        sellerId: product.sellerId,
        adminId: product.adminId,
        fulfillmentType: "warehouse",
        status: "PENDING",
        shippingAddress,
        buyerNote,
        items: [
          {
            productId: product.id,
            title: product.title,
            unitPrice: product.price,
            quantity,
          },
        ],
        subTotal,
        totalAmount: orderTotal,
        createdAt: now,
      };

      // 1) Reserve inventory
      const newInStock = inv.quantityInStock - quantity;
      const newReserved = inv.quantityReserved + quantity;
      const nextStatus: Inventory["status"] = newReserved > 0 ? "RESERVED" : newInStock > 0 ? "IN_STOCK" : inv.status;

      tx.update(inventoryRef, {
        quantityInStock: newInStock,
        quantityReserved: newReserved,
        status: nextStatus,
        updatedAt: now,
      });

      // 2) Create order
      const newOrderRef = ordersCol.doc();
      tx.set(newOrderRef, orderDraft);

      return {
        orderId: newOrderRef.id,
        // Trả thêm breakdown để UI hiển thị nhanh (tiếng Việt)
        preview: {
          subTotal,
          orderTotal,
          commissionFee,
          processingFee,
          shippingFee,
          sellerReceives,
        },
      };
    });

    return NextResponse.json({
      success: true,
      message: "Đặt hàng thành công.",
      orderId: result.orderId,
      preview: result.preview,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi không xác định khi đặt hàng.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

