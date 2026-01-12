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
        aria-label={user ? "Tài khoản" : "Đăng nhập"}
        title={user ? "Tài khoản" : "Đăng nhập"}
        className="inline-flex items-center justify-center rounded-md px-3 py-2 text-stone-700 hover:bg-amber-50 hover:text-stone-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="sr-only">{user ? "Tài khoản" : "Đăng nhập"}</span>
      </Link>
    </div>
  );
}
