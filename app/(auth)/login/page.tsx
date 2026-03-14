"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense, useEffect } from "react";
import { signInWithEmailAndPassword, getRedirectResult, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { ensureUserDoc } from "@/lib/auth/users";
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
  const [handlingRedirect, setHandlingRedirect] = useState(true);
  const [mounted, setMounted] = useState(false);

  const nextParam = searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("/login")
      ? nextParam
      : null;

  // Chỉ render form sau khi mount để tránh hydration mismatch (TextField/helpText/extension)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Xử lý khi user quay lại từ đăng nhập Google (redirect flow).
  // Quan trọng: gọi getRedirectResult() NGAY khi load để Firebase "tiêu thụ" redirect;
  // nếu đợi onAuthStateChanged trước thì có thể nhận null và không bao giờ gọi getRedirectResult().
  useEffect(() => {
    if (!mounted) return;

    let isActive = true;

    (async () => {
      try {
        const result = await getRedirectResult(firebaseAuth);

        if (!isActive) return;

        if (result?.user) {
          await ensureUserDoc(result.user);
          if (!isActive) return;
          // Đợi ngắn để auth state kịp sync trước khi sang /account
          await new Promise((r) => setTimeout(r, 150));
          if (!isActive) return;
          router.replace(nextPath ?? "/account");
          router.refresh();
          return;
        }

        if (firebaseAuth.currentUser) {
          try {
            await ensureUserDoc(firebaseAuth.currentUser);
          } catch (e) {
            console.warn("ensureUserDoc failed (non-blocking)", e);
          }
          if (!isActive) return;
          router.replace(nextPath ?? "/account");
          router.refresh();
          return;
        }
      } catch (err: any) {
        if (!isActive) return;
        const code = String(err?.code ?? "");
        if (code === "auth/operation-not-allowed")
          setError("Đăng nhập Google chưa được bật trong Firebase.");
        else if (code === "auth/unauthorized-domain")
          setError("Domain chưa được phép trong Firebase Auth.");
        else setError("Đăng nhập Google thất bại. Vui lòng thử lại.");
      } finally {
        if (isActive) setHandlingRedirect(false);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [mounted, router, nextPath]);

  // Important: Firebase may restore auth state after getRedirectResult() finishes.
  // This listener prevents being stuck on login form when user is already signed in.
  useEffect(() => {
    if (!mounted) return;

    const unsub = onAuthStateChanged(firebaseAuth, async (u) => {
      if (!u) return;
      try {
        await ensureUserDoc(u);
      } catch (e) {
        console.warn("ensureUserDoc after auth state failed", e);
      }
      router.replace(nextPath ?? "/account");
      router.refresh();
    });

    return () => unsub();
  }, [mounted, router, nextPath]);

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

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-md flex flex-col items-center justify-center min-h-[320px]">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200/50 mb-4" />
        <p className="text-sm text-stone-500">Đang tải form đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md animate-fadeInUp">
      {/* Top decoration */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200/50 mb-4">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-800">Chào mừng trở lại</h1>
        <p className="mt-1 text-sm text-stone-500">Đăng nhập vào Farm2Art</p>
      </div>

      <Card className="!shadow-lg !border-sage-200/60">
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

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sage-200 to-transparent" />
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">HOẶC</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-sage-200 to-transparent" />
            </div>

            {handlingRedirect ? (
              <p className="rounded-md border border-sage-200 bg-sage-50 px-3 py-2 text-sm text-stone-600">
                Đang xác thực đăng nhập Google...
              </p>
            ) : (
              <GoogleSignInButton
                onSuccess={() => {
                  router.push(nextPath ?? "/account");
                  router.refresh();
                }}
              />
            )}
          </div>

          <div className="mt-5 text-center">
            <Link
              href={isEmail ? `/forgot-password?email=${encodeURIComponent(trimmedIdentifier)}` : "/forgot-password"}
              className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
            >
              Quên mật khẩu?
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-stone-500">
            Chưa có tài khoản?{" "}
            <Link href="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
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