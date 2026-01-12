import { NextResponse } from "next/server";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { verifyVnpayReturn } from "@/lib/payments/vnpay/vnpay";
import { firebaseDb } from "@/lib/firebase/client";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

// VNPay sẽ gọi IPN (server-to-server). Bạn phải verify chữ ký và phản hồi đúng format.
export async function GET(request: Request) {
  const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
  if (!hashSecret) {
    return NextResponse.json({ RspCode: "99", Message: "Missing config" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) params[k] = v;

  const verified = verifyVnpayReturn(params, hashSecret);
  if (!verified.ok) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 200 });
  }

  // Verify order exists, amount matches, status is still pending
  const orderId = verified.params.vnp_TxnRef;
  const amountVnd = verified.params.vnp_Amount ? parseInt(verified.params.vnp_Amount) / 100 : 0;
  const isSuccess = verified.code === "00";

  try {
    const orderRef = doc(firebaseDb, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
    }

    const order = orderSnap.data() as Order;

    // Kiểm tra số tiền khớp
    if (order.totalAmount !== amountVnd) {
      return NextResponse.json({ RspCode: "04", Message: "Amount mismatch" }, { status: 200 });
    }

    // Kiểm tra chưa được thanh toán
    if (order.status !== "pending" || order.paymentMethod) {
      return NextResponse.json(
        { RspCode: "02", Message: "Order already paid or invalid status" },
        { status: 200 }
      );
    }

    // Cập nhật trạng thái thanh toán
    if (isSuccess) {
      await updateDoc(orderRef, {
        status: "completed",
        paymentMethod: "vnpay",
        paidAt: new Date().getTime(),
        transactionRef: verified.params.vnp_TransactionNo,
      });
    } else {
      await updateDoc(orderRef, {
        paymentMethod: "vnpay",
        paymentStatus: "failed",
      });
    }

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
  } catch (e) {
    console.error("IPN error:", e);
    return NextResponse.json({ RspCode: "99", Message: "Server error" }, { status: 200 });
  }
}
