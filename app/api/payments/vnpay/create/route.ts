import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { createPaymentUrl } from "@/lib/payments/vnpay/vnpay";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

function getClientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const candidate = xff.split(",")[0].trim();
    if (candidate === "::1" || candidate === "::ffff:127.0.0.1") return "127.0.0.1";
    return candidate;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp === "::1" || realIp === "::ffff:127.0.0.1") return "127.0.0.1";
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
    const warehouseFeeTotal =
      order.warehouseService?.serviceFeeTotal ??
      ((order.warehouseService?.storageFee ?? 0) +
        (order.warehouseService?.processingFee ?? 0) +
        (order.warehouseService?.shippingFee ?? 0));
    const amountVnd =
      order.grandTotal ??
      (order.subTotal ?? order.totalAmount) +
        (order.platformFee ?? 0) +
        warehouseFeeTotal;

    if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
      return NextResponse.json({ error: "Invalid order amount" }, { status: 400 });
    }

    const tmnCode = process.env.VNPAY_TMN_CODE ?? "";
    const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
    const paymentGatewayUrl = process.env.VNPAY_PAYMENT_URL ?? "";
    const requestOrigin = new URL(request.url).origin;
    const envReturnUrl = (process.env.VNPAY_RETURN_URL ?? "").trim();
    const isLocalEnvReturn = /localhost|127\.0\.0\.1/i.test(envReturnUrl);
    const returnUrl =
      envReturnUrl && !isLocalEnvReturn
        ? envReturnUrl
        : `${requestOrigin}/api/payments/vnpay/return`;

    const envIpnUrl = (process.env.VNPAY_IPN_URL ?? "").trim();
    const isLocalIpn = /localhost|127\.0\.0\.1/i.test(envIpnUrl);
    const ipnUrl = envIpnUrl && !isLocalIpn ? envIpnUrl : "";

    if (!tmnCode || !hashSecret || !paymentGatewayUrl) {
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
        ...(ipnUrl ? { ipnUrl } : {}),
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
