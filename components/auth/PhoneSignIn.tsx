"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

export function PhoneSignIn({
  onSuccess,
  phone,
  onPhoneChange,
  showPhoneField = true,
}: {
  onSuccess?: () => void | Promise<void>;
  phone?: string;
  // eslint-disable-next-line no-unused-vars
  onPhoneChange?: (phoneValue: string) => void;
  showPhoneField?: boolean;
}) {
  const recaptchaId = useId();
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const [internalPhone, setInternalPhone] = useState("+84");
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);

  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Khởi tạo reCAPTCHA 1 lần
    if (verifierRef.current) return;

    firebaseAuth.languageCode = "vi";
    verifierRef.current = new RecaptchaVerifier(
      firebaseAuth,
      recaptchaId,
      {
        size: "invisible",
      }
    );

    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
    };
  }, [recaptchaId]);

  const effectivePhone = phone ?? internalPhone;
  const setEffectivePhone = (next: string) => {
    if (onPhoneChange) onPhoneChange(next);
    else setInternalPhone(next);
  };

  async function sendOtp() {
    setError(null);
    setSending(true);
    try {
      const verifier = verifierRef.current;
      if (!verifier) throw new Error("Recaptcha not ready");

      // Firebase yêu cầu định dạng E.164: +84901234567
      const trimmed = effectivePhone.trim();
      if (!trimmed.startsWith("+")) {
        setError("Số điện thoại phải ở dạng quốc tế, ví dụ: +84901234567");
        return;
      }

      const result = await signInWithPhoneNumber(firebaseAuth, trimmed, verifier);
      setConfirmation(result);
    } catch (err: any) {
      // Helpful in local debugging (Network tab often shows 400 without details)
      console.error("[PhoneSignIn] sendOtp error", err);
      const code = String(err?.code ?? "");
      if (code === "auth/invalid-phone-number") setError("Số điện thoại không hợp lệ.");
      else if (code === "auth/missing-phone-number") setError("Vui lòng nhập số điện thoại.");
      else if (code === "auth/operation-not-allowed")
        setError("Bạn chưa bật đăng nhập bằng SĐT trong Firebase Auth (Authentication → Sign-in method → Phone).");
      else if (code === "auth/unauthorized-domain" || code === "auth/app-not-authorized")
        setError("Domain chưa được phép. Vào Firebase Auth → Settings → Authorized domains và thêm localhost.");
      else if (code === "auth/captcha-check-failed")
        setError("reCAPTCHA bị chặn/thất bại. Tắt AdBlock/Brave Shields, thử tab ẩn danh và thử lại.");
      else if (code === "auth/invalid-app-credential" || code === "auth/missing-app-credential")
        setError("Thiếu/không hợp lệ app credential. Hãy kiểm tra cấu hình Firebase (API key/domain) và thử lại.");
      else if (code === "auth/too-many-requests") setError("Bạn thử lại sau ít phút (quá nhiều lần thử).");
      else if (code === "auth/quota-exceeded") setError("Vượt quá quota SMS của dự án.");
      else {
        const rawMessage = String(err?.message ?? "");
        setError(`Gửi OTP thất bại (${code || "unknown"}). ${rawMessage ? "" : "Vui lòng thử lại."}`.trim());
      }
    } finally {
      setSending(false);
    }
  }

  async function verifyOtp() {
    setError(null);
    setVerifying(true);
    try {
      if (!confirmation) {
        setError("Bạn cần gửi OTP trước.");
        return;
      }
      const code = otp.trim();
      if (code.length < 4) {
        setError("Mã OTP không hợp lệ.");
        return;
      }

      await confirmation.confirm(code);
      await onSuccess?.();
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code === "auth/invalid-verification-code") setError("Mã OTP sai.");
      else if (code === "auth/code-expired") setError("Mã OTP đã hết hạn. Hãy gửi lại mã.");
      else setError("Xác nhận OTP thất bại. Vui lòng thử lại.");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="space-y-4">
      {showPhoneField ? (
        <TextField
          label="Số điện thoại"
          name="phone"
          inputMode="tel"
          placeholder="+84901234567"
          value={effectivePhone}
          onChange={(e) => setEffectivePhone(e.target.value)}
          helpText="Nhập theo dạng quốc tế (E.164), ví dụ: +84901234567"
        />
      ) : null}

      {confirmation ? (
        <TextField
          label="Mã OTP"
          name="otp"
          inputMode="numeric"
          placeholder="123456"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
      ) : null}

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" className="w-full" onClick={sendOtp} disabled={sending}>
          {sending ? "Đang gửi..." : confirmation ? "Gửi lại mã" : "Gửi mã OTP"}
        </Button>
        <Button
          type="button"
          className="w-full"
          onClick={verifyOtp}
          disabled={!confirmation || verifying}
        >
          {verifying ? "Đang xác nhận..." : "Xác nhận"}
        </Button>
      </div>

      {/* reCAPTCHA container */}
      <div id={recaptchaId} />
    </div>
  );
}
