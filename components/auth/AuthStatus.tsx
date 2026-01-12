"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { useAuthUser } from "@/lib/auth/useAuthUser";

export function AuthStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { role, error: roleError } = useAuthUser();

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return <div className="text-sm text-slate-600">Đang tải...</div>;

  if (!user) {
    return (
      <div className="text-sm text-slate-600">
        Bạn chưa đăng nhập. <Link className="font-medium text-slate-900 hover:underline" href="/login">Đăng nhập</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-slate-900">Xin chào, {user.displayName ?? user.email}</p>
        <p className="text-xs text-slate-500">UID: {user.uid}</p>
        <p className="mt-1 text-xs text-slate-500">
          Vai trò:{" "}
          <span className="font-medium text-slate-900">
            {role === "admin" ? "Admin" : role === "user" ? "User" : "(chưa xác định)"}
          </span>
          {role === "admin" ? (
            <>
              {" "}•{" "}
              <Link className="font-medium text-slate-900 hover:underline" href="/admin">
                Vào trang Admin
              </Link>
            </>
          ) : null}
        </p>

        {roleError ? (
          <p className="mt-1 text-xs text-red-700">{roleError}</p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={async () => {
          await signOut(firebaseAuth);
        }}
      >
        Đăng xuất
      </Button>
    </div>
  );
}
