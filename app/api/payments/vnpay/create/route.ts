import { NextResponse } from "next/server";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { createPaymentUrl } from "@/lib/payments/vnpay/vnpay";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export const runtime = "nodejs";
const ORDER_HOLD_TIMEOUT_MS = 30 * 60 * 1000;

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
  const phase = body?.phase as "deposit" | "remaining" | undefined;

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
    const now = Date.now();
    if (order.status === "pending" && now - order.createdAt >= ORDER_HOLD_TIMEOUT_MS) {
      await updateDoc(orderRef, {
        status: "cancelled",
        cancelledAt: now,
        cancelReason: "Quá 30 phút chưa thanh toán cọc",
      });
      return NextResponse.json({ error: "Đơn đã hết hạn thanh toán cọc" }, { status: 400 });
    }

    const productSubTotal =
      order.subTotal ??
      order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
      order.totalAmount;
    const depositAmount = Math.round(productSubTotal * 0.5);
    const remainingAmount = Math.max(productSubTotal - depositAmount, 0);

    const paymentPhase: "deposit" | "remaining" =
      phase === "remaining" || order.depositPaidAt ? "remaining" : "deposit";

    if (paymentPhase === "deposit" && order.depositPaidAt) {
      return NextResponse.json({ error: "Đơn đã thanh toán cọc" }, { status: 400 });
    }

    if (paymentPhase === "remaining" && order.remainingPaymentStatus === "received") {
      return NextResponse.json({ error: "Đơn đã thanh toán đủ 100%" }, { status: 400 });
    }

    // Ai cọc trước thì giữ đơn; các đơn còn lại cùng listing không được phép thanh toán cọc nữa.
    if (paymentPhase === "deposit" && order.listingId) {
      const sameListingSnap = await getDocs(
        query(collection(serverDb, "orders"), where("listingId", "==", order.listingId))
      );

      const hasWinner = sameListingSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) } as Order))
        .some((o) =>
          o.id !== orderId &&
          ["deposited", "shipping", "delivered", "completed"].includes(o.status)
        );

      if (hasWinner) {
        if (order.status === "pending") {
          await updateDoc(orderRef, {
            status: "cancelled",
            cancelledAt: now,
            cancelReason: "Sản phẩm đã được khách khác cọc trước",
          });
        }
        return NextResponse.json(
          { error: "Sản phẩm đã có khách cọc trước, đơn này đã bị từ chối" },
          { status: 400 }
        );
      }
    }

    // Người mua chỉ thanh toán tiền hàng theo từng pha: cọc 50% hoặc 50% còn lại.
    const amountVnd = paymentPhase === "remaining" ? remainingAmount : depositAmount;

    // Tự chuẩn hóa dữ liệu đơn cũ nếu trước đó bị lưu lệch tổng/cọc.
    if (
      order.depositAmount !== depositAmount ||
      order.remainingAmount !== remainingAmount ||
      order.grandTotal !== productSubTotal ||
      order.totalAmount !== productSubTotal
    ) {
      await updateDoc(orderRef, {
        subTotal: productSubTotal,
        grandTotal: productSubTotal,
        totalAmount: productSubTotal,
        depositAmount,
        remainingAmount,
      });
    }
    if (paymentPhase === "remaining" && amountVnd <= 0) {
      return NextResponse.json({ error: "Không còn khoản thanh toán còn lại" }, { status: 400 });
    }


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
        txnRef: paymentPhase === "remaining" ? `rem_${orderId}` : orderId,
        amountVnd,
        orderInfo:
          paymentPhase === "remaining"
            ? `Thanh toan 50 phan tram con lai don ${orderId}`
            : `Thanh toan dat coc don hang ${orderId}`,
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
