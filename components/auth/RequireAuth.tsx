"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuthUser } from "@/lib/auth/useAuthUser";

export function RequireAuth({
  children,
  requireAdmin,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, loading } = useAuthUser();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
      return;
    }

    if (requireAdmin && role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, role, requireAdmin, router, pathname]);

  if (loading) {
    return <div className="py-10 text-sm text-stone-600">Đang kiểm tra quyền...</div>;
  }

  if (!user) return null;
  if (requireAdmin && role !== "admin") return null;

  return <>{children}</>;
}
