"use client";

import { useState } from "react";
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { ensureUserDoc } from "@/lib/auth/users";
import { Button } from "@/components/ui/Button";

/**
 * Dùng redirect thay vì popup để tránh lỗi Cross-Origin-Opener-Policy và
 * "Pending promise was never set" khi popup bị chặn/đóng.
 * Sau khi chuyển đến Google và đăng nhập xong, user quay lại /login và
 * getRedirectResult() được xử lý ở trang login.
 */
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
      provider.setCustomParameters({ prompt: "select_account" });

      // Popup-first to avoid redirect loop on some browsers/environments.
      try {
        const result = await signInWithPopup(firebaseAuth, provider);
        await ensureUserDoc(result.user);
        if (onSuccess) await onSuccess();
        setSubmitting(false);
        return;
      } catch (popupErr: any) {
        const popupCode = String(popupErr?.code ?? "");
        const shouldFallbackToRedirect =
          popupCode === "auth/popup-blocked" ||
          popupCode === "auth/popup-closed-by-user" ||
          popupCode === "auth/cancelled-popup-request" ||
          popupCode.includes("popup");

        if (!shouldFallbackToRedirect) throw popupErr;
      }

      await signInWithRedirect(firebaseAuth, provider);
      // Redirect flow: page will navigate away.
    } catch (err: any) {
      setSubmitting(false);
      const code = String(err?.code ?? "");
      if (code === "auth/operation-not-allowed")
        setError("Bạn chưa bật đăng nhập Google trong Firebase Auth (Authentication → Sign-in method → Google).");
      else if (code === "auth/unauthorized-domain" || code === "auth/app-not-authorized")
        setError("Domain chưa được phép. Vào Firebase Auth → Settings → Authorized domains và thêm localhost.");
      else setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" className="w-full" onClick={onClick} disabled={submitting}>
        {submitting ? "Đang chuyển đến Google..." : "Đăng nhập bằng Google"}
      </Button>
      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}
    </div>
  );
}
