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

      router.push("/account");
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
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader title="Tạo tài khoản" subtitle="Bắt đầu mua bán trên Farm2Art" />
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
          <p className="mt-4 text-sm text-slate-600">
            Đã có tài khoản?{" "}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Đăng nhập
            </Link>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
