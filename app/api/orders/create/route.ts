import { NextResponse } from "next/server";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";
import type { Listing, ProcessingPreference } from "@/types/listing";
import type { Order, WarehouseProcessingMode } from "@/types/order";

const DEFAULT_STORAGE_DAYS = 0;
const MAX_STORAGE_DAYS = 30;
const STORAGE_FEE_PER_DAY = 2000;
const SHIPPING_FEE_RATE = 0.05;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      listingId,
      quantity,
      buyerId,
      sellerId: payloadSellerId,
      processingMode,
      storageDays,
    } = body;
    const parsedQuantity = Number(quantity);
    const parsedStorageDays = Number(storageDays);

    if (!listingId || !buyerId || !Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Load listing để lấy thông tin
    const listingRef = doc(serverDb, "listings", listingId);
    const listingSnap = await getDoc(listingRef);

    if (!listingSnap.exists()) {
      return NextResponse.json({ message: "Listing not found" }, { status: 404 });
    }

    const listing = listingSnap.data() as Listing;
    if (listing.status !== "active") {
      return NextResponse.json(
        { message: "Sản phẩm này hiện không còn mở bán" },
        { status: 400 }
      );
    }

    const sellerId = listing.sellerId || listing.ownerId || payloadSellerId;
    const processingPreference: ProcessingPreference =
      listing.processingPreference || "buyer_choice";

    if (!sellerId) {
      return NextResponse.json({ message: "Listing seller is invalid" }, { status: 400 });
    }

    if (buyerId === sellerId) {
      return NextResponse.json({ message: "Bạn không thể mua sản phẩm của chính mình" }, { status: 400 });
    }

    const buyerSnap = await getDoc(doc(serverDb, "users", buyerId));
    const sellerSnap = await getDoc(doc(serverDb, "users", sellerId));

    const buyer = buyerSnap.exists() ? (buyerSnap.data() as { accountStatus?: string }) : {};
    const seller = sellerSnap.exists()
      ? (sellerSnap.data() as {
          accountStatus?: string;
          sellerVerified?: boolean;
          displayName?: string;
          name?: string;
        })
      : {};

    if (buyer.accountStatus === "suspended") {
      return NextResponse.json({ message: "Tài khoản người mua đang bị khóa" }, { status: 403 });
    }

    if (seller.accountStatus === "suspended") {
      return NextResponse.json({ message: "Người bán hiện đang bị khóa tài khoản" }, { status: 403 });
    }

    // Seller verification is no longer required to place orders
    // Orders can proceed even if seller hasn't completed verification

    const requestedMode: WarehouseProcessingMode =
      processingMode === "seller_self" ? "seller_self" : "warehouse";

    // Nếu seller để buyer_choice thì buyer có thể tick dịch vụ ở UI.
    // Nếu seller chốt cứng, hệ thống dùng cấu hình đó.
    const finalProcessingMode: WarehouseProcessingMode =
      processingPreference === "self"
        ? "seller_self"
        : processingPreference === "warehouse"
          ? "warehouse"
          : requestedMode;

    const useWarehouseShipping = finalProcessingMode === "warehouse";

    const finalStorageDays = Number.isFinite(parsedStorageDays)
      ? Math.max(0, Math.min(Math.floor(parsedStorageDays), MAX_STORAGE_DAYS))
      : DEFAULT_STORAGE_DAYS;

    const commissionRate =
      listing.agreement?.commissionRate ?? listing.commissionRate ?? 0.2;

    const subTotal = listing.price * parsedQuantity;
    const platformFee = Math.round(subTotal * commissionRate);
    const storageFee = finalStorageDays * STORAGE_FEE_PER_DAY;
    const processingFee = 0;
    const shippingFee = useWarehouseShipping ? Math.round(subTotal * SHIPPING_FEE_RATE) : 0;
    const serviceFeeTotal = storageFee + processingFee + shippingFee;
    // Khách chỉ trả đúng tiền sản phẩm; phí vận chuyển được khấu trừ phía seller cùng hoa hồng.
    const grandTotal = subTotal;
    const depositAmount = Math.round(subTotal * 0.5);
    const remainingAmount = Math.max(subTotal - depositAmount, 0);
    const sellerPayout = Math.max(subTotal - platformFee, 0);

    // Create order
    const order: Omit<Order, "id"> = {
      listingId,
      sellerId,
      sellerName: seller.displayName || seller.name || undefined,
      buyerId,
      status: "pending" as const,
      paymentStatus: "pending",
      depositAmount,
      remainingAmount,
      remainingPaymentStatus: "pending",
      subTotal,
      totalAmount: grandTotal,
      platformFee,
      commissionRate,
      warehouseService: useWarehouseShipping
        ? {
            enabled: true,
            processingMode: "warehouse",
            storageDays: finalStorageDays,
            storageFee,
            processingFee,
            shippingFee,
            serviceFeeTotal,
            warehouseStatus: "in_stock",
          }
        : undefined,
      grandTotal,
      sellerPayout,
      items: [
        {
          id: listingId,
          name: listing.title,
          price: listing.price,
          quantity: parsedQuantity,
        },
      ],
      createdAt: new Date().getTime(),
    };

    const ordersRef = collection(serverDb, "orders");
    const docRef = await addDoc(ordersRef, order);

    return NextResponse.json({ orderId: docRef.id, success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create order";
    return NextResponse.json({ message }, { status: 500 });
  }
}
