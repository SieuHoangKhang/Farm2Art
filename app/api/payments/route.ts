import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, amount, method } = body;

    if (!orderId || !amount || !method) {
      return NextResponse.json(
        { error: "Missing required fields: orderId, amount, method" },
        { status: 400 }
      );
    }

    // Update order payment status in Firestore
    const orderRef = doc(serverDb, "orders", orderId);
    const depositAmount = Math.round(Number(amount));
    await updateDoc(orderRef, {
      paymentMethod: method,
      paymentStatus: "pending",
      paidAmount: depositAmount,
      depositPaidAt: Date.now(),
      paymentReceivedAt: Date.now(),
      status: "deposited",
      escrowStatus: "held",
    });

    return NextResponse.json({ success: true, orderId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
