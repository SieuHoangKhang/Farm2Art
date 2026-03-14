import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SellerInvoice } from "@/types/invoice";
import type { Order } from "@/types/order";

export const runtime = "nodejs";

type PayoutAccount = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  source: "users" | "seller_verifications" | "user_profiles";
};

function generatePayoutInvoiceNumber(sellerId: string) {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `PAYOUT-${yyyymm}-${sellerId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-6)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, sellerId, commissionRate, negotiatedServiceFee, note } = body as {
      orderId?: string;
      sellerId?: string;
      commissionRate?: number;
      negotiatedServiceFee?: number;
      note?: string;
    };

    if (!orderId || !sellerId) {
      return NextResponse.json({ error: "Missing orderId or sellerId" }, { status: 400 });
    }

    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = { id: orderSnap.id, ...(orderSnap.data() as Omit<Order, "id">) } as Order;

    if (order.sellerId !== sellerId) {
      return NextResponse.json({ error: "Seller does not match this order" }, { status: 400 });
    }

    if (order.status !== "completed") {
      return NextResponse.json({ error: "Order must be completed before payout" }, { status: 400 });
    }

    if (order.paymentStatus !== "success") {
      return NextResponse.json({ error: "Order payment is not successful" }, { status: 400 });
    }

    if (order.payoutStatus === "completed") {
      if (order.invoiceId) {
        const existingInvoiceSnap = await db.collection("invoices").doc(order.invoiceId).get();
        if (existingInvoiceSnap.exists) {
          return NextResponse.json({ success: true, invoice: existingInvoiceSnap.data(), reused: true });
        }
      }
      return NextResponse.json({ error: "Seller payout already completed" }, { status: 400 });
    }

    // Resolve payout destination from users profile first, then user_profiles (VNPAY), fallback to seller verification info.
    let payoutAccount: PayoutAccount | null = null;
    const sellerUserSnap = await db.collection("users").doc(sellerId).get();
    const profileAccount = sellerUserSnap.data()?.payoutAccount as
      | { bankName?: string; accountNumber?: string; accountHolder?: string }
      | undefined;

    if (profileAccount?.bankName && profileAccount?.accountNumber && profileAccount?.accountHolder) {
      payoutAccount = {
        bankName: profileAccount.bankName,
        accountNumber: profileAccount.accountNumber,
        accountHolder: profileAccount.accountHolder,
        source: "users",
      };
    } else {
      const sellerProfileSnap = await db.collection("user_profiles").doc(sellerId).get();
      const savedMethods = sellerProfileSnap.data()?.savedPaymentMethods as
        | Array<{ type?: string; name?: string; lastDigits?: string; id?: string }>
        | undefined;
      const vnpayWallet = Array.isArray(savedMethods)
        ? savedMethods.find(
            (method) => method?.type === "ewallet" && /vnpay/i.test(String(method?.name || ""))
          )
        : undefined;

      const fallbackEwallet = Array.isArray(savedMethods)
        ? savedMethods.find((method) => method?.type === "ewallet")
        : undefined;

      const resolvedWallet = vnpayWallet || fallbackEwallet;

      if (resolvedWallet) {
        const walletName = String(resolvedWallet.name || "").trim() || "VNPAY";
        payoutAccount = {
          bankName: walletName,
          accountNumber:
            (resolvedWallet.lastDigits && `***${resolvedWallet.lastDigits}`) ||
            (resolvedWallet.id ? `WALLET-${resolvedWallet.id}` : `WALLET-${sellerId.slice(0, 8).toUpperCase()}`),
          accountHolder: order.sellerName || sellerId,
          source: "user_profiles",
        };

        // Backfill users/{uid}.payoutAccount for stable next payouts.
        await db.collection("users").doc(sellerId).set(
          {
            payoutAccount: {
              bankName: walletName,
              accountNumber: payoutAccount.accountNumber,
              accountHolder: payoutAccount.accountHolder,
            },
          },
          { merge: true }
        );
      }
    }

    if (!payoutAccount) {
      const verificationSnap = await db.collection("seller_verifications").doc(sellerId).get();
      const verification = verificationSnap.data() as
        | { bankName?: string; bankAccount?: string; ownerName?: string; status?: string }
        | undefined;
      if (
        verification?.status === "approved" &&
        verification.bankName &&
        verification.bankAccount &&
        verification.ownerName
      ) {
        payoutAccount = {
          bankName: verification.bankName,
          accountNumber: verification.bankAccount,
          accountHolder: verification.ownerName,
          source: "seller_verifications",
        };
      }
    }

    if (!payoutAccount) {
      return NextResponse.json(
        {
          error: "Seller chưa cấu hình tài khoản nhận tiền",
          code: "MISSING_PAYOUT_ACCOUNT",
          message: "Yêu cầu người bán cập nhật tài khoản nhận tiền (ngân hàng hoặc ví VNPAY) trước khi admin chi trả.",
        },
        { status: 400 }
      );
    }

    const grossRevenue = order.subTotal ?? order.grandTotal ?? order.totalAmount;
    const safeCommissionRate = Math.max(commissionRate ?? order.commissionRate ?? 0.2, 0);
    const commissionAmount = Math.round(grossRevenue * safeCommissionRate);
    const serviceFee = Math.max(
      negotiatedServiceFee ?? order.warehouseService?.serviceFeeTotal ?? 0,
      0
    );
    const totalDeductions = commissionAmount + serviceFee;
    const netPayout = Math.max(grossRevenue - totalDeductions, 0);

    const now = Date.now();
    const invoiceId = db.collection("invoices").doc().id;

    const invoice: SellerInvoice = {
      id: invoiceId,
      sellerId,
      sellerName: order.sellerName,
      invoiceNumber: generatePayoutInvoiceNumber(sellerId),
      invoiceType: "order_based",
      periodStart: order.createdAt,
      periodEnd: now,
      lineItems: [
        {
          id: `${invoiceId}-commission`,
          type: "commission",
          description: `Khau tru hoa hong ${(safeCommissionRate * 100).toFixed(2)}% cho don ${orderId}`,
          amount: commissionAmount,
          quantity: 1,
          unitPrice: commissionAmount,
          reference: { orderId, listingId: order.listingId },
        },
        {
          id: `${invoiceId}-service`,
          type: "processing_fee",
          description: `Phi van chuyen hang cho don ${orderId}`,
          amount: serviceFee,
          quantity: 1,
          unitPrice: serviceFee,
          reference: { orderId, listingId: order.listingId },
        },
      ],
      pickupFeesTotal: 0,
      processingFeesTotal: serviceFee,
      storageFeesTotal: 0,
      commissionTotal: commissionAmount,
      adjustmentsTotal: 0,
      totalDeductions,
      grossRevenue,
      netPayout,
      status: "paid",
      createdAt: now,
      generatedAt: now,
      sentAt: now,
      paidAt: now,
      paymentMethod: "vnpay_payout",
      transactionRef: `VNPAY-PAYOUT-${invoiceId.slice(-8).toUpperCase()}`,
      pdfUrl: `/api/invoices/${invoiceId}/pdf`,
      notes:
        note ||
        `Chi tra hoa don thanh cong. Tai khoan nhan: ${payoutAccount.bankName} - ${payoutAccount.accountNumber} (${payoutAccount.accountHolder})`,
      payoutDestination: payoutAccount,
    };

    await db.collection("invoices").doc(invoiceId).set(invoice);

    await orderRef.update({
      payoutStatus: "completed",
      payoutAt: now,
      payoutAmount: netPayout,
      invoiceId,
      escrowStatus: "released",
    });

    await db.collection("messages").add({
      senderId: "system",
      receiverId: sellerId,
      type: "invoice",
      content: `Farm2Art da hoan tat chi tra hoa don ${invoice.invoiceNumber} cho don ${orderId}. So tien thuc nhan: ${netPayout.toLocaleString("vi-VN")} VND. Khoan tru gom hoa hong va phi van chuyen hang. Tai khoan nhan: ${payoutAccount.bankName} - ${payoutAccount.accountNumber}.`,
      invoiceId,
      createdAt: now,
      read: false,
    });

    return NextResponse.json({ success: true, invoice });
  } catch (error) {
    console.error("Create payout invoice error:", error);
    return NextResponse.json({ error: "Failed to create payout invoice" }, { status: 500 });
  }
}
