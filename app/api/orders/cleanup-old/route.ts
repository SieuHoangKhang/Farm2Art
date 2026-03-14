import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const DEFAULT_DAYS = 4;
const MAX_DELETE_PER_RUN = 500;

type CleanupBody = {
  scope?: "seller" | "all";
  sellerId?: string;
  olderThanDays?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as CleanupBody;
    const scope = body.scope === "seller" ? "seller" : "all";
    const olderThanDays =
      typeof body.olderThanDays === "number" && body.olderThanDays > 0
        ? Math.floor(body.olderThanDays)
        : DEFAULT_DAYS;
    const sellerId = typeof body.sellerId === "string" ? body.sellerId.trim() : "";

    if (scope === "seller" && !sellerId) {
      return NextResponse.json({ error: "Missing sellerId for seller scope" }, { status: 400 });
    }

    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const db = getAdminDb();

    const oldOrdersSnap = await db
      .collection("orders")
      .where("createdAt", "<", cutoff)
      .get();

    const candidates = oldOrdersSnap.docs.filter((d) => {
      if (scope !== "seller") return true;
      const data = d.data() as { sellerId?: string };
      return data.sellerId === sellerId;
    });

    const limited = candidates.slice(0, MAX_DELETE_PER_RUN);
    if (limited.length === 0) {
      return NextResponse.json({ success: true, deleted: 0, cutoff });
    }

    let batch = db.batch();
    let opCount = 0;
    let deleted = 0;

    for (const orderDoc of limited) {
      batch.delete(orderDoc.ref);
      opCount += 1;
      deleted += 1;

      if (opCount >= 450) {
        await batch.commit();
        batch = db.batch();
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({
      success: true,
      deleted,
      cutoff,
      remainingSkipped: Math.max(candidates.length - limited.length, 0),
    });
  } catch (error) {
    console.error("Cleanup old orders error:", error);
    return NextResponse.json({ error: "Failed to cleanup old orders" }, { status: 500 });
  }
}
