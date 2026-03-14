/**
 * POST /api/invoices/create-manual
 * Admin tạo hóa đơn thủ công cho seller và gửi qua tin nhắn
 */

import { NextRequest, NextResponse } from "next/server";
import { SellerInvoice, InvoiceLineItem } from "@/types/invoice";
import { getAdminDb } from "@/lib/firebase/admin";

interface ManualInvoiceRequest {
  sellerId: string;
  invoiceType: "monthly" | "adjustment" | "order_based";
  periodStart?: number;
  periodEnd?: number;
  // Cho phép admin nhập tay doanh thu/tiền ròng khi tạo hóa đơn thủ công
  grossRevenue?: number; // Tổng doanh thu (VNĐ)
  netPayout?: number; // Tiền seller nhận (VNĐ)
  lineItems: Array<{
    type: InvoiceLineItem["type"];
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
    reference?: { orderId?: string; listingId?: string };
  }>;
  notes?: string;
  sendToSeller?: boolean; // Gửi qua tin nhắn hay không
}

const generateInvoiceNumber = (sellerId: string, sequence: number): string => {
  const date = new Date();
  const yearMonth = date.toISOString().slice(0, 7).replace("-", "");
  return `INV-${yearMonth}-${sellerId.slice(0, 8).toUpperCase()}-${String(sequence).padStart(3, "0")}`;
};

const getInvoiceSequence = async (sellerId: string, db: FirebaseFirestore.Firestore): Promise<number> => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const snapshot = await db
    .collection("invoices")
    .where("sellerId", "==", sellerId)
    .get();
  const count = snapshot.docs.filter((d) => (d.data().createdAt as number) >= monthStart).length;
  return count + 1;
};

const sendInvoiceToSeller = async (
  sellerId: string,
  sellerName: string,
  invoice: SellerInvoice,
  db: FirebaseFirestore.Firestore
): Promise<{ messageId?: string; error?: string }> => {
  try {
    const message = {
      senderId: "system",
      receiverId: sellerId,
      type: "invoice",
      content: `
📄 **Hóa Đơn Chi Tiết - ${invoice.invoiceNumber}**

👤 **Người bán:** ${sellerName}
📅 **Kỳ phát hành:** ${new Date(invoice.generatedAt!).toLocaleDateString("vi-VN")}
📝 **Loại hóa đơn:** ${invoice.invoiceType === "monthly" ? "Hàng tháng" : invoice.invoiceType === "adjustment" ? "Điều chỉnh" : "Theo đơn hàng"}

💰 **Chi Tiết Các Khoản Phí:**
${invoice.lineItems.map((item, idx) => `├─ ${idx + 1}. ${item.description}: ${item.amount.toLocaleString("vi-VN")}đ`).join("\n")}

📊 **Tóm tắt:**
├─ Tổng doanh thu: ${invoice.grossRevenue.toLocaleString("vi-VN")}đ
├─ Tổng khoản trừ: ${invoice.totalDeductions.toLocaleString("vi-VN")}đ
└─ **Số tiền bạn sẽ nhận:** ${invoice.netPayout.toLocaleString("vi-VN")}đ

${invoice.notes ? `📋 **Ghi chú:** ${invoice.notes}\n` : ""}
✅ Hóa đơn này sẽ được xử lý thanh toán sau 3 ngày xác nhận.
📥 Tải PDF: Xem chi tiết đầy đủ trong mục "Hóa đơn"
      `.trim(),
      invoiceId: invoice.id,
      createdAt: Date.now(),
      read: false,
    };

    const docRef = await db.collection("messages").add(message);

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
    const body: ManualInvoiceRequest = await req.json();
    const { sellerId, invoiceType, periodStart, periodEnd, lineItems, notes, sendToSeller } = body;

    if (!sellerId || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "sellerId và lineItems bắt buộc" },
        { status: 400 }
      );
    }

    // Validate line items
    const validTypes = ["pickup_fee", "processing_fee", "storage_fee", "commission", "adjustment"];
    for (const item of lineItems) {
      if (!validTypes.includes(item.type)) {
        return NextResponse.json(
          { error: `Loại phí không hợp lệ: ${item.type}` },
          { status: 400 }
        );
      }
      if (!item.description || item.amount === undefined) {
        return NextResponse.json(
          { error: "Mỗi line item cần có description và amount" },
          { status: 400 }
        );
      }
    }

    // Lấy thông tin seller
    const sellerDoc = await db.collection("users").doc(sellerId).get();
    if (!sellerDoc.exists) {
      return NextResponse.json(
        { error: "Không tìm thấy người bán" },
        { status: 404 }
      );
    }
    const sellerData = sellerDoc.data();
    const sellerName = sellerData?.name || sellerData?.displayName || sellerData?.email || sellerId;

    // Tính toán các khoản
    const pickupFeesTotal = lineItems
      .filter((i) => i.type === "pickup_fee")
      .reduce((sum, i) => sum + i.amount, 0);
    const processingFeesTotal = lineItems
      .filter((i) => i.type === "processing_fee")
      .reduce((sum, i) => sum + i.amount, 0);
    const storageFeesTotal = lineItems
      .filter((i) => i.type === "storage_fee")
      .reduce((sum, i) => sum + i.amount, 0);
    const commissionTotal = lineItems
      .filter((i) => i.type === "commission")
      .reduce((sum, i) => sum + i.amount, 0);
    const adjustmentsTotal = lineItems
      .filter((i) => i.type === "adjustment")
      .reduce((sum, i) => sum + i.amount, 0);

    // Tổng doanh thu = tổng các khoản trừ + net payout
    // Hoặc có thể tính riêng - ở đây chúng ta giả định grossRevenue = tổng tất cả
    const totalDeductions = pickupFeesTotal + processingFeesTotal + storageFeesTotal + commissionTotal;
    
    // Gross revenue = net payout + deductions (nếu là điều chỉnh âm thì gross có thể nhỏ hơn)
    // Với manual invoice, chúng ta sẽ yêu cầu grossRevenue hoặc tính mặc định
    const grossRevenue = body.grossRevenue || (totalDeductions + (body.netPayout || 0));
    const netPayout = grossRevenue - totalDeductions + adjustmentsTotal;

    // Tạo invoice number
    const sequence = await getInvoiceSequence(sellerId, db);
    const invoiceNumber = generateInvoiceNumber(sellerId, sequence);

    // Tạo invoice record
    const invoice: SellerInvoice = {
      id: db.collection("invoices").doc().id,
      sellerId,
      sellerName,
      invoiceNumber,
      invoiceType: invoiceType || "adjustment",
      periodStart: periodStart || Date.now(),
      periodEnd: periodEnd || Date.now(),
      lineItems: lineItems.map((item, idx) => ({
        id: `manual-${idx}-${Date.now()}`,
        ...item,
      })),
      pickupFeesTotal,
      processingFeesTotal,
      storageFeesTotal,
      commissionTotal,
      adjustmentsTotal,
      // Keep raw deductions; adjustments are tracked separately.
      totalDeductions,
      grossRevenue,
      netPayout,
      status: sendToSeller ? "sent" : "generated",
      createdAt: Date.now(),
      generatedAt: Date.now(),
      notes: notes || "",
      pdfUrl: `/api/invoices/${db.collection("invoices").doc().id}/pdf`,
    };

    // Fix PDF URL với đúng ID
    const invoiceId = invoice.id;
    invoice.pdfUrl = `/api/invoices/${invoiceId}/pdf`;

    // Save invoice to Firestore
    await db.collection("invoices").doc(invoiceId).set(invoice);

    // Gửi invoice cho seller nếu được yêu cầu
    // Dùng kiểu optional để phù hợp hàm sendInvoiceToSeller
    let messageResult: { messageId?: string; error?: string } = {};
    if (sendToSeller) {
      messageResult = await sendInvoiceToSeller(sellerId, sellerName, invoice, db);
    }

    return NextResponse.json(
      {
        success: true,
        invoice: {
          id: invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          grossRevenue: invoice.grossRevenue,
          totalDeductions: invoice.totalDeductions,
          netPayout: invoice.netPayout,
          generatedAt: invoice.generatedAt,
          messageSent: !!messageResult.messageId,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lỗi tạo invoice thủ công:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi tạo hóa đơn" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/invoices/create-manual
 * Lấy danh sách sellers để admin chọn
 */
export async function GET(req: NextRequest) {
  const db = getAdminDb();
  try {
    const searchParams = req.nextUrl.searchParams;
    const all = searchParams.get("all");

    // Lấy tất cả users có sellerVerified = true hoặc lấy tất cả users
    let snapshot;
    if (all === "true") {
      snapshot = await db.collection("users").limit(100).get();
    } else {
      // Lấy users có sellerVerified = true
      snapshot = await db.collection("users")
        .where("sellerVerified", "==", true)
        .limit(100)
        .get();
    }

    const sellers = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.displayName || data.email || "Unknown",
        email: data.email,
        sellerVerified: data.sellerVerified || false,
      };
    });

    return NextResponse.json({ sellers }, { status: 200 });
  } catch (error: any) {
    console.error("Lỗi lấy sellers:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi lấy danh sách người bán" },
      { status: 500 }
    );
  }
}
