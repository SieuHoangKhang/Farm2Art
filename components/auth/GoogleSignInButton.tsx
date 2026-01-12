"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { ensureUserDoc } from "@/lib/auth/users";
import { Button } from "@/components/ui/Button";

export function GoogleSignInButton({
  onSuccess,
}: {
  onSuccess?: () => void | Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setError(null);
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      // Force showing the account chooser instead of auto-signing into the last used account.
      provider.setCustomParameters({ prompt: "select_account" });
      const cred = await signInWithPopup(firebaseAuth, provider);
      try {
        await ensureUserDoc(cred.user);
      } catch (e) {
        // Don't block sign-in if Firestore rules aren't deployed yet.
        console.warn("ensureUserDoc failed (non-blocking)", e);
      }
      await onSuccess?.();
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code === "auth/popup-closed-by-user") setError("Bạn đã đóng cửa sổ đăng nhập.");
      else if (code === "auth/cancelled-popup-request") setError("Yêu cầu đăng nhập đang được xử lý.");
      else if (code === "auth/popup-blocked") setError("Trình duyệt chặn popup. Hãy cho phép popup và thử lại.");
      else if (code === "auth/operation-not-allowed")
        setError("Bạn chưa bật đăng nhập Google trong Firebase Auth (Authentication → Sign-in method → Google).");
      else if (code === "auth/unauthorized-domain" || code === "auth/app-not-authorized")
        setError("Domain chưa được phép. Vào Firebase Auth → Settings → Authorized domains và thêm localhost.");
      else setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full" onClick={onClick} disabled={submitting}>
        {submitting ? "Đang mở Google..." : "Đăng nhập bằng Google"}
      </Button>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
    </div>
  );
}
