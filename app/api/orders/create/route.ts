import { NextResponse } from "next/server";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing } from "@/types/listing";
import type { Order } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { listingId, sellerId, quantity } = body;

    if (!listingId || !sellerId || !quantity) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Load listing để lấy thông tin
    const listingRef = doc(firebaseDb, "listings", listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    const listing = listingSnap.data() as Listing;

    // Create order
    const order: Omit<Order, "id"> = {
      listingId,
      sellerId,
      sellerName: listing.title,
      buyerId: "", // Will be set by client (from auth context)
      status: "pending" as const,
      totalAmount: listing.price * quantity,
      items: [
        {
          id: listingId,
          name: listing.title,
          price: listing.price,
          quantity,
        },
      ],
      createdAt: new Date().getTime(),
      paymentMethod: undefined,
    };

    const ordersRef = collection(firebaseDb, "orders");
    const docRef = await addDoc(ordersRef, order);

    return NextResponse.json({ orderId: docRef.id, success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}
