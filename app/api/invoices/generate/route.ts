/**
 * POST /api/invoices/generate
 * Tự động tạo hóa đơn khi order hoàn thành & gửi cho seller qua tin nhắn
 */

import { NextRequest, NextResponse } from "next/server";
import { SellerInvoice, InvoiceLineItem } from "@/types/invoice";
import { Order } from "@/types/order";
import { Listing } from "@/types/listing";
import { calculateOrderFeeBreakdown, PLATFORM_CONFIG } from "@/lib/config/platformFees";
import { getAdminDb } from "@/lib/firebase/admin";

interface GenerateInvoiceRequest {
  orderId: string;
  sellerId: string;
}

/**
 * Tạo invoice number dạng: INV-202403-SELLER123-001
 */
const generateInvoiceNumber = (sellerId: string, sequence: number): string => {
  const date = new Date();
  const yearMonth = date.toISOString().slice(0, 7).replace("-", "");
  return `INV-${yearMonth}-${sellerId.slice(0, 8).toUpperCase()}-${String(sequence).padStart(3, "0")}`;
};

/**
 * Lấy sequence cho invoice của seller trong tháng
 */
const getInvoiceSequence = async (sellerId: string, db: FirebaseFirestore.Firestore): Promise<number> => {
  const countSnapshot = await db
    .collection("invoices")
    .where("sellerId", "==", sellerId)
    .where("createdAt", ">", new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime())
    .count()
    .get();

  return countSnapshot.data().count + 1;
};

/**
 * Tạo chi tiết invoice items từ order
 */
const createInvoiceLineItems = (order: Order, feeBreakdown: any): InvoiceLineItem[] => {
  const items: InvoiceLineItem[] = [];

  // 1. Phí đi lấy (Pickup Fee)
  items.push({
    id: `pickup-${order.id}`,
    type: "pickup_fee",
    description: `Phí đi lấy hàng từ kho (Đơn #${order.id.slice(0, 8)})`,
    amount: feeBreakdown.pickupFee,
    reference: { orderId: order.id },
  });

  // 2. Phí sơ chế (Processing Fee) - nếu có
  if (feeBreakdown.processingFee > 0) {
    items.push({
      id: `processing-${order.id}`,
      type: "processing_fee",
      description: `Phí sơ chế/chế biến (${feeBreakdown.weight || 0}kg @ ${PLATFORM_CONFIG.serviceFeesPerKg.cleaning.toLocaleString("vi-VN")}đ/kg)`,
      quantity: feeBreakdown.weight,
      unitPrice: PLATFORM_CONFIG.serviceFeesPerKg.cleaning,
      amount: feeBreakdown.processingFee,
      reference: { orderId: order.id },
    });
  }

  // 3. Phí lưu kho (Storage Fee) - nếu có
  if (feeBreakdown.storageFee > 0) {
    items.push({
      id: `storage-${order.id}`,
      type: "storage_fee",
      description: `Phí lưu kho (${feeBreakdown.weight || 0}kg x ${feeBreakdown.storageDays || 7} ngày @ ${PLATFORM_CONFIG.serviceFeesPerKg.storagePerDay.toLocaleString("vi-VN")}đ/kg/ngày)`,
      quantity: feeBreakdown.storageDays,
      unitPrice: PLATFORM_CONFIG.serviceFeesPerKg.storagePerDay * (feeBreakdown.weight || 0),
      amount: feeBreakdown.storageFee,
      reference: { orderId: order.id },
    });
  }

  // 4. Hoa hồng platform (Commission)
  items.push({
    id: `commission-${order.id}`,
    type: "commission",
    description: `Hoa hồng platform (${(feeBreakdown.commission * 100).toFixed(0)}% trên doanh thu)`,
    quantity: 1,
    unitPrice: feeBreakdown.commissionAmount,
    amount: feeBreakdown.commissionAmount,
    reference: { orderId: order.id },
  });

  return items;
};

/**
 * Gửi invoice cho seller qua hệ thống tin nhắn
 */
const sendInvoiceToSeller = async (
  sellerId: string,
  sellerName: string,
  invoice: SellerInvoice,
  db: FirebaseFirestore.Firestore
): Promise<{ messageId?: string; error?: string }> => {
  try {
    const message = {
      senderId: "system", // Từ hệ thống
      receiverId: sellerId,
      type: "invoice",
      content: `
📄 **Hóa Đơn Chi Tiết - ${invoice.invoiceNumber}**

👤 **Người bán:** ${sellerName}
📅 **Kỳ phát hành:** ${new Date(invoice.generatedAt!).toLocaleDateString("vi-VN")}

💰 **Chi Tiết Các Khoản Phí:**
├─ Phí đi lấy hàng: ${invoice.pickupFeesTotal.toLocaleString("vi-VN")}đ
├─ Phí sơ chế: ${invoice.processingFeesTotal.toLocaleString("vi-VN")}đ
├─ Phí lưu kho: ${invoice.storageFeesTotal.toLocaleString("vi-VN")}đ
└─ Hoa hồng platform: ${invoice.commissionTotal.toLocaleString("vi-VN")}đ

📊 **Tóm tắt:**
├─ Tổng doanh thu: ${invoice.grossRevenue.toLocaleString("vi-VN")}đ
├─ Tổng khoản trừ: ${invoice.totalDeductions.toLocaleString("vi-VN")}đ
└─ **Số tiền bạn sẽ nhận:** ${invoice.netPayout.toLocaleString("vi-VN")}đ

✅ Hóa đơn này sẽ được xử lý thanh toán sau 3 ngày xác nhận giao hàng.
📥 Tải PDF: Xem chi tiết đầy đủ trong mục "Hóa đơn"
      `.trim(),
      invoiceId: invoice.id,
      createdAt: Date.now(),
      read: false,
    };

    const docRef = await db.collection("messages").add(message);

    // Update invoice message reference
    await db.collection("invoices").doc(invoice.id).update({
      messageId: docRef.id,
      sentAt: Date.now(),
    });

    return { messageId: docRef.id };
  } catch (error: any) {
    console.error("Lỗi gửi invoice:", error);
    return { error: error.message };
  }
};

export async function POST(req: NextRequest) {
  const db = getAdminDb();
  try {
    const body: GenerateInvoiceRequest = await req.json();
    const { orderId, sellerId } = body;

    if (!orderId || !sellerId) {
      return NextResponse.json(
        { error: "orderId và sellerId bắt buộc" },
        { status: 400 }
      );
    }

    // 1. Lấy thông tin order
    const orderDoc = await db.collection("orders").doc(orderId).get();
    if (!orderDoc.exists) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    const order = orderDoc.data() as Order;

    // Idempotent guard: if invoice already linked, return existing invoice
    if (order.invoiceId) {
      const existingInvoiceDoc = await db.collection("invoices").doc(order.invoiceId).get();
      if (existingInvoiceDoc.exists) {
        const existing = existingInvoiceDoc.data() as SellerInvoice;
        return NextResponse.json(
          {
            success: true,
            invoice: {
              id: existingInvoiceDoc.id,
              invoiceNumber: existing.invoiceNumber,
              status: existing.status,
              grossRevenue: existing.grossRevenue,
              totalDeductions: existing.totalDeductions,
              netPayout: existing.netPayout,
              generatedAt: existing.generatedAt,
              messageSent: !!existing.sentAt,
            },
            reused: true,
          },
          { status: 200 }
        );
      }
    }

    // Kiểm tra seller match
    if (order.sellerId !== sellerId) {
      return NextResponse.json(
        { error: "Seller không khớp với order" },
        { status: 403 }
      );
    }

    // 1b. Lấy listing để biết processingMode & weight
    const listingDoc = await db.collection("listings").doc(order.listingId).get();
    const listing = listingDoc.exists ? (listingDoc.data() as Listing) : null;
    const processingMode =
      listing?.processingPreference === "self" ? "self" : "warehouse";
    const weight = order.items?.[0]?.weight || listing?.serviceFeeConfig?.weight || 0;

    // 2. Tính fee breakdown
    // Tính storageDays từ pickupDate → readyToShipDate
    const feeBreakdown = calculateOrderFeeBreakdown({
      subTotal: order.subTotal || order.totalAmount,
      weight,
      pickupDate: order.pickupDate,
      readyToShipDate: order.readyToShipDate,
      processingMode,
      commissionRate: order.commissionRate || 0.1,
    });

    // 3. Tạo invoice line items
    const lineItems = createInvoiceLineItems(order, feeBreakdown);

    // 4. Lấy seller info
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    const sellerName = sellerDoc.data()?.name || sellerDoc.data()?.email || sellerId;

    // 5. Tạo invoice number
    const sequence = await getInvoiceSequence(sellerId, db);
    const invoiceNumber = generateInvoiceNumber(sellerId, sequence);

    // 6. Tạo invoice record
    const invoice: SellerInvoice = {
      id: db.collection("invoices").doc().id,
      sellerId,
      sellerName,
      invoiceNumber,
      invoiceType: "order_based",
      periodStart: order.createdAt,
      periodEnd: Date.now(),
      lineItems,
      pickupFeesTotal: feeBreakdown.pickupFee,
      processingFeesTotal: feeBreakdown.processingFee,
      storageFeesTotal: feeBreakdown.storageFee,
      commissionTotal: feeBreakdown.commissionAmount,
      adjustmentsTotal: 0,
      totalDeductions: feeBreakdown.totalDeductions,
      grossRevenue: feeBreakdown.subTotal,
      netPayout: feeBreakdown.sellerPayout,
      status: "generated",
      createdAt: Date.now(),
      generatedAt: Date.now(),
      pdfUrl: "",
    };

    invoice.pdfUrl = `/api/invoices/${invoice.id}/pdf`;

    // 7. Save invoice to Firestore
    await db.collection("invoices").doc(invoice.id).set(invoice);

    // 8. Gửi invoice cho seller qua tin nhắn
    const sendResult = await sendInvoiceToSeller(sellerId, sellerName, invoice, db);

    if (sendResult.error) {
      console.error("Cảnh báo: Không gửi được tin nhắn, nhưng invoice đã tạo:", sendResult.error);
    }

    // 9. Update order reference
    await db.collection("orders").doc(orderId).update({
      invoiceId: invoice.id,
    });

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          grossRevenue: invoice.grossRevenue,
          totalDeductions: invoice.totalDeductions,
          netPayout: invoice.netPayout,
          generatedAt: invoice.generatedAt,
          messageSent: !sendResult.error,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lỗi tạo invoice:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tạo invoice" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices - Lấy hóa đơn của seller
 */
export async function GET(req: NextRequest) {
  const db = getAdminDb();
  try {
    const searchParams = req.nextUrl.searchParams;
    const sellerId = searchParams.get("sellerId");
    const status = searchParams.get("status");
    const all = searchParams.get("all") === "true";

    if (!sellerId && !all) {
      return NextResponse.json(
        { error: "sellerId bắt buộc (hoặc all=true cho admin)" },
        { status: 400 }
      );
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection("invoices");

    if (sellerId && !all) {
      query = query.where("sellerId", "==", sellerId);
    }

    if (status) {
      query = query.where("status", "==", status);
    }

    query = query.orderBy("createdAt", "desc");

    const snapshot = await query.limit(50).get();
    const invoices = snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return NextResponse.json({ invoices }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi lấy invoice:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi lấy invoice" },
      { status: 500 }
    );
  }
}
