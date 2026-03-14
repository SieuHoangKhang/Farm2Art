import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Inventory, Product } from "@/types/marketplace";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/seed
 * Tiện ích tạo nhanh demo Product + Inventory để test UI/luồng.
 *
 * Gợi ý dùng trong môi trường dev.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "Phế phẩm nông nghiệp (demo)";
    const price = typeof body?.price === "number" ? body.price : 150000;
    const quantity = typeof body?.quantity === "number" ? body.quantity : 10;
    const sellerId = typeof body?.sellerId === "string" ? body.sellerId : "SELLER_DEMO";
    const adminId = typeof body?.adminId === "string" ? body.adminId : "ADMIN_DEMO";

    const db = getAdminDb();
    const productRef = db.collection(MP_COLLECTIONS.products).doc();

    const now = Date.now();
    const product: Omit<Product, "id"> = {
      title,
      description: "Sản phẩm demo để kiểm thử luồng đặt hàng/kho/đối soát.",
      price,
      sellerId,
      adminId,
      defaultCommissionRate: 0.1,
      defaultProcessingFee: 0,
      defaultShippingFee: 30000,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    };

    const inventory: Omit<Inventory, "id"> = {
      productId: productRef.id,
      quantityInStock: quantity,
      quantityReserved: 0,
      quantityDispatched: 0,
      quantitySold: 0,
      status: "IN_STOCK",
      createdAt: now,
      updatedAt: now,
    };

    await productRef.set(product);
    await db.collection(MP_COLLECTIONS.inventories).doc(productRef.id).set(inventory);

    return NextResponse.json({
      success: true,
      message: "Tạo dữ liệu demo thành công.",
      productId: productRef.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi tạo dữ liệu demo.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

