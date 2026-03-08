import { NextResponse } from "next/server";
import { verifyVnpayReturn } from "@/lib/payments/vnpay/vnpay";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
  if (!hashSecret) return NextResponse.json({ error: "Missing VNPAY_HASH_SECRET" }, { status: 500 });

  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) params[k] = v;

  const verified = verifyVnpayReturn(params, hashSecret);
  if (!verified.ok) {
    return NextResponse.redirect(new URL("/orders?payment=failed", request.url));
  }

  // Redirect about payment result
  const isSuccess = verified.code === "00";
  const orderId = verified.params.vnp_TxnRef;
  const transactionRef = verified.params.vnp_TransactionNo;
  const payDateRaw = verified.params.vnp_PayDate;

  // Fallback update at return step (useful in local dev where VNPay IPN cannot call localhost)
  if (isSuccess && orderId) {
    try {
      const orderRef = doc(serverDb, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        const updates: Partial<Order> = {};

        if (order.status === "pending") {
          updates.status = "confirmed";
          updates.confirmedAt = Date.now();
        }

        if (order.paymentStatus !== "success") {
          updates.paymentStatus = "success";
          updates.paymentMethod = "vnpay";
          updates.paidAt = Date.now();
        }

        if (!order.transactionRef && transactionRef) {
          updates.transactionRef = transactionRef;
        }

        if (Object.keys(updates).length > 0) {
          await updateDoc(orderRef, updates);
        }
      }
    } catch (error) {
      console.error("VNPay return fallback update failed:", error);
    }
  }

  if (isSuccess) {
    const txn = transactionRef ? `&txnRef=${encodeURIComponent(transactionRef)}` : "";
    const paidAt = payDateRaw ? `&paidAt=${encodeURIComponent(payDateRaw)}` : "";
    return NextResponse.redirect(new URL(`/orders/${orderId}?payment=success${txn}${paidAt}`, request.url));
  } else {
    return NextResponse.redirect(new URL(`/orders/${orderId}?payment=failed`, request.url));
  }
}
