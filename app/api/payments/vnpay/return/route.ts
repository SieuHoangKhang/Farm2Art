import { NextResponse } from "next/server";
import { verifyVnpayReturn } from "@/lib/payments/vnpay/vnpay";
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { serverDb } from "@/lib/firebase/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Order } from "@/types/order";
import { PLATFORM_CONFIG } from "@/lib/config/platformFees";

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

  const isSuccess = verified.code === "00";
  const txnRef = verified.params.vnp_TxnRef;
  const transactionRef = verified.params.vnp_TransactionNo;
  const payDateRaw = verified.params.vnp_PayDate;

  // Thanh toan 50% con lai (txnRef = rem_{orderId})
  if (txnRef.startsWith("rem_")) {
    const orderId = txnRef.slice(4);
    if (isSuccess && orderId) {
      try {
        const orderRef = doc(serverDb, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const order = orderSnap.data() as Order;
          const productSubTotal =
            order.subTotal ??
            order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
            order.totalAmount;
          const expectedRemaining = Math.max(productSubTotal - Math.round(productSubTotal * 0.5), 0);
          const amountVnd = verified.params.vnp_Amount ? parseInt(verified.params.vnp_Amount) / 100 : 0;

          if (expectedRemaining === amountVnd) {
            const now = Date.now();
            await updateDoc(orderRef, {
              paymentMethod: "vnpay",
              paymentStatus: "success",
              paidAt: now,
              paidAmount: productSubTotal,
              remainingPaymentStatus: "received",
              remainingPaymentReceivedAt: now,
              remainingPaymentReference: transactionRef || null,
              escrowStatus: "held",
            });
          }
        }
      } catch (error) {
        console.error("VNPay return remaining update failed:", error);
      }
    }

    const txn = transactionRef ? `&txnRef=${encodeURIComponent(transactionRef)}` : "";
    const paidAt = payDateRaw ? `&paidAt=${encodeURIComponent(payDateRaw)}` : "";
    return NextResponse.redirect(
      new URL(`/orders/${orderId}?payment=${isSuccess ? "success" : "failed"}&phase=remaining${txn}${paidAt}`, request.url)
    );
  }

  // Thanh toán hóa đơn (txnRef = inv_{invoiceId})
  if (txnRef.startsWith("inv_")) {
    const invoiceId = txnRef.slice(4);
    if (isSuccess && invoiceId) {
      try {
        const db = getAdminDb();
        const invRef = db.collection("invoices").doc(invoiceId);
        const invSnap = await invRef.get();
        if (invSnap.exists) {
          const inv = invSnap.data() as { totalDeductions?: number; adjustmentsTotal?: number };
          const amountVnd = verified.params.vnp_Amount ? parseInt(verified.params.vnp_Amount) / 100 : 0;
          const amountDue = Math.max((inv.totalDeductions || 0) - (inv.adjustmentsTotal || 0), 0);
          if (amountDue !== amountVnd) {
            throw new Error("Invoice amount mismatch on return");
          }
          await invRef.update({
            status: "paid",
            paidAt: Date.now(),
            paymentMethod: "vnpay",
            transactionRef: transactionRef || null,
          });
        }
      } catch (error) {
        console.error("VNPay return invoice update failed:", error);
      }
    }
    const base = new URL("/invoices", request.url);
    base.searchParams.set("payment", isSuccess ? "success" : "failed");
    return NextResponse.redirect(base);
  }

  // Thanh toán đơn hàng (txnRef = orderId)
  const orderId = txnRef;
  if (isSuccess && orderId) {
    try {
      const orderRef = doc(serverDb, "orders", orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        const updates: Partial<Order> = {};
        const productSubTotal =
          order.subTotal ??
          order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) ??
          order.totalAmount;
        const gross = productSubTotal;
        const depositAmount = Math.round(productSubTotal * 0.5);
        const commissionRate = order.commissionRate ?? PLATFORM_CONFIG.defaultCommissionRate;
        const commissionAmount = Math.round(productSubTotal * commissionRate);
        const pickupFee = order.warehouseService?.processingFee ? PLATFORM_CONFIG.pickupFeePerOrder : 0;
        const processingFee = order.warehouseService?.processingFee || 0;
        const storageFee = order.warehouseService?.storageFee || 0;
        const shippingFee = order.warehouseService?.shippingFee || 0;

        if (order.status === "pending") {
          updates.status = "deposited";
        }

        if (!order.depositPaidAt) {
          updates.paymentStatus = "pending";
          updates.paymentMethod = "vnpay";
          updates.paidAmount = depositAmount;
          updates.depositPaidAt = Date.now();
          updates.paymentReceivedAt = Date.now();
          updates.escrowStatus = "held";
          updates.commissionRate = commissionRate;
          updates.commissionAmount = commissionAmount;
          updates.payoutAmount = Math.max(productSubTotal - commissionAmount, 0);
          updates.feeBreakdown = {
            commissionAmount,
            pickupFee,
            processingFee,
            storageFee,
            shippingFee,
            totalPlatformFees: commissionAmount + processingFee + storageFee + shippingFee,
            grandTotal: gross,
          };
          updates.payoutStatus = "pending";

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

          await addDoc(collection(serverDb, "admin_chat_messages"), {
            userId: order.buyerId,
            userName: order.buyerId,
            message: `Đơn #${orderId.slice(0, 8)} đã cọc 50% thành công. Sẵn sàng giao hàng.`,
            timestamp: new Date().toISOString(),
            isAdmin: false,
            read: false,
          });

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
