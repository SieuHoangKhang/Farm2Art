import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { createPaymentUrl } from "@/lib/payments/vnpay/vnpay";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

function getClientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  return realIp ?? "127.0.0.1";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderId = body?.orderId as string | undefined;

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  try {
    // Load order từ Firestore và xác thực quyền
    const orderRef = doc(serverDb, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = orderSnap.data() as Order;
    // Verify order amount từ database, không tin client
    const amountVnd = order.totalAmount;

    if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE ?? "";
    const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
    const paymentGatewayUrl = process.env.VNPAY_PAYMENT_URL ?? "";
    const returnUrl = process.env.VNPAY_RETURN_URL ?? "";

    if (!tmnCode || !hashSecret || !paymentGatewayUrl || !returnUrl) {
      return NextResponse.json({ error: "Missing VNPay env config" }, { status: 500 });
    }

    const url = createPaymentUrl(
      { tmnCode, hashSecret, paymentUrl: paymentGatewayUrl, returnUrl },
      {
        txnRef: orderId,
        amountVnd,
        orderInfo: `Thanh toan don hang ${orderId}`,
        ipAddr: getClientIp(request),
        locale: "vn",
        orderType: "other",
      }
    );

    return NextResponse.json({ paymentUrl: url });
  } catch {
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 }
    );
  }
}
