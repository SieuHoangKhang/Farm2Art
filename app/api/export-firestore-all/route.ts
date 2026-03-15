import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '../../../lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const collections = await db.listCollections();
    
    const allData: Record<string, any> = {};
    
    for (const collectionRef of collections) {
      const collectionName = collectionRef.id;
      const snapshot = await collectionRef.get();
      const docs: any[] = [];
      
      snapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.createTime?.toDate?.() || new Date(),
          updateTime: doc.updateTime?.toDate?.() || new Date(),
        });
      });
      
      allData[collectionName] = docs;
    }
    
    return new NextResponse(JSON.stringify(allData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="firestore-full-backup-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export Firestore data', details: String(error) },
      { status: 500 }
    );
  }
}
