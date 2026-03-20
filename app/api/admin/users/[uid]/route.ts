import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";

type RouteContext = {
  params: Promise<{ uid: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { uid } = await context.params;

    if (!uid) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const adminAuth = getAdminAuth();

    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userSnap.data() as { role?: string } | undefined;
    if (userData?.role === "admin") {
      return NextResponse.json({ error: "Cannot delete admin account" }, { status: 403 });
    }

    const batch = adminDb.batch();
    batch.delete(userRef);

    const relatedCollections = [
      { name: "user_profiles", field: "userId" },
      { name: "seller_verifications", field: "sellerId" },
      { name: "notifications", field: "userId" },
      { name: "admin_chat_messages", field: "userId" },
    ] as const;

    for (const collectionInfo of relatedCollections) {
      const snap = await adminDb.collection(collectionInfo.name).where(collectionInfo.field, "==", uid).get();
      snap.docs.forEach((doc) => batch.delete(doc.ref));
    }

    await batch.commit();

    try {
      await adminAuth.deleteUser(uid);
    } catch (authError) {
      console.error("Delete auth user error:", authError);
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}