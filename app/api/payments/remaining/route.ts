import { NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs, query, updateDoc, where, addDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, action, buyerId, transferReference } = body as {
      orderId?: string;
      action?: "submit" | "confirm";
      buyerId?: string;
      transferReference?: string;
    };

    if (!orderId || !action) {
      return NextResponse.json({ error: "Missing orderId or action" }, { status: 400 });
    }

    const orderRef = doc(serverDb, "orders", orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, "id">) } as Order;
    const now = Date.now();

    if (action === "submit") {
      if (!buyerId || order.buyerId !== buyerId) {
        return NextResponse.json({ error: "Unauthorized buyer" }, { status: 403 });
      }
      if (order.status !== "delivered" && order.status !== "shipping") {
        return NextResponse.json({ error: "Order is not ready for remaining payment" }, { status: 400 });
      }

      await updateDoc(orderRef, {
        remainingPaymentStatus: "submitted",
        remainingPaymentSubmittedAt: now,
        remainingPaymentReference: transferReference || null,
      });

      return NextResponse.json({ success: true, message: "Đã gửi thông tin chuyển khoản 50% còn lại" });
    }

    // action = confirm (admin xác nhận đã nhận tiền còn lại)
    if (order.remainingPaymentStatus !== "submitted") {
      return NextResponse.json({ error: "Remaining payment chưa được người mua gửi" }, { status: 400 });
    }

    const fullPaidAt = now;
    await updateDoc(orderRef, {
      status: "completed",
      completedAt: fullPaidAt,
      paymentStatus: "success",
      paidAt: fullPaidAt,
      paidAmount: order.grandTotal ?? order.subTotal ?? order.totalAmount,
      remainingPaymentStatus: "received",
      remainingPaymentReceivedAt: fullPaidAt,
      escrowStatus: "held",
      ...(order.warehouseService?.enabled
        ? {
            "warehouseService.warehouseStatus": "completed",
            "warehouseService.updatedAt": fullPaidAt,
          }
        : {}),
    });

    // Hủy các đơn cùng listing chưa hoàn tất và thông báo hết hàng
    const sameListingSnap = await getDocs(
      query(collection(serverDb, "orders"), where("listingId", "==", order.listingId))
    );

    const toReject = sameListingSnap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) } as Order))
      .filter(
        (o) =>
          o.id !== order.id &&
          ["pending", "deposited", "confirmed"].includes(o.status)
      );

    for (const rejected of toReject) {
      await updateDoc(doc(serverDb, "orders", rejected.id), {
        status: "cancelled",
        cancelledAt: fullPaidAt,
        cancelReason: "Trễ đơn hết hàng",
      });

      await addDoc(collection(serverDb, "notifications"), {
        userId: rejected.buyerId,
        title: "Đơn hàng bị từ chối",
        message: "Sản phẩm đã hết hàng do đơn trước đã thanh toán thành công.",
        orderId: rejected.id,
        createdAt: fullPaidAt,
        read: false,
        type: "order_rejected_out_of_stock",
      });
    }

    // Ẩn listing khỏi sàn sau khi có đơn thanh toán thành công cuối cùng
    await updateDoc(doc(serverDb, "listings", order.listingId), {
      status: "hidden",
      hiddenAt: fullPaidAt,
    });

    return NextResponse.json({ success: true, message: "Đã xác nhận nhận đủ tiền và hoàn tất đơn" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Remaining payment error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
