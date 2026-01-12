"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { Card, CardBody } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { firebaseDb } from "@/lib/firebase/client";
import type { AppUser, UserRole } from "@/types/user";
import type { Listing } from "@/types/listing";
import { formatVnd } from "@/lib/utils/format";

type Stats = {
  totalListings: number;
  pendingListings: number;
  hiddenListings: number;
  totalUsers: number;
  totalAdmins: number;
};

function formatTime(ms: number) {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

function RoleBadge({ role }: { role: UserRole }) {
  const style =
    role === "admin"
      ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
      : "bg-amber-50 text-stone-900 ring-1 ring-amber-200";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${style}`}>
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

function ListingStatusBadge({ status }: { status: Listing["status"] }) {
  const { label, cls } =
    status === "active"
      ? { label: "Đang hiển thị", cls: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200" }
      : status === "hidden"
        ? { label: "Đã ẩn", cls: "bg-amber-50 text-stone-900 ring-1 ring-amber-200" }
        : { label: "Nháp", cls: "bg-stone-50 text-stone-700 ring-1 ring-stone-200" };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [savingUser, setSavingUser] = useState<string | null>(null);
  const [savingListing, setSavingListing] = useState<string | null>(null);

  const userRoleDraft = useMemo(() => {
    const map = new Map<string, UserRole>();
    for (const u of users) map.set(u.uid, u.role);
    return map;
  }, [users]);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError(null);

      try {
        const usersCol = collection(firebaseDb, "users");
        const listingsCol = collection(firebaseDb, "listings");

        const [
          totalListingsSnap,
          pendingListingsSnap,
          hiddenListingsSnap,
          totalUsersSnap,
          totalAdminsSnap,
        ] = await Promise.all([
          getCountFromServer(query(listingsCol)),
          getCountFromServer(query(listingsCol, where("status", "==", "draft"))),
          getCountFromServer(query(listingsCol, where("status", "==", "hidden"))),
          getCountFromServer(query(usersCol)),
          getCountFromServer(query(usersCol, where("role", "==", "admin"))),
        ]);

        const usersSnap = await getDocs(query(usersCol, orderBy("createdAt", "desc"), limit(10)));
        const listingsSnap = await getDocs(query(listingsCol, orderBy("createdAt", "desc"), limit(10)));

        if (!alive) return;

        setStats({
          totalListings: totalListingsSnap.data().count,
          pendingListings: pendingListingsSnap.data().count,
          hiddenListings: hiddenListingsSnap.data().count,
          totalUsers: totalUsersSnap.data().count,
          totalAdmins: totalAdminsSnap.data().count,
        });

        setUsers(
          usersSnap.docs
            .map((d) => d.data() as AppUser)
            .filter((u) => u && typeof u.uid === "string" && (u.role === "admin" || u.role === "user"))
        );

        setListings(
          listingsSnap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Listing, "id">) }) as Listing)
            .filter((l) => l && typeof l.id === "string" && typeof l.title === "string")
        );
      } catch (e) {
        console.error(e);
        setError(
          e instanceof Error
            ? e.message
            : "Không thể tải dữ liệu Admin. Hãy kiểm tra quyền Firestore (Rules) và role=admin của tài khoản."
        );
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader title="Bảng điều khiển Admin" subtitle="Quản trị hệ thống Farm2Art: người dùng, tin đăng, kiểm duyệt." />
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/" variant="secondary">
            Xem website
          </LinkButton>
          <LinkButton href="/admin/moderation" variant="primary">
            Duyệt tin
          </LinkButton>
        </div>
      </div>

      {error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-red-700">{error}</p>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardBody>
            <p className="text-xs font-medium text-stone-600">Tin đăng</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{stats ? stats.totalListings : "—"}</p>
            <p className="mt-1 text-xs text-stone-600">Tổng số trên hệ thống</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs font-medium text-stone-600">Chờ duyệt</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{stats ? stats.pendingListings : "—"}</p>
            <p className="mt-1 text-xs text-stone-600">Status = draft</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs font-medium text-stone-600">Đã ẩn</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{stats ? stats.hiddenListings : "—"}</p>
            <p className="mt-1 text-xs text-stone-600">Status = hidden</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs font-medium text-stone-600">Người dùng</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{stats ? stats.totalUsers : "—"}</p>
            <p className="mt-1 text-xs text-stone-600">Hồ sơ trong Firestore</p>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <p className="text-xs font-medium text-stone-600">Admin</p>
            <p className="mt-1 text-2xl font-semibold text-stone-900">{stats ? stats.totalAdmins : "—"}</p>
            <p className="mt-1 text-xs text-stone-600">Role = admin</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Quản lý người dùng</h2>
              <p className="mt-1 text-sm text-stone-600">Xem danh sách mới nhất và phân quyền admin/user.</p>
            </div>
            <p className="text-xs text-stone-600">Hiển thị 10 người dùng gần nhất</p>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-medium text-stone-600">
                  <th className="border-b border-stone-200 pb-2">Người dùng</th>
                  <th className="border-b border-stone-200 pb-2">UID</th>
                  <th className="border-b border-stone-200 pb-2">Vai trò</th>
                  <th className="border-b border-stone-200 pb-2">Tạo lúc</th>
                  <th className="border-b border-stone-200 pb-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {users.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} className="py-4 text-sm text-stone-600">
                      Chưa có dữ liệu người dùng hoặc bạn chưa có quyền đọc collection users.
                    </td>
                  </tr>
                ) : null}

                {users.map((u) => {
                  const current = userRoleDraft.get(u.uid) ?? u.role;
                  return (
                    <tr key={u.uid} className="align-middle">
                      <td className="border-b border-stone-100 py-3">
                        <div className="font-medium text-stone-900">{u.displayName ?? "(Chưa đặt tên)"}</div>
                        {u.phone ? <div className="text-xs text-stone-600">{u.phone}</div> : null}
                      </td>
                      <td className="border-b border-stone-100 py-3">
                        <span className="font-mono text-xs text-stone-700">{u.uid}</span>
                      </td>
                      <td className="border-b border-stone-100 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <RoleBadge role={u.role} />
                          <select
                            className="h-9 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            value={current}
                            onChange={(e) => {
                              const v = e.target.value === "admin" ? "admin" : "user";
                              setUsers((prev) => prev.map((x) => (x.uid === u.uid ? { ...x, role: v } : x)));
                            }}
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </div>
                      </td>
                      <td className="border-b border-stone-100 py-3 text-sm text-stone-700">
                        {typeof u.createdAt === "number" ? formatTime(u.createdAt) : "—"}
                      </td>
                      <td className="border-b border-stone-100 py-3 text-right">
                        <button
                          type="button"
                          disabled={savingUser === u.uid}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-stone-900 transition hover:bg-amber-100 disabled:opacity-50"
                          onClick={async () => {
                            try {
                              setSavingUser(u.uid);
                              const ref = doc(firebaseDb, "users", u.uid);

                              const roleToSave: UserRole = u.role === "admin" ? "admin" : "user";
                              const payload: Partial<AppUser> & { uid: string } = {
                                uid: u.uid,
                                role: roleToSave,
                              };

                              if (typeof u.createdAt !== "number") {
                                payload.createdAt = Date.now();
                              }

                              await updateDoc(ref, payload);
                            } catch (e) {
                              console.error(e);
                              setError(e instanceof Error ? e.message : "Không thể cập nhật quyền người dùng.");
                            } finally {
                              setSavingUser(null);
                            }
                          }}
                        >
                          {savingUser === u.uid ? "Đang lưu..." : "Lưu"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-stone-900">Quản lý tin đăng</h2>
              <p className="mt-1 text-sm text-stone-600">Xem nhanh tin mới nhất và ẩn/hiện tin vi phạm.</p>
            </div>
            <Link href="/admin/moderation" className="text-sm font-medium text-stone-900 hover:underline">
              Mở trang kiểm duyệt →
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] border-separate border-spacing-0">
              <thead>
                <tr className="text-left text-xs font-medium text-stone-600">
                  <th className="border-b border-stone-200 pb-2">Tin</th>
                  <th className="border-b border-stone-200 pb-2">Chủ tin</th>
                  <th className="border-b border-stone-200 pb-2">Giá</th>
                  <th className="border-b border-stone-200 pb-2">Trạng thái</th>
                  <th className="border-b border-stone-200 pb-2">Tạo lúc</th>
                  <th className="border-b border-stone-200 pb-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {listings.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-sm text-stone-600">
                      Chưa có dữ liệu tin đăng.
                    </td>
                  </tr>
                ) : null}

                {listings.map((l) => {
                  const canToggle = l.status === "active" || l.status === "hidden";
                  const nextStatus: Listing["status"] = l.status === "hidden" ? "active" : "hidden";

                  return (
                    <tr key={l.id} className="align-middle">
                      <td className="border-b border-stone-100 py-3">
                        <div className="font-medium text-stone-900">{l.title}</div>
                        <div className="text-xs text-stone-600">{l.type === "byproduct" ? "Phế phẩm" : "Farm2Art"}</div>
                      </td>
                      <td className="border-b border-stone-100 py-3">
                        <span className="font-mono text-xs text-stone-700">{l.ownerId}</span>
                      </td>
                      <td className="border-b border-stone-100 py-3 text-sm text-stone-700">{formatVnd(l.price)}</td>
                      <td className="border-b border-stone-100 py-3">
                        <ListingStatusBadge status={l.status} />
                      </td>
                      <td className="border-b border-stone-100 py-3 text-sm text-stone-700">
                        {typeof l.createdAt === "number" ? formatTime(l.createdAt) : "—"}
                      </td>
                      <td className="border-b border-stone-100 py-3 text-right">
                        <button
                          type="button"
                          disabled={!canToggle || savingListing === l.id}
                          className="inline-flex h-9 items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-3 text-sm font-medium text-stone-900 transition hover:bg-amber-100 disabled:opacity-50"
                          onClick={async () => {
                            try {
                              setSavingListing(l.id);
                              const ref = doc(firebaseDb, "listings", l.id);
                              await updateDoc(ref, { status: nextStatus } as Partial<Listing>);
                              setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, status: nextStatus } : x)));
                            } catch (e) {
                              console.error(e);
                              setError(e instanceof Error ? e.message : "Không thể cập nhật trạng thái tin đăng.");
                            } finally {
                              setSavingListing(null);
                            }
                          }}
                        >
                          {savingListing === l.id ? "Đang lưu..." : nextStatus === "hidden" ? "Ẩn tin" : "Hiện tin"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="text-base font-semibold text-stone-900">Các module khác</h2>
          <p className="mt-1 text-sm text-stone-600">
            Nếu bạn muốn “đầy đủ mọi chức năng” (đơn hàng, thanh toán, quản lý tin tức, cấu hình hệ thống), mình sẽ làm tiếp
            theo đúng schema Firestore của bạn.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Quản lý đơn hàng</p>
              <p className="mt-1 text-sm text-stone-600">Cần xác nhận collection/fields (orders).</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Thanh toán</p>
              <p className="mt-1 text-sm text-stone-600">Kết nối VNPay + đối soát IPN (nếu bật).</p>
            </div>
            <div className="rounded-xl border border-stone-200 bg-white p-4">
              <p className="text-sm font-medium text-stone-900">Quản lý nội dung</p>
              <p className="mt-1 text-sm text-stone-600">Tin tức hiện đang mock; muốn admin CRUD cần lưu Firestore.</p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
