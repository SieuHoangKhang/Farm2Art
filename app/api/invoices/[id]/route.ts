import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { InvoiceStatus, SellerInvoice } from "@/types/invoice";

const ALLOWED_STATUSES: InvoiceStatus[] = [
  "draft",
  "generated",
  "sent",
  "viewed",
  "paid",
  "cancelled",
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const db = getAdminDb();
  try {
    const { id } = await params;
    const body = (await req.json()) as { status?: InvoiceStatus; notes?: string; paidAt?: number };

    if (!body.status || !ALLOWED_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Trạng thái hóa đơn không hợp lệ" }, { status: 400 });
    }

    const ref = db.collection("invoices").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });
    }

    const now = Date.now();
    const updateData: Partial<SellerInvoice> & { updatedAt?: number } = {
      status: body.status,
      updatedAt: now,
    };

    if (body.status === "sent") updateData.sentAt = now;
    if (body.status === "viewed") updateData.viewedAt = now;
    if (body.status === "paid") updateData.paidAt = body.paidAt || now;
    if (body.notes !== undefined) updateData.notes = body.notes;

    await ref.update(updateData);

    return NextResponse.json({ success: true, id, status: body.status }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Không thể cập nhật hóa đơn" }, { status: 500 });
  }
}
