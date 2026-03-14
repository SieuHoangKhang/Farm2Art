import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Settlement } from "@/types/marketplace";

export const runtime = "nodejs";

/**
 * PUT /api/settlements/:id/pay
 * Admin xác nhận đã chuyển khoản cho seller:
 * - Settlement: UNPAID -> PAID
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: settlementId } = await params;
    const body = await req.json().catch(() => ({}));
    const paidByAdminId = typeof body?.paidByAdminId === "string" ? body.paidByAdminId : undefined;
    const note = typeof body?.note === "string" ? body.note : undefined;

    if (!settlementId) {
      return NextResponse.json({ success: false, message: "Thiếu mã đối soát." }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.collection(MP_COLLECTIONS.settlements).doc(settlementId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("Không tìm thấy bản ghi đối soát.");
      const st = { id: snap.id, ...(snap.data() as Omit<Settlement, "id">) } as Settlement;

      if (st.status === "PAID") {
        throw new Error("Đối soát này đã được thanh toán trước đó.");
      }

      const now = Date.now();
      tx.update(ref, {
        status: "PAID",
        paidAt: now,
        paidByAdminId: paidByAdminId || st.adminId,
        note: note || null,
      });
    });

    return NextResponse.json({ success: true, message: "Xác nhận thanh toán cho người bán thành công." });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi xác nhận thanh toán.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

