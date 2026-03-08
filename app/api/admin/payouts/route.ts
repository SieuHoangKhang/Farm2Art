import { NextRequest, NextResponse } from 'next/server';
import {
  doc,
  updateDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server';
import type { Order, PayoutStatus } from '@/types/order';
import { PLATFORM_CONFIG } from '@/lib/config/platformFees';

// Constants
const PAYOUT_CONFIRMATION_DAYS = 3; // Số ngày sau khi delivered để unlock payout

/**
 * Helper: Kiểm tra đơn đủ điều kiện payout
 * - Đơn phải completed
 * - 3 ngày đã trôi qua kể từ delivery
 * - Escrow phải là "held" (tiền đã nhận từ khách)
 * - Chưa thanh toán cho seller
 */
function validatePayoutEligibility(order: Order): { valid: boolean; reason?: string } {
  // Check status completed
  if (order.status !== 'completed') {
    return { valid: false, reason: 'Order status must be "completed"' };
  }

  // Check escrow status = held (payment confirmed in escrow)
  if (order.escrowStatus !== 'held') {
    return {
      valid: false,
      reason: `Escrow status must be "held", current: ${order.escrowStatus}`,
    };
  }

  // Check payout status not already completed
  if (order.payoutStatus === 'completed') {
    return { valid: false, reason: 'Payout already completed' };
  }

  // Check 3-day confirmation period has passed
  if (order.completedAt) {
    const completedTime = new Date(order.completedAt).getTime();
    const now = Date.now();
    const daysPassed = (now - completedTime) / (1000 * 60 * 60 * 24);

    if (daysPassed < PAYOUT_CONFIRMATION_DAYS) {
      const remainingDays = Math.ceil(
        PAYOUT_CONFIRMATION_DAYS - daysPassed
      );
      return {
        valid: false,
        reason: `Must wait ${remainingDays} day(s) after delivery (Completed on ${new Date(completedTime).toLocaleDateString('vi-VN')})`,
      };
    }
  }

  return { valid: true };
}

/**
 * Helper: Ghi log audit trail cho payout action
 */
async function recordPayoutAudit(
  orderId: string,
  action: 'schedule' | 'complete',
  adminId: string,
  amount: number,
  status: string
) {
  try {
    const auditRef = collection(serverDb, 'payoutAudits');
    const batch = writeBatch(serverDb);

    batch.set(doc(auditRef), {
      orderId,
      action,
      adminId,
      amount,
      previousStatus: 'pending',
      newStatus: status,
      timestamp: Timestamp.now(),
      ipAddress: null, // Có thể capture từ request headers
    });

    await batch.commit();
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw - audit failure shouldn't block payout
  }
}

/**
 * Helper: Notify seller về payout
 */
async function notifySellerPayoutComplete(
  orderId: string,
  sellerId: string,
  amount: number
) {
  try {
    const notificationRef = collection(serverDb, 'notifications');
    const batch = writeBatch(serverDb);

    batch.set(doc(notificationRef), {
      userId: sellerId,
      type: 'payout_completed',
      title: 'Thanh toán hoa hồng',
      message: `Đơn #${orderId} vừa được thanh toán ${amount.toLocaleString('vi-VN')} VNĐ`,
      relatedOrderId: orderId,
      read: false,
      createdAt: Timestamp.now(),
    });

    await batch.commit();
  } catch (error) {
    console.error('Notification error:', error);
    // Don't throw - notification failure shouldn't block payout
  }
}

/**
 * POST /api/admin/payouts/process
 * Admin xử lí thanh toán cho seller
 * - Kiểm tra đơn đủ điều kiện payout (3 ngày sau delivery)
 * - Validate escrow status = "held" (tiền cô lập an toàn)
 * - Tính commission & payout
 * - Update với transaction atomicity
 * - Ghi audit trail + notify seller
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, action, adminId } = body; // action: "schedule" | "complete"

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'orderId and action are required' },
        { status: 400 }
      );
    }

    if (!['schedule', 'complete'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "schedule" or "complete"' },
        { status: 400 }
      );
    }

    const orderRef = doc(serverDb, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data() as Order;

    // ============================================
    // ⭐ ENHANCED VALIDATION
    // ============================================
    const eligibility = validatePayoutEligibility(order);
    if (!eligibility.valid) {
      return NextResponse.json(
        {
          error: 'Payout not eligible',
          reason: eligibility.reason,
          details: {
            orderStatus: order.status,
            escrowStatus: order.escrowStatus,
            payoutStatus: order.payoutStatus,
            completedAt: order.completedAt,
            daysEligibleAt:
              order.completedAt &&
              new Date(
                new Date(order.completedAt).getTime() +
                  PAYOUT_CONFIRMATION_DAYS * 24 * 60 * 60 * 1000
              ).toISOString(),
          },
        },
        { status: 400 }
      );
    }

    // Tính toán nếu chưa có
    let commission = order.commissionAmount || 0;
    let payout = order.payoutAmount || 0;

    if (!order.commissionAmount || !order.payoutAmount) {
      commission = Math.round(
        (order.grandTotal || 0) * (order.commissionRate || PLATFORM_CONFIG.defaultCommissionRate)
      );
      payout = (order.grandTotal || 0) - commission;
    }

    // ============================================
    // ⭐ ATOMIC UPDATE WITH FIRESTORE BATCH
    // ============================================
    const batch = writeBatch(serverDb);
    let payoutStatus: PayoutStatus = 'pending';

    if (action === 'schedule') {
      payoutStatus = 'scheduled';
    } else if (action === 'complete') {
      payoutStatus = 'completed';
    }

    // Update order với atomic batch
    batch.update(orderRef, {
      commissionAmount: commission,
      payoutAmount: payout,
      payoutStatus,
      payoutAt: Timestamp.now(),
      escrowStatus: action === 'complete' ? 'released' : 'held', // Mark as released when completed
      updatedAt: Timestamp.now(),
    });

    await batch.commit();

    // ============================================
    // ⭐ ASYNC SIDE EFFECTS (không block response)
    // ============================================
    // Ghi audit trail
    recordPayoutAudit(orderId, action as 'schedule' | 'complete', adminId || 'system', payout, payoutStatus).catch(
      (e) => console.error('Audit error:', e)
    );

    // Notify seller nếu completed
    if (action === 'complete' && order.sellerId) {
      notifySellerPayoutComplete(orderId, order.sellerId, payout).catch((e) =>
        console.error('Notification error:', e)
      );
    }

    return NextResponse.json(
      {
        success: true,
        orderId,
        commission,
        payoutAmount: payout,
        payoutStatus,
        message: `Payout ${action === 'complete' ? 'hoàn thành' : 'lên lịch'}: ${payout.toLocaleString('vi-VN')} VNĐ`,
        details: {
          escrowReleased: action === 'complete',
          adminId: adminId || 'system',
          processedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payout process error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process payout',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/payouts/pending
 * Lấy danh sách đơn chờ thanh toán
 * - Lọc theo status: pending | scheduled | completed
 * - Hiển thị timeline eligibility (ngày nào eligible payout)
 * - Tính toán dòng tiền tổng hợp
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sellerId = searchParams.get('sellerId');
    const status = searchParams.get('status') || 'pending'; // pending | scheduled | completed
    const includeDueInfo = searchParams.get('includeDueInfo') === 'true';

    let queryRef;

    if (sellerId) {
      // Lấy đơn của seller cụ thể
      queryRef = query(
        collection(serverDb, 'orders'),
        where('status', '==', 'completed'),
        where('payoutStatus', '==', status),
        where('sellerId', '==', sellerId)
      );
    } else {
      // Lấy tất cả đơn chờ thanh toán (cho admin)
      queryRef = query(
        collection(serverDb, 'orders'),
        where('status', '==', 'completed'),
        where('payoutStatus', '==', status)
      );
    }

    const snap = await getDocs(queryRef);
    const orders = snap.docs
      .map((d) => {
        const orderData = d.data() as any;
        const order: Order = { id: d.id, ...orderData };

        // Calculate eligibility info nếu request
        let eligibilityInfo = null;
        if (includeDueInfo && order.completedAt) {
          const completedTime = new Date(order.completedAt).getTime();
          const now = Date.now();
          const daysPassed = (now - completedTime) / (1000 * 60 * 60 * 24);
          const daysRemaining = Math.max(0, Math.ceil(PAYOUT_CONFIRMATION_DAYS - daysPassed));

          eligibilityInfo = {
            isEligible: daysRemaining === 0 && order.escrowStatus === 'held',
            completedAt: order.completedAt,
            eligibleAt: new Date(
              completedTime + PAYOUT_CONFIRMATION_DAYS * 24 * 60 * 60 * 1000
            ),
            daysRemaining,
            escrowStatus: order.escrowStatus,
          };
        }

        return {
          ...order,
          eligibilityInfo,
        };
      })
      .sort((a, b) => {
        // Prioritize orders eligible sooner
        if (a.eligibilityInfo && b.eligibilityInfo) {
          return a.eligibilityInfo.daysRemaining - b.eligibilityInfo.daysRemaining;
        }
        return 0;
      }) as any[];

    // Tính tổng - chỉ tính những eligible
    const totalAmount = orders
      .filter((o) => !o.eligibilityInfo || o.eligibilityInfo.isEligible)
      .reduce((sum, o) => sum + (o.payoutAmount || 0), 0);

    const totalCommission = orders
      .filter((o) => !o.eligibilityInfo || o.eligibilityInfo.isEligible)
      .reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

    const totalIneligible = orders
      .filter((o) => o.eligibilityInfo && !o.eligibilityInfo.isEligible)
      .reduce((sum, o) => sum + (o.payoutAmount || 0), 0);

    return NextResponse.json(
      {
        success: true,
        count: orders.length,
        countEligible: orders.filter((o) => !o.eligibilityInfo || o.eligibilityInfo.isEligible).length,
        countIneligible: orders.filter((o) => o.eligibilityInfo && !o.eligibilityInfo.isEligible).length,
        totalAmount,
        totalCommission,
        totalIneligible,
        status,
        orders,
        summary: {
          platformRevenue: totalCommission,
          sellerPayouts: totalAmount,
          averageOrderValue:
            orders.length > 0
              ? Math.round(orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0) / orders.length)
              : 0,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get pending payouts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payouts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
