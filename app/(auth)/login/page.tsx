"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { PhoneSignIn } from "@/components/auth/PhoneSignIn";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextParam = searchParams.get("next");
  const nextPath = nextParam && nextParam.startsWith("/") ? nextParam : null;

  const trimmedIdentifier = identifier.trim();
  const isEmail = trimmedIdentifier.includes("@");
  const isPhone = !isEmail && /^(\+|\d)/.test(trimmedIdentifier) && trimmedIdentifier.length > 0;
  const normalizedPhone = isPhone
    ? trimmedIdentifier.replace(/\s+/g, "").replace(/^0(\d+)/, "+84$1")
    : "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, trimmedIdentifier, password);
      router.push(nextPath ?? "/account");
      router.refresh();
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code === "auth/invalid-credential") setError("Email hoặc mật khẩu không đúng.");
      else if (code === "auth/too-many-requests") setError("Bạn thử lại sau ít phút (quá nhiều lần thử).");
      else setError("Đăng nhập thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader title="Đăng nhập" subtitle="Chào mừng bạn quay lại Farm2Art" />
        <CardBody>
          <div className="space-y-4">
            <TextField
              label="Email hoặc Số điện thoại"
              name="identifier"
              placeholder="you@example.com hoặc +84901234567"
              autoComplete="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError(null);
              }}
              helpText={
                isPhone
                  ? "Nếu là số VN, bạn có thể nhập 09... (tự đổi sang +84...)."
                  : "Nhập email hoặc SĐT để hệ thống tự nhận biết."
              }
              required
            />

            {isEmail ? (
              <form className="space-y-4" onSubmit={onSubmit}>
                <TextField
                  label="Mật khẩu"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting || !trimmedIdentifier}>
                  {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
                </Button>
              </form>
            ) : isPhone ? (
              <>
                <PhoneSignIn
                  phone={normalizedPhone}
                  onPhoneChange={(next) => setIdentifier(next)}
                  showPhoneField={false}
                  onSuccess={() => {
                    router.push(nextPath ?? "/account");
                    router.refresh();
                  }}
                />
              </>
            ) : null}

            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-xs font-medium text-stone-500">HOẶC</span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <GoogleSignInButton
              onSuccess={() => {
                router.push(nextPath ?? "/account");
                router.refresh();
              }}
            />
          </div>

          <div className="mt-4 text-center">
            <Link
              href={isEmail ? `/forgot-password?email=${encodeURIComponent(trimmedIdentifier)}` : "/forgot-password"}
              className="text-sm text-stone-600 hover:text-stone-900 hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-stone-600">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-medium text-stone-900 hover:underline">
              Đăng ký
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <LoginContent />
    </Suspense>
  );
}