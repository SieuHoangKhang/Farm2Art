/**
 * POST /api/payments/vnpay/create-invoice
 * Tạo link thanh toán VNPay cho hóa đơn dịch vụ (seller trả phí cho platform)
 */

import { NextResponse } from "next/server";
import { createPaymentUrl } from "@/lib/payments/vnpay/vnpay";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SellerInvoice } from "@/types/invoice";

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
  const invoiceId = body?.invoiceId as string | undefined;
  const sellerId = body?.sellerId as string | undefined;

  if (!invoiceId || !sellerId) {
    return NextResponse.json(
      { error: "Thiếu invoiceId hoặc sellerId" },
      { status: 400 }
    );
  }

  try {
    const db = getAdminDb();
    const invSnap = await db.collection("invoices").doc(invoiceId).get();

    if (!invSnap.exists) {
      return NextResponse.json({ error: "Không tìm thấy hóa đơn" }, { status: 404 });
    }

    const inv = invSnap.data() as SellerInvoice;

    if (inv.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Bạn không có quyền thanh toán hóa đơn này" },
        { status: 403 }
      );
    }

    if (inv.status === "paid") {
      return NextResponse.json(
        { error: "Hóa đơn này đã được thanh toán" },
        { status: 400 }
      );
    }

    const totalDeductions = inv.totalDeductions ?? 0;
    const adjustmentsTotal = inv.adjustmentsTotal ?? 0;
    const amountVnd = Math.max(totalDeductions - adjustmentsTotal, 0);
    if (!Number.isFinite(amountVnd) || amountVnd <= 0) {
      return NextResponse.json(
        { error: "Hóa đơn không có số tiền cần thanh toán" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Cấu hình VNPay chưa đầy đủ" },
        { status: 500 }
      );
    }

    // TxnRef dạng inv_{invoiceId} để return handler biết là thanh toán hóa đơn
    const txnRef = `inv_${invoiceId}`;

    const url = createPaymentUrl(
      { tmnCode, hashSecret, paymentUrl: paymentGatewayUrl, returnUrl },
      {
        txnRef,
        amountVnd,
        orderInfo: `Thanh toan hoa don ${inv.invoiceNumber}`,
        ipAddr: getClientIp(request),
        locale: "vn",
        orderType: "other",
        ...(ipnUrl ? { ipnUrl } : {}),
      }
    );

    return NextResponse.json({ paymentUrl: url });
  } catch (e) {
    console.error("create-invoice VNPay error:", e);
    return NextResponse.json(
      { error: "Không thể tạo giao dịch thanh toán" },
      { status: 500 }
    );
  }
}
