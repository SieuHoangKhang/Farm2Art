"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import {
  collection,
  deleteField,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  query,
  setDoc,
  where,
} from "firebase/firestore";

import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";

import { useAuthUser } from "@/lib/auth/useAuthUser";
import { ensureUserDoc } from "@/lib/auth/users";
import { firebaseAuth, firebaseDb } from "@/lib/firebase/client";

import type { AppUser } from "@/types/user";
import type { Listing } from "@/types/listing";
import { ListingCard } from "@/components/listing/ListingCard";
import { LogoImage } from "@/components/ui/LogoImage";

function formatJoinDate(ms: number) {
  try {
    return new Date(ms).toLocaleDateString("vi-VN", { year: "numeric", month: "2-digit", day: "2-digit" });
  } catch {
    return "";
  }
}

function shortUid(uid: string) {
  if (!uid) return "";
  if (uid.length <= 12) return uid;
  return `${uid.slice(0, 6)}…${uid.slice(-4)}`;
}

function formatDateTime(input: string | null | undefined) {
  if (!input) return "";
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function providerLabel(providerId: string) {
  switch (providerId) {
    case "google.com":
      return "Google";
    case "facebook.com":
      return "Facebook";
    case "github.com":
      return "GitHub";
    case "apple.com":
      return "Apple";
    case "password":
      return "Email/Mật khẩu";
    case "phone":
      return "Số điện thoại";
    default:
      return providerId;
  }
}

function isFirestoreIndexError(e: unknown) {
  const message = e instanceof Error ? e.message : String(e ?? "");
  return /requires an index/i.test(message) || /create it here/i.test(message);
}

function StatIcon({ type }: { type: "listing" | "active" | "account" }) {
  if (type === "listing")
    return (
      <svg className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    );
  if (type === "active")
    return (
      <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  return (
    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function AccountPage() {
  const { user, role, loading, error: roleError } = useAuthUser();

  const [profile, setProfile] = useState<AppUser | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [listingCount, setListingCount] = useState<number | null>(null);
  const [activeListingCount, setActiveListingCount] = useState<number | null>(null);
  const [recentListings, setRecentListings] = useState<Listing[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);

  const nameForUi = useMemo(() => {
    return (
      profile?.displayName ||
      user?.displayName ||
      user?.email ||
      (user ? "Người dùng" : "")
    );
  }, [profile?.displayName, user]);

  const accountMeta = useMemo(() => {
    const providers = (user?.providerData ?? [])
      .map((p) => p.providerId)
      .filter((v): v is string => Boolean(v));

    const providerText = providers.length ? providers.map(providerLabel).join(", ") : "—";
    const lastSignInText = formatDateTime(user?.metadata?.lastSignInTime);
    return {
      providerText,
      lastSignInText,
      emailVerified: Boolean(user?.emailVerified),
    };
  }, [user?.emailVerified, user?.metadata?.lastSignInTime, user?.providerData]);

  function resetEditFields() {
    setDisplayName(profile?.displayName ?? user?.displayName ?? "");
    setPhone(profile?.phone ?? user?.phoneNumber ?? "");
    setAddress(profile?.address ?? "");
    setCity(profile?.city ?? "");
    setDistrict(profile?.district ?? "");
    setSaveMessage(null);
  }

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileError(null);
      setListingCount(null);
      setActiveListingCount(null);
      setRecentListings([]);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError(null);
      try {
        const doc = await ensureUserDoc(user!);
        if (cancelled) return;
        setProfile(doc);
        setDisplayName(doc.displayName ?? user!.displayName ?? "");
        setPhone(doc.phone ?? user!.phoneNumber ?? "");
        setAddress(doc.address ?? "");
        setCity(doc.city ?? "");
        setDistrict(doc.district ?? "");
        setAvatarUrl(doc.avatarUrl ?? null);
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
        setProfileError(e instanceof Error ? e.message : "Không thể tải hồ sơ người dùng");
      } finally {
        if (!cancelled) setProfileLoading(false);
      }
    }

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadRelated() {
      setDataLoading(true);
      setDataError(null);

      try {
        const listingsRef = collection(firebaseDb, "listings");
        const ownerQuery = query(listingsRef, where("ownerId", "==", user!.uid));

        // IMPORTANT: Avoid composite index requirements by not mixing where+orderBy.
        // We fetch a small batch and sort client-side.
        const recentQuery = query(listingsRef, where("ownerId", "==", user!.uid), limit(25));

        const [countAll, recentSnap] = await Promise.all([
          getCountFromServer(ownerQuery),
          getDocs(recentQuery),
        ]);

        if (cancelled) return;

        setListingCount(countAll.data().count);

        const all: Listing[] = recentSnap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Listing, "id">),
        }));

        const sorted = all
          .slice()
          .sort((a, b) => (typeof b.createdAt === "number" ? b.createdAt : 0) - (typeof a.createdAt === "number" ? a.createdAt : 0));

        setRecentListings(sorted.slice(0, 3));

        // Active count (best-effort): compute from the fetched batch.
        // This avoids requiring an index for ownerId+status count.
        setActiveListingCount(sorted.filter((l) => l.status === "active").length);
      } catch (e) {
        if (cancelled) return;

        // Don't show raw “create index” errors in UI; just degrade gracefully.
        if (!isFirestoreIndexError(e)) {
          setDataError(e instanceof Error ? e.message : "Không thể tải dữ liệu liên quan");
        }
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }

    void loadRelated();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function handleAvatarUpload(file: File) {
    if (!user) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "farm2art");

      const cloudResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      if (!cloudResponse.ok) throw new Error("Cloudinary upload failed");
      const cloudData = (await cloudResponse.json()) as { secure_url: string };
      const newAvatarUrl = cloudData.secure_url;

      await setDoc(
        doc(firebaseDb, "users", user.uid),
        { avatarUrl: newAvatarUrl },
        { merge: true }
      );

      setAvatarUrl(newAvatarUrl);
      if (profile) setProfile({ ...profile, avatarUrl: newAvatarUrl });
      setSaveMessage("Đã cập nhật avatar.");
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Upload avatar thất bại");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function saveProfile() {
    if (!user) return;

    setSaveBusy(true);
    setSaveMessage(null);
    try {
      const ref = doc(firebaseDb, "users", user.uid);

      const nextDisplayName = displayName.trim() || null;
      const nextPhone = phone.trim() || null;
      const nextAddress = address.trim() || null;
      const nextCity = city.trim() || null;
      const nextDistrict = district.trim() || null;

      await setDoc(
        ref,
        {
          ...(nextDisplayName ? { displayName: nextDisplayName } : { displayName: deleteField() }),
          ...(nextPhone ? { phone: nextPhone } : { phone: deleteField() }),
          ...(nextAddress ? { address: nextAddress } : { address: deleteField() }),
          ...(nextCity ? { city: nextCity } : { city: deleteField() }),
          ...(nextDistrict ? { district: nextDistrict } : { district: deleteField() }),
        },
        { merge: true }
      );

      setSaveMessage("Đã lưu hồ sơ.");
      if (profile) {
        setProfile({
          ...profile,
          ...(nextDisplayName ? { displayName: nextDisplayName } : {}),
          ...(nextPhone ? { phone: nextPhone } : {}),
          ...(nextAddress ? { address: nextAddress } : {}),
          ...(nextCity ? { city: nextCity } : {}),
          ...(nextDistrict ? { district: nextDistrict } : {}),
        });
      }
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : "Lưu hồ sơ thất bại");
    } finally {
      setSaveBusy(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-sm text-stone-600">Đang tải tài khoản...</div>;
  }

  return (
    <div>
      <PageHeader title="Trang cá nhân" subtitle="Thông tin cá nhân, bài đăng và cài đặt." />

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="px-5 pb-6 pt-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-stone-100 shadow ring-4 ring-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <LogoImage className="object-cover" />
                )}
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-all hover:bg-black/40">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.currentTarget.files?.[0];
                      if (file) void handleAvatarUpload(file);
                    }}
                    disabled={uploadingAvatar}
                  />
                  <span className="text-xs font-semibold text-white opacity-0 transition-opacity hover:opacity-100">
                    {uploadingAvatar ? "Đang..." : "Đổi"}
                  </span>
                </label>
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-stone-900 sm:text-xl">{nameForUi}</h2>
                  {role ? (
                    <span
                      className={
                        role === "admin"
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200"
                          : "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200"
                      }
                    >
                      {role === "admin" ? "Admin" : "User"}
                    </span>
                  ) : null}
                </div>

                <p className="mt-1 text-sm text-stone-600">
                  {user?.email ? <span>{user.email}</span> : <span className="italic">Chưa có email</span>}
                  {user?.uid ? <span className="ml-2 text-xs text-stone-500">• UID: {shortUid(user.uid)}</span> : null}
                </p>

                {profile?.createdAt ? (
                  <p className="mt-1 text-xs text-stone-500">Tham gia: {formatJoinDate(profile.createdAt)}</p>
                ) : null}

                {roleError ? <p className="mt-2 text-xs text-red-700">{roleError}</p> : null}
                {profileError ? <p className="mt-2 text-xs text-red-700">{profileError}</p> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {role === "admin" ? (
                <LinkButton href="/admin" variant="secondary">
                  Vào Admin
                </LinkButton>
              ) : null}
              <LinkButton href="/my-listings" variant="secondary">
                Tin đã đăng
              </LinkButton>
              <LinkButton href="/orders" variant="ghost">
                Đơn hàng
              </LinkButton>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  await signOut(firebaseAuth);
                }}
              >
                Đăng xuất
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 transition-all hover:border-emerald-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Bài đăng</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">
                    {dataLoading ? "…" : listingCount ?? 0}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">Tổng số tin bạn đã tạo</p>
                </div>
                <div className="rounded-lg bg-emerald-100 p-2.5">
                  <StatIcon type="listing" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 transition-all hover:border-amber-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Đang hiển thị</p>
                  <p className="mt-2 text-3xl font-bold text-stone-900">
                    {dataLoading ? "…" : activeListingCount ?? 0}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">Tin trạng thái hoạt động</p>
                </div>
                <div className="rounded-lg bg-amber-100 p-2.5">
                  <StatIcon type="active" />
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 transition-all hover:border-blue-200 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tài khoản</p>
                  <p className="mt-2 text-xl font-bold text-stone-900">
                    {accountMeta.emailVerified ? "✓ Đã xác minh" : "○ Chưa xác minh"}
                  </p>
                  <p className="mt-2 text-xs text-stone-600">{accountMeta.providerText}</p>
                </div>
                <div className="rounded-lg bg-blue-100 p-2.5">
                  <StatIcon type="account" />
                </div>
              </div>
            </div>
          </div>

          {dataError ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">⚠ {dataError}</div> : null}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Giới thiệu</p>
                  <p className="mt-1 text-sm text-stone-600">Thông tin cơ bản để người khác nhận diện bạn.</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!editingProfile) resetEditFields();
                    setEditingProfile((v) => !v);
                  }}
                  disabled={!user}
                >
                  {editingProfile ? "✕" : "✎"}
                </Button>
              </div>

              {!editingProfile ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Tên hiển thị</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">{nameForUi}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Số điện thoại</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">{phone.trim() ? phone : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Địa chỉ</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">{address.trim() ? address : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Thành phố</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">{city.trim() ? city : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Quận/Huyện</p>
                    <p className="mt-2 text-base font-semibold text-stone-900">{district.trim() ? district : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">UID</p>
                    <p className="mt-2 break-all font-mono text-xs text-stone-900">{user?.uid ?? ""}</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <TextField
                    label="Tên hiển thị"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    disabled={saveBusy || !user}
                  />
                  <TextField
                    label="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0901xxxxxx"
                    disabled={saveBusy || !user}
                  />
                  <TextField
                    label="Địa chỉ"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                    disabled={saveBusy || !user}
                  />
                  <TextField
                    label="Thành phố"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ví dụ: Hồ Chí Minh"
                    disabled={saveBusy || !user}
                  />
                  <TextField
                    label="Quận/Huyện"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ví dụ: Quận 1"
                    disabled={saveBusy || !user}
                  />
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Avatar</p>
                    <p className="mt-2 text-xs text-stone-600">Chọn ảnh để đổi avatar</p>
                    <input
                      type="file"
                      accept="image/*"
                      className="mt-3 block w-full text-xs"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) void handleAvatarUpload(file);
                      }}
                      disabled={uploadingAvatar}
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button type="button" onClick={() => void saveProfile()} disabled={saveBusy || !user}>
                      {saveBusy ? "Đang lưu..." : "Lưu"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        resetEditFields();
                        setEditingProfile(false);
                      }}
                      disabled={saveBusy}
                    >
                      Hủy
                    </Button>
                  </div>

                  {saveMessage ? (
                    <p className={"text-xs " + (saveMessage.includes("Đã lưu") ? "text-emerald-700" : "text-red-700")}>
                      {saveMessage}
                    </p>
                  ) : null}
                </div>
              )}

              {profileLoading ? <p className="mt-3 text-xs text-stone-500">Đang tải hồ sơ…</p> : null}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-900">Hoạt động gần đây</p>
                  <p className="mt-1 text-sm text-stone-600">Các tin đăng mới nhất của bạn.</p>
                </div>
                <LinkButton href="/my-listings" variant="secondary">
                  Xem tất cả
                </LinkButton>
              </div>

              {recentListings.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-white p-6 text-sm text-stone-600">
                  Chưa có tin đăng nào. Bạn có thể tạo tin ở trang <Link className="font-medium underline" href="/my-listings">Tin đã đăng</Link>.
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {recentListings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-6">

          <Card>
            <CardBody>
              <p className="text-sm font-semibold text-stone-900">Liên kết nhanh</p>
              <div className="mt-4 space-y-2">
                <LinkButton href="/my-listings" variant="ghost" className="justify-start h-11 text-sm font-medium">
                  <span>📋</span> Quản lý tin đăng
                </LinkButton>
                <LinkButton href="/chat" variant="ghost" className="justify-start h-11 text-sm font-medium">
                  <span>💬</span> Tin nhắn
                </LinkButton>
                <LinkButton href="/orders" variant="ghost" className="justify-start h-11 text-sm font-medium">
                  <span>📦</span> Đơn hàng
                </LinkButton>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
