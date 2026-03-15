import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb();
    const collection_name = request.nextUrl.searchParams.get('collection') || 'chat_logs';

    // Lấy tất cả documents từ collection
    const snapshot = await db.collection(collection_name).get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data()?.createdAt ? new Date(doc.data().createdAt).toISOString() : null
    }));

    // Trả về JSON với filename download
    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Disposition': `attachment; filename="${collection_name}-${new Date().toISOString().slice(0, 10)}.json"`,
        'Content-Type': 'application/json',
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
