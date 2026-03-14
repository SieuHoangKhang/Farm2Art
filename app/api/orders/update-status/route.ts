import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, status, buyerId } = body;

    if (!orderId || !status || !buyerId) {
      return NextResponse.json({ message: "Thiếu thông tin cần thiết" }, { status: 400 });
    }

    if (!["delivered", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
    }

    const orderRef = doc(serverDb, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ message: "Không tìm thấy đơn hàng" }, { status: 404 });
    }

    const order = orderSnap.data() as Order;

    // Buyer must own this order to update status from buyer-facing flow.
    if (order.buyerId !== buyerId) {
      return NextResponse.json({ message: "Bạn không có quyền với đơn hàng này" }, { status: 403 });
    }

    // Validate status transitions
    const validTransitions: Record<Order["status"], Order["status"][]> = {
      pending: [],
      deposited: ["shipping", "cancelled"],
      confirmed: ["shipping", "cancelled"],
      shipping: ["delivered", "completed", "cancelled"],
      delivered: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return NextResponse.json(
        { message: `Không thể chuyển từ trạng thái "${order.status}" sang "${status}"` },
        { status: 400 }
      );
    }

    const itemSubTotal =
      order.subTotal ??
      order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
      order.totalAmount;
    const expectedRemaining = Math.max(itemSubTotal - Math.round(itemSubTotal * 0.5), 0);

    if (status === "completed" && order.paymentStatus !== "success") {
      return NextResponse.json(
        { message: "Đơn chưa thanh toán thành công, không thể hoàn tất" },
        { status: 400 }
      );
    }

    if (
      status === "completed" &&
      expectedRemaining > 0 &&
      order.remainingPaymentStatus !== "received"
    ) {
      return NextResponse.json(
        { message: "Cần admin xác nhận đã nhận 50% còn lại trước khi hoàn tất đơn" },
        { status: 400 }
      );
    }

    const now = Date.now();
    const updateData: Partial<Order> & Record<string, unknown> = {
      status: status as Order["status"],
    };

    // Add timestamp based on status
    if (status === "completed") {
      updateData.completedAt = now;
      if (order.warehouseService?.enabled) {
        updateData["warehouseService.warehouseStatus"] = "completed";
        updateData["warehouseService.updatedAt"] = now;
      }
      // Keep escrow held until admin executes payout for seller.
      updateData.escrowStatus = "held";
    } else if (status === "delivered") {
      updateData.deliveredAt = now;
    } else if (status === "cancelled") {
      updateData.cancelledAt = now;
    }

    await updateDoc(orderRef, updateData);

    return NextResponse.json({ success: true, message: "Cập nhật trạng thái thành công" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Lỗi khi cập nhật trạng thái";
    return NextResponse.json({ message }, { status: 500 });
  }
}
