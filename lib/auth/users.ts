import { doc, getDoc, getDocFromServer, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

import { firebaseDb } from "@/lib/firebase/client";
import type { AppUser, UserRole } from "@/types/user";

const DEFAULT_ROLE: UserRole = "user";

export async function ensureUserDoc(firebaseUser: User): Promise<AppUser> {
  const ref = doc(firebaseDb, "users", firebaseUser.uid);
  const snap = await (async () => {
    try {
      return await getDocFromServer(ref);
    } catch {
      return await getDoc(ref);
    }
  })();

  if (snap.exists()) {
    const data = snap.data() as Partial<AppUser>;
    const storedRole = typeof data.role === "string" ? data.role : undefined;
    const isStoredRoleValid = storedRole === "admin" || storedRole === "user";
    const role: UserRole = isStoredRoleValid ? (storedRole as UserRole) : DEFAULT_ROLE;

    // If someone typed role incorrectly in the Firebase Console (e.g. "Admin"),
    // don't silently downgrade to user — surface a clear error so it can be fixed.
    if (storedRole && !isStoredRoleValid) {
      throw new Error(
        `Giá trị role trong Firestore không hợp lệ: ${JSON.stringify(storedRole)}. ` +
          `Hãy đặt role = "admin" hoặc "user" (chữ thường, không có khoảng trắng).`
      );
    }
    const createdAt = typeof data.createdAt === "number" ? data.createdAt : Date.now();

    const displayName = data.displayName ?? firebaseUser.displayName ?? undefined;
    const phone = data.phone ?? firebaseUser.phoneNumber ?? undefined;

    const merged: AppUser = {
      uid: firebaseUser.uid,
      role,
      createdAt,
      ...(displayName ? { displayName } : {}),
      ...(phone ? { phone } : {}),
    };

    // If the document exists but is missing required fields (common when created manually),
    // write them back so role checks and rules work reliably.
    const needsBackfill = data.uid !== firebaseUser.uid || typeof data.createdAt !== "number";

    if (needsBackfill) {
      await setDoc(ref, merged, { merge: true });
    }

    return merged;
  }

  const userDisplayName = firebaseUser.displayName ?? undefined;
  const userPhone = firebaseUser.phoneNumber ?? undefined;

  const userDoc: AppUser = {
    uid: firebaseUser.uid,
    role: DEFAULT_ROLE,
    createdAt: Date.now(),
    ...(userDisplayName ? { displayName: userDisplayName } : {}),
    ...(userPhone ? { phone: userPhone } : {}),
  };

  await setDoc(ref, userDoc, { merge: false });
  return userDoc;
}
