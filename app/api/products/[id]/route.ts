import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";

export const runtime = "nodejs";

/**
 * DELETE /api/products/:id
 * Soft delete (ẩn bài đăng) cho Admin:
 * - Product: isDeleted=true, status=HIDDEN
 */
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params;
    if (!productId) {
      return NextResponse.json({ success: false, message: "Thiếu mã sản phẩm." }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(MP_COLLECTIONS.products).doc(productId);

    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm." }, { status: 404 });
    }

    const now = Date.now();
    await ref.update({
      status: "HIDDEN",
      isDeleted: true,
      deletedAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, message: "Đã ẩn bài đăng (xóa mềm) thành công." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi ẩn bài đăng.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

