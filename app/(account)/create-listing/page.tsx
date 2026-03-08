"use client";

import { useState } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing, ProcessingPreference } from "@/types/listing";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<"byproduct" | "art">("byproduct");
  const [processingPreference, setProcessingPreference] = useState<ProcessingPreference>("warehouse");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newListingId, setNewListingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Vui lòng đăng nhập");
      return;
    }

    if (!title || !description || !price) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const listing: Omit<Listing, "id"> = {
        sellerId: user.uid,
        title,
        description,
        price: parseInt(price),
        type,
        processingPreference,
        images: images as string[],
        status: "inactive",
        approvalStatus: "pending_approval",
        createdAt: new Date().getTime(),
      };

      const listingsRef = collection(firebaseDb, "listings");
      const docRef = await addDoc(listingsRef, listing);

      // Update user's listing count
      const userRef = doc(firebaseDb, "users", user.uid);
      const snap = await (await import("firebase/firestore")).getDoc(userRef);
      if (snap.exists()) {
        const currentCount = snap.data().listingCount || 0;
        await updateDoc(userRef, { listingCount: currentCount + 1 });
      }

      setNewListingId(docRef.id);
      setSuccess(true);
      
      // Auto-redirect after 3.5 seconds
      setTimeout(() => {
        router.push(`/listing/${docRef.id}`);
      }, 3500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tạo bài đăng");
    } finally {
      setLoading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("📤 Uploading image:", file.name);
      const response = await fetch("/api/upload-listing-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => null);
      console.log("📥 Upload response:", data);
      
      if (!response.ok) {
        const message =
          (data && (data.error as string)) ||
          (data?.details?.error?.message as string) ||
          "Upload failed";
        console.error("❌ Upload error:", message);
        throw new Error(message);
      }

      console.log(" Image URL:", data.secure_url);
      setImages((prev) => [...prev, data.secure_url].filter(Boolean));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lỗi khi tải ảnh";
      console.error("💥 Error:", msg);
      setError(msg);
    }
  }

  if (userLoading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-stone-600">Vui lòng đăng nhập để đăng bán sản phẩm.</p>
            <LinkButton href="/login" className="mt-4">
              Đăng nhập
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Đăng bán sản phẩm" subtitle="Chia sẻ sản phẩm của bạn với cộng đồng" />

      {/* Success Modal */}
      {success && newListingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardBody className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-emerald-100 p-4">
                  <svg className="h-12 w-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <h2 className="mb-2 text-2xl font-bold text-emerald-600">Tạo tin thành công!</h2>
              
              <p className="mb-6 text-base text-stone-700">
                Sản phẩm "{title}" của bạn đã được tạo thành công.
              </p>
              
              <div className="mb-6 rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
                <p className="mb-2 flex items-start gap-2 text-sm">
                  <span className="mt-1 text-lg">⏳</span>
                  <span>
                    <strong>Chờ duyệt từ Admin</strong><br />
                    Bài đăng của bạn đang được kiểm duyệt bởi admin. Quá trình này thường mất vài giờ.
                  </span>
                </p>
              </div>

              <div className="mb-4 flex flex-col gap-2 text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Tin được lưu và chờ phê duyệt</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Bạn sẽ nhận thông báo khi được duyệt</span>
                </div>
              </div>

              <p className="mb-6 text-sm text-stone-500">Chuyển hướng sau vài giây...</p>

              <Button
                onClick={() => router.push(`/listing/${newListingId}`)}
                className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Xem bài đăng ngay
              </Button>
            </CardBody>
          </Card>
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Card>
          <CardBody>
            {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label="Tiêu đề"
                placeholder="Nhập tiêu đề sản phẩm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-stone-900">Mô tả</label>
                <textarea
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-500 focus:border-emerald-500 focus:outline-none"
                  placeholder="Nhập mô tả chi tiết sản phẩm"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </div>

              <TextField
                label="Giá (VNĐ)"
                placeholder="Nhập giá sản phẩm"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-stone-900">Loại sản phẩm</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="byproduct"
                      checked={type === "byproduct"}
                      onChange={(e) => setType(e.target.value as "byproduct" | "art")}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Sản phẩm phụ</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="art"
                      checked={type === "art"}
                      onChange={(e) => setType(e.target.value as "byproduct" | "art")}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Tác phẩm nghệ thuật</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900">Phương án sơ chế</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="self"
                      checked={processingPreference === "self"}
                      onChange={(e) => setProcessingPreference(e.target.value as ProcessingPreference)}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Người bán tự sơ chế</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="warehouse"
                      checked={processingPreference === "warehouse"}
                      onChange={(e) => setProcessingPreference(e.target.value as ProcessingPreference)}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Sử dụng kho Farm2Art để sơ chế</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900">Ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-2 block w-full text-sm text-stone-500"
                />
                {images.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="group relative">
                        <div className="relative aspect-square overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="absolute right-1 top-1 rounded-full bg-red-500/80 px-2 py-1 opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100 text-white text-xs font-bold"
                          title="Xóa ảnh"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                >
                  {loading ? "Đang tạo..." : "Đăng bán"}
                </Button>
                <LinkButton href="/my-listings" variant="secondary" className="flex-1 text-center">
                  Hủy
                </LinkButton>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
