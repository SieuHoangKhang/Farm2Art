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
      'awaiting_intake',
      'in_storage',
      'processing',
      'ready_to_ship',
      'shipped',
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

    // Chuẩn bị update data
    const updateData: any = {
      'warehouseService.warehouseStatus': warehouseStatus,
      'warehouseService.updatedAt': new Date().getTime(),
    };

    // Auto-sync: Khi kho shipped → đơn hàng tự động sang shipping
    if (warehouseStatus === 'shipped' && order.status !== 'shipping' && order.status !== 'delivered' && order.status !== 'completed') {
      updateData.status = 'shipping';
      updateData.shippedAt = new Date().getTime();
    }

    // Update warehouse status + order status (nếu cần)
    await updateDoc(orderRef, updateData);

    return NextResponse.json(
      { 
        orderId: id, 
        warehouseStatus, 
        orderStatus: updateData.status || order.status,
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
