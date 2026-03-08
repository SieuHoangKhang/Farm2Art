"use client";

import Link from "next/link";

import { useAuthUser } from "@/lib/auth/useAuthUser";

export function HeaderAuthControls() {
  const { user, role, loading } = useAuthUser();

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2">
        <div className="hidden h-9 w-16 rounded-md bg-stone-100 md:block" />
        <div className="h-9 w-9 rounded-md bg-stone-100" />
      </div>
    );
  }

  const isAdmin = role === "admin";

  return (
    <div className="flex items-center gap-2">
      {user && isAdmin ? (
        <Link
          href="/admin"
          className="hidden rounded-md px-3 py-2 text-sm text-stone-700 hover:bg-amber-50 hover:text-stone-900 md:inline-flex"
        >
          Admin
        </Link>
      ) : null}

      <Link
        href={user ? "/account" : "/login"}
        className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-stone-600 hover:bg-emerald-50/70 hover:text-emerald-700 transition-all duration-200"
      >
        {user ? "Tài khoản" : "Đăng nhập"}
      </Link>

    </div>
  );
}
