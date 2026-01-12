import { NextResponse } from "next/server";
import { verifyVnpayReturn } from "@/lib/payments/vnpay/vnpay";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
  if (!hashSecret) return NextResponse.json({ error: "Missing VNPAY_HASH_SECRET" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) params[k] = v;

  const verified = verifyVnpayReturn(params, hashSecret);
  if (!verified.ok) {
    return NextResponse.redirect(new URL("/account/orders?payment=failed", request.url));
  }

  // Redirect about payment result
  const isSuccess = verified.code === "00";
  const orderId = verified.params.vnp_TxnRef;

  if (isSuccess) {
    return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=success`, request.url));
  } else {
    return NextResponse.redirect(new URL(`/account/orders/${orderId}?payment=failed`, request.url));
  }
}
