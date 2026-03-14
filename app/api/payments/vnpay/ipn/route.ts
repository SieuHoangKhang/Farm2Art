import { NextResponse } from "next/server";
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { verifyVnpayReturn } from "@/lib/payments/vnpay/vnpay";
import { serverDb } from "@/lib/firebase/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Order } from "@/types/order";
import { PLATFORM_CONFIG } from "@/lib/config/platformFees";

export const runtime = "nodejs";

// VNPay sẽ gọi IPN (server-to-server). Bạn phải verify chữ ký và phản hồi đúng format.
export async function GET(request: Request) {
  const hashSecret = process.env.VNPAY_HASH_SECRET ?? "";
  if (!hashSecret) {
    return NextResponse.json({ RspCode: "99", Message: "Missing config" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};
  for (const [k, v] of searchParams.entries()) params[k] = v;

  const verified = verifyVnpayReturn(params, hashSecret);
  if (!verified.ok) {
    return NextResponse.json({ RspCode: "97", Message: "Invalid signature" }, { status: 200 });
  }

  const txnRef = verified.params.vnp_TxnRef;
  const amountVnd = verified.params.vnp_Amount ? parseInt(verified.params.vnp_Amount) / 100 : 0;
  const isSuccess = verified.code === "00";

  // Thanh toan 50% con lai (txnRef = rem_{orderId})
  if (txnRef.startsWith("rem_")) {
    const orderId = txnRef.slice(4);
    try {
      const orderRef = doc(serverDb, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) {
        return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
      }

      const order = orderSnap.data() as Order;
      const productSubTotal =
        order.subTotal ??
        order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
        order.totalAmount;
      const expectedRemaining = Math.max(productSubTotal - Math.round(productSubTotal * 0.5), 0);

      if (expectedRemaining !== amountVnd) {
        return NextResponse.json({ RspCode: "04", Message: "Amount mismatch" }, { status: 200 });
      }

      if (order.remainingPaymentStatus === "received") {
        return NextResponse.json({ RspCode: "00", Message: "Already confirmed" }, { status: 200 });
      }

      if (isSuccess) {
        const now = Date.now();
        await updateDoc(orderRef, {
          paymentMethod: "vnpay",
          paymentStatus: "success",
          paidAt: now,
          paidAmount: productSubTotal,
          remainingPaymentStatus: "received",
          remainingPaymentReceivedAt: now,
          remainingPaymentReference: verified.params.vnp_TransactionNo || null,
          escrowStatus: "held",
        });
      } else {
        await updateDoc(orderRef, {
          paymentMethod: "vnpay",
          remainingPaymentStatus: "pending",
        });
      }

      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
    } catch (e) {
      console.error("IPN remaining-payment error:", e);
      return NextResponse.json({ RspCode: "99", Message: "Server error" }, { status: 200 });
    }
  }

  // Thanh toán hóa đơn (txnRef = inv_{invoiceId})
  if (txnRef.startsWith("inv_")) {
    const invoiceId = txnRef.slice(4);
    try {
      const db = getAdminDb();
      const invRef = db.collection("invoices").doc(invoiceId);
      const invSnap = await invRef.get();
      if (!invSnap.exists) {
        return NextResponse.json({ RspCode: "01", Message: "Invoice not found" }, { status: 200 });
      }
      const inv = invSnap.data()!;
      if (inv.status === "paid") {
        return NextResponse.json({ RspCode: "00", Message: "Already confirmed" }, { status: 200 });
      }
      const amountDue = Math.max((inv.totalDeductions || 0) - (inv.adjustmentsTotal || 0), 0);
      if (amountDue !== amountVnd) {
        return NextResponse.json({ RspCode: "04", Message: "Amount mismatch" }, { status: 200 });
      }
      if (isSuccess) {
        await invRef.update({
          status: "paid",
          paidAt: Date.now(),
          paymentMethod: "vnpay",
          transactionRef: verified.params.vnp_TransactionNo || null,
        });
      }
      return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
    } catch (e) {
      console.error("IPN invoice error:", e);
      return NextResponse.json({ RspCode: "99", Message: "Server error" }, { status: 200 });
    }
  }

  // Thanh toán đơn hàng
  const orderId = txnRef;
  try {
    const orderRef = doc(serverDb, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ RspCode: "01", Message: "Order not found" }, { status: 200 });
    }

    const order = orderSnap.data() as Order;
    // Lần thanh toán VNPay đầu tiên là tiền cọc đúng 50% tiền hàng.
    const productSubTotal =
      order.subTotal ??
      order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
      order.totalAmount;
    const expectedAmount = Math.round(productSubTotal * 0.5);

    // Nếu đã có đơn khác cọc thành công cùng listing thì từ chối đơn hiện tại.
    if (order.listingId) {
      const sameListingSnap = await getDocs(
        query(collection(serverDb, "orders"), where("listingId", "==", order.listingId))
      );
      const hasWinner = sameListingSnap.docs
        .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) } as Order))
        .some(
          (o) =>
            o.id !== orderId &&
            ["deposited", "shipping", "delivered", "completed"].includes(o.status)
        );

      if (hasWinner) {
        await updateDoc(orderRef, {
          status: "cancelled",
          cancelledAt: Date.now(),
          cancelReason: "Sản phẩm đã được khách khác cọc trước",
          paymentStatus: "failed",
        });
        return NextResponse.json({ RspCode: "02", Message: "Order rejected: already reserved" }, { status: 200 });
      }
    }

    // Kiểm tra số tiền khớp
    if (expectedAmount !== amountVnd) {
      return NextResponse.json({ RspCode: "04", Message: "Amount mismatch" }, { status: 200 });
    }

    // Kiểm tra chưa được thanh toán
    if (order.status !== "pending" || order.depositPaidAt) {
      return NextResponse.json(
        { RspCode: "02", Message: "Order already deposited or invalid status" },
        { status: 200 }
      );
    }

    // Cập nhật trạng thái thanh toán
    if (isSuccess) {
      // ✅ LOGIC MỚI THEO YÊU CẦU:
      // - Buyer chỉ trả tiền hàng (grandTotal = subTotal)
      // - Admin chỉ trừ phí HOA HỒNG từ tiền buyer
      // - Phí vận chuyển, sơ chế, giữ hàng đã thương lượng trước với seller
      //   → sẽ tạo hóa đơn riêng cho seller hoặc trừ khi đối soát (settlement)

        const commissionRate = order.commissionRate ?? PLATFORM_CONFIG.defaultCommissionRate;
        const commissionAmount = Math.round(productSubTotal * commissionRate);

        // Seller nhận tiền hàng sau khi trừ hoa hồng; phí dịch vụ buyer chọn thuộc về platform.
        const payoutAmount = Math.max(productSubTotal - commissionAmount, 0);

      // Các phí dịch vụ (pickup, processing, storage, shipping) sẽ được tính riêng
      // và gửi hóa đơn cho seller HOẶC trừ khi đối soát (settlement)
      const warehouseService = order.warehouseService;
      const pickupFee = warehouseService?.processingFee ? PLATFORM_CONFIG.pickupFeePerOrder : 0;
      const processingFee = warehouseService?.processingFee || 0;
      const storageFee = warehouseService?.storageFee || 0;
      const shippingFee = warehouseService?.shippingFee || 0;

      await updateDoc(orderRef, {
        status: "deposited",
        paymentMethod: "vnpay",
        paymentStatus: "pending",
        paidAmount: expectedAmount,
        depositPaidAt: new Date().getTime(),
        paymentReceivedAt: new Date().getTime(),
        transactionRef: verified.params.vnp_TransactionNo,

        // ✅ ESCROW: Tiền buyer đã nhận, chỉ trừ hoa hồng
        escrowStatus: "held",
        commissionRate,
        commissionAmount,
        payoutAmount, // ✅ Seller nhận: grandTotal - commission (các phí khác tính riêng)

        // Lưu chi tiết để theo dõi (các phí này KHÔNG trừ vào tiền buyer)
        feeBreakdown: {
          commissionAmount,
          pickupFee,        // Seller chịu - tạo invoice riêng
          processingFee,    // Seller chịu - tạo invoice riêng
          storageFee,       // Seller chịu - tạo invoice riêng
          shippingFee,      // Seller chịu - tạo invoice riêng
          totalPlatformFees: commissionAmount + processingFee + storageFee + shippingFee,
          grandTotal: productSubTotal,
        },

        payoutStatus: "pending",
      });

      // Gửi thông báo cho admin biết đơn đã cọc 50% và có thể bắt đầu giao hàng.
      await addDoc(collection(serverDb, "notifications"), {
        userId: "admin",
        type: "order_deposit_confirmed",
        title: "Đơn hàng đã cọc 50%",
        message: `Đơn #${orderId.slice(0, 8)} đã cọc thành công. Admin có thể bấm Giao hàng.`,
        orderId,
        read: false,
        createdAt: Date.now(),
        timestamp: Date.now(),
        icon: "💳",
        action: {
          label: "Mở quản lý đơn",
          href: "/admin/orders",
        },
      });

      // Đẩy vào inbox admin-chat để badge admin cập nhật realtime.
      await addDoc(collection(serverDb, "admin_chat_messages"), {
        userId: order.buyerId,
        userName: order.buyerId,
        message: `Đơn #${orderId.slice(0, 8)} đã cọc 50% thành công. Sẵn sàng giao hàng.`,
        timestamp: new Date().toISOString(),
        isAdmin: false,
        read: false,
      });

      // Ẩn bài đăng và hủy toàn bộ đơn chưa cọc cùng listing, đồng thời thông báo cho buyer bị hủy.
      if (order.listingId) {
        await updateDoc(doc(serverDb, "listings", order.listingId), {
          status: "hidden",
          hiddenAt: Date.now(),
        });

        const sameListingSnap = await getDocs(
          query(collection(serverDb, "orders"), where("listingId", "==", order.listingId))
        );

        const toCancel = sameListingSnap.docs
          .map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) } as Order))
          .filter((o) => o.id !== orderId && o.status === "pending" && !o.depositPaidAt);

        for (const cancelled of toCancel) {
          await updateDoc(doc(serverDb, "orders", cancelled.id), {
            status: "cancelled",
            cancelledAt: Date.now(),
            cancelReason: "Đơn bị hủy vì có khách khác đã cọc trước",
          });

          await addDoc(collection(serverDb, "notifications"), {
            userId: cancelled.buyerId,
            type: "order_cancelled_unpaid",
            title: "Đơn hàng bị hủy",
            message: "Đơn của bạn đã bị hủy vì sản phẩm đã được khách khác cọc trước.",
            orderId: cancelled.id,
            read: false,
            createdAt: Date.now(),
            timestamp: Date.now(),
            icon: "❌",
            action: {
              label: "Xem đơn hàng",
              href: `/orders/${cancelled.id}`,
            },
          });
        }
      }
    } else {
      await updateDoc(orderRef, {
        paymentMethod: "vnpay",
        paymentStatus: "failed",
        escrowStatus: "refunded", // Nếu fail thì refund
      });
    }

    return NextResponse.json({ RspCode: "00", Message: "Confirm Success" }, { status: 200 });
  } catch (e) {
    console.error("IPN error:", e);
    return NextResponse.json({ RspCode: "99", Message: "Server error" }, { status: 200 });
  }
}
