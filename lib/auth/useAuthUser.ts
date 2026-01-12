"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { useEffect, useState } from "react";

import { firebaseApp, firebaseAuth } from "@/lib/firebase/client";
import type { UserRole } from "@/types/user";
import { ensureUserDoc } from "@/lib/auth/users";

export type AuthUserState = {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  error: string | null;
};

export function useAuthUser(): AuthUserState {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      setUser(u);
      setRole(null);
      setError(null);

      if (!u) {
        setLoading(false);
        return;
      }

      try {
        const doc = await ensureUserDoc(u);
        setRole(doc.role);
      } catch (e) {
        console.warn("Failed to load user role from Firestore", e);

        const projectId = (firebaseApp.options as { projectId?: string }).projectId;
        let extra = "";
        if (e instanceof FirebaseError) {
          extra = ` (code: ${e.code})${e.message ? `: ${e.message}` : ""}`;
        } else if (e && typeof e === "object" && "code" in e) {
          extra = ` (code: ${(e as { code?: unknown }).code ?? "unknown"})`;
        }

        setError(
          `Không thể đọc quyền từ Firestore.${extra}${projectId ? ` (project: ${projectId})` : ""}`
        );
        setRole(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return { user, role, loading, error };
}
