import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Listing } from "@/types/listing";

export async function GET(request: NextRequest, context: any) {
  const params = await context.params;
  try {
    const { sellerId } = params;
    if (!sellerId) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    const db = getAdminDb();

    const sellerSnap = await db.doc(`users/${sellerId}`).get();
    const sellerInfo = sellerSnap.exists ? { id: sellerSnap.id, ...sellerSnap.data() } : null;

    const profileSnap = await db.doc(`user_profiles/${sellerId}`).get();
    const sellerProfile = profileSnap.exists ? { id: profileSnap.id, ...profileSnap.data() } : null;

    const listingsSnap = await db
      .collection("listings")
      .where("sellerId", "==", sellerId)
      .get();
    const listings = listingsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Listing));

    const sellerListingStats = {
      total: listings.length,
      active: listings.filter((l) => l.status === "active").length,
      hidden: listings.filter((l) => l.status === "hidden").length,
      pending: listings.filter((l) => l.approvalStatus === "pending_approval").length,
      approved: listings.filter((l) => l.approvalStatus === "approved").length,
      rejected: listings.filter((l) => l.approvalStatus === "rejected").length,
    };

    const reviewsSnap = await db
      .collection("reviews")
      .where("sellerId", "==", sellerId)
      .get();
    const sellerReviews = reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return NextResponse.json({
      sellerInfo,
      sellerProfile,
      sellerListingStats,
      sellerReviews,
    });
  } catch (error: any) {
    console.error("Admin seller detail fetch error:", error);
    const message = error?.message || String(error) || "Failed to fetch seller details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
