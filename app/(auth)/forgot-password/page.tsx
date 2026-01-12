"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const emailFromQuery = (searchParams.get("email") ?? "").trim();
  useEffect(() => {
    if (!emailFromQuery) return;
    setEmail((prev) => (prev ? prev : emailFromQuery));
  }, [emailFromQuery]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSent(false);

    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }

    setSubmitting(true);
    try {
      await sendPasswordResetEmail(firebaseAuth, normalizedEmail);
      setSent(true);
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code === "auth/invalid-email") setError("Email không hợp lệ.");
      else if (code === "auth/too-many-requests") setError("Bạn thử lại sau ít phút (quá nhiều lần yêu cầu).");
      else if (code === "auth/user-not-found") setError("Email này chưa có tài khoản. Bạn có thể đăng ký mới.");
      else setError("Gửi email đặt lại mật khẩu thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader title="Quên mật khẩu" subtitle="Nhập email để nhận link đặt lại mật khẩu." />
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {sent ? (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư (và cả Spam/Junk).
              </div>
            ) : null}

            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
            </Button>
          </form>

          <div className="mt-4 text-sm text-stone-600">
            Quay lại{" "}
            <Link href="/login" className="font-medium text-stone-900 hover:underline">
              Đăng nhập
            </Link>
            {" "}hoặc{" "}
            <Link href="/register" className="font-medium text-stone-900 hover:underline">
              Đăng ký
            </Link>
            .
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}
