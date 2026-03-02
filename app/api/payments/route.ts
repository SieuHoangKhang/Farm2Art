import { NextResponse } from "next/server";
import { doc, updateDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";

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
    const orderRef = doc(firebaseDb, "orders", orderId);
    await updateDoc(orderRef, {
      paymentMethod: method,
      paymentStatus: "paid",
      paidAmount: amount,
      paidAt: Date.now(),
      status: "confirmed",
    });

    return NextResponse.json({ success: true, orderId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Payment processing failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
