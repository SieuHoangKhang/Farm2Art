"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase/client";
import { ensureUserDoc } from "@/lib/auth/users";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TextField } from "@/components/ui/TextField";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      if (displayName.trim()) {
        await updateProfile(cred.user, { displayName: displayName.trim() });
      }

      // Create user profile with default role.
      await ensureUserDoc(cred.user);

      router.push("/account?welcome=1");
      router.refresh();
    } catch (err: any) {
      const code = String(err?.code ?? "");
      if (code === "auth/email-already-in-use") setError("Email này đã được sử dụng.");
      else if (code === "auth/invalid-email") setError("Email không hợp lệ.");
      else if (code === "auth/weak-password") setError("Mật khẩu quá yếu (tối thiểu 6 ký tự). ");
      else setError("Đăng ký thất bại. Vui lòng kiểm tra lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md animate-fadeInUp">
      {/* Top decoration */}
      <div className="text-center mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-200/50 mb-4">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </div>
        <h1 className="text-2xl font-extrabold text-stone-800">Tạo tài khoản</h1>
        <p className="mt-1 text-sm text-stone-500">Bắt đầu mua bán trên Farm2Art</p>
      </div>

      <Card className="!shadow-lg !border-sage-200/60">
        <CardBody>
          <form className="space-y-4" onSubmit={onSubmit}>
            <TextField
              label="Họ và tên"
              name="displayName"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
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
            <TextField
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              helpText="Tối thiểu 6 ký tự (theo mặc định Firebase Auth)."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Đang tạo tài khoản..." : "Đăng ký"}
            </Button>
          </form>
          <p className="mt-5 text-sm text-stone-500 text-center">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
              Đăng nhập
            </Link>
          </p>
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Lưu ý: sau khi tạo tài khoản, hãy vào trang cá nhân để cập nhật phương thức nhận tiền VNPAY.
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
