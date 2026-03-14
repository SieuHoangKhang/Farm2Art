import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { serverDb } from '@/lib/firebase/server';
import type { Order } from '@/types/order';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { warehouseStatus } = body;

    if (!warehouseStatus) {
      return NextResponse.json(
        { error: 'warehouseStatus is required' },
        { status: 400 }
      );
    }

    const validStatuses = [
      'in_stock',
      'awaiting_intake',
      'in_storage',
      'ready_to_ship',
      'shipped',
      'completed',
    ];

    if (!validStatuses.includes(warehouseStatus)) {
      return NextResponse.json(
        { error: `Invalid warehouseStatus. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const orderRef = doc(serverDb, 'orders', id);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orderSnap.data() as Order;

    // Chỉ update warehouse status nếu đơn có warehouse service
    if (!order.warehouseService?.enabled) {
      return NextResponse.json(
        { error: 'Order does not have warehouse service enabled' },
        { status: 400 }
      );
    }

    if ((warehouseStatus === 'shipped' || warehouseStatus === 'completed') && order.paymentStatus !== 'success') {
      return NextResponse.json(
        { error: 'Order must be paid before shipping from warehouse' },
        { status: 400 }
      );
    }

    if (warehouseStatus === 'completed') {
      return NextResponse.json(
        { error: 'Warehouse cannot mark completed directly. Wait for customer confirmation.' },
        { status: 400 }
      );
    }

    // Chuẩn bị update data
    const updateData: any = {
      'warehouseService.warehouseStatus': warehouseStatus,
      'warehouseService.updatedAt': new Date().getTime(),
    };

    // Auto-sync: Kho xuất hàng -> đơn chuyển sang đang giao
    if (warehouseStatus === 'shipped' && order.status !== 'shipping' && order.status !== 'completed' && order.status !== 'cancelled') {
      updateData.status = 'shipping';
      if (!order.confirmedAt) {
        updateData.confirmedAt = new Date().getTime();
      }
      updateData.shippedAt = new Date().getTime();
    }

    // Update warehouse status + order status (nếu cần)
    await updateDoc(orderRef, updateData);

    return NextResponse.json(
      { 
        orderId: id, 
        warehouseStatus, 
        orderStatus: updateData.status || order.status,
        confirmedAt: updateData.confirmedAt || order.confirmedAt,
        shippedAt: updateData.shippedAt || order.shippedAt,
        completedAt: order.completedAt,
        updatedAt: new Date().getTime() 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Warehouse status update error:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse status' },
      { status: 500 }
    );
  }
}
