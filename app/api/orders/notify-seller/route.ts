/**
 * POST /api/orders/notify-seller
 * Thông báo cho seller khi có đơn hàng mới + chi tiết các khoản phí
 */

import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/types/order";
import { Listing } from "@/types/listing";
import { calculateOrderFeeBreakdown, PLATFORM_CONFIG } from "@/lib/config/platformFees";
import { adminDb } from "@/lib/firebase/admin";

const db = adminDb;

interface NotifySellerRequest {
  orderId: string;
  // ❌ REMOVED: processingMode - will be taken from listing.processingPreference
}

export async function POST(req: NextRequest) {
  try {
    const body: NotifySellerRequest = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId bắt buộc" },
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

    // 2. Lấy thông tin listing để biết processingPreference của seller
    const listingDoc = await db.collection("listings").doc(order.listingId).get();
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const listing = listingDoc.data() as Listing;
    const processingMode =
      listing.processingPreference === "self" ? "self" : "warehouse";

    // 3. Tính fee breakdown dựa theo lựa chọn của seller
    // Tính storageDays từ pickupDate → readyToShipDate (sẳn vận chuyển)
    const feeBreakdown = calculateOrderFeeBreakdown({
      subTotal: order.subTotal || order.totalAmount,
      weight: order.items?.[0]?.weight || 0,
      pickupDate: order.pickupDate,
      readyToShipDate: order.readyToShipDate,
      processingMode,
      commissionRate: order.commissionRate || PLATFORM_CONFIG.defaultCommissionRate,
    });

    // 4. Lấy thông tin buyer
    const buyerDoc = await db.collection("users").doc(order.buyerId).get();
    const buyerName = buyerDoc.data()?.name || buyerDoc.data()?.email || "Khách hàng";

    // 5. Lấy thông tin seller
    const sellerDoc = await db.collection("users").doc(order.sellerId).get();
    const sellerName = sellerDoc.data()?.name || sellerDoc.data()?.email || order.sellerName;

    // 6. Tạo message cho seller
    const processingModeText = {
      self: "Bạn tự sơ chế (Platform chỉ đi lấy)",
      warehouse: "Platform sơ chế tại kho",
    };

    const message = {
      senderId: "system",
      receiverId: order.sellerId,
      type: "order_notification",
      content: `
📦 **ĐƠN HÀNG MỚI** - ${order.id.slice(0, 8).toUpperCase()}

👤 **Khách hàng:** ${buyerName}
📅 **Thời gian:** ${new Date(order.createdAt).toLocaleDateString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}

🏭 **Loại xử lý:** ${processingModeText[processingMode] || "Warehouse xử lý"}
(Bạn đã chọn sẳn khi tạo sản phẩm)

📦 **Chi tiết sản phẩm:**
${order.items
  ?.map(
    (item, idx) =>
      `${idx + 1}. ${item.name} - ${item.quantity}${item.quantity > 1 ? " cái" : ""} x ${item.price.toLocaleString("vi-VN")}đ`
  )
  .join("\n")}

💰 **BẢNG PHÂN BỔ TIỀN:**

Giá sản phẩm:                    ${feeBreakdown.subTotal.toLocaleString("vi-VN")}đ
├─ Phí đi lấy:                   -${feeBreakdown.pickupFee.toLocaleString("vi-VN")}đ
${
  feeBreakdown.processingFee > 0
    ? `├─ Phí sơ chế (${feeBreakdown.weight || 0}kg):     -${feeBreakdown.processingFee.toLocaleString("vi-VN")}đ\n`
    : ""
}${
  feeBreakdown.storageFee > 0
    ? `├─ Phí lưu kho (7 ngày):          -${feeBreakdown.storageFee.toLocaleString("vi-VN")}đ\n`
    : ""
}└─ Hoa hồng (${(feeBreakdown.commission * 100).toFixed(0)}%):              -${feeBreakdown.commissionAmount.toLocaleString("vi-VN")}đ

📊 **Kết quả:**
Tổng chi phí:                    -${feeBreakdown.totalDeductions.toLocaleString("vi-VN")}đ
**Bạn sẽ nhận:**                 **${feeBreakdown.sellerPayout.toLocaleString("vi-VN")}đ**

📄 Hóa đơn chi tiết sẽ được gửi sau khi thanh toán được xác nhận.
⏱️ Thanh toán sẽ được chuyển sau 3 ngày xác nhận giao hàng.

👉 Vui lòng tiếp nhận đơn hàng hoặc từ chối trong mục "Đơn hàng"
      `.trim(),
      orderId,
      feeDetails: {
        pickupFee: feeBreakdown.pickupFee,
        processingFee: feeBreakdown.processingFee,
        storageFee: feeBreakdown.storageFee,
        commissionAmount: feeBreakdown.commissionAmount,
        totalDeductions: feeBreakdown.totalDeductions,
        sellerPayout: feeBreakdown.sellerPayout,
        commissionPercentage: feeBreakdown.commission * 100,
      },
      createdAt: Date.now(),
      read: false,
    };

    // 7. Save message
    const messageRef = await db.collection("messages").add(message);

    // 8. Optionally create notification
    await db.collection("notifications").add({
      userId: order.sellerId,
      type: "new_order",
      title: "Đơn hàng mới",
      content: `${buyerName} vừa đặt hàng: ${order.items?.[0]?.name || "sản phẩm"}`,
      orderId,
      messageId: messageRef.id,
      read: false,
      createdAt: Date.now(),
    });

    return NextResponse.json(
      {
        success: true,
        messageId: messageRef.id,
        notification: {
          orderId,
          sellerId: order.sellerId,
          buyerName,
          processingMode,
          totalFees: feeBreakdown.totalDeductions,
          sellerReceives: feeBreakdown.sellerPayout,
          notificationSent: true,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Lỗi thông báo seller:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi thông báo seller" },
      { status: 500 }
    );
  }
}
