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
import type { Listing } from "@/types/listing";

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<"byproduct" | "art">("byproduct");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) {
      setError("Vui lòng đăng nhập");
      return;
    }

    if (!title || !description || !price || !location) {
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
        location,
        type,
        images: images as string[],
        status: "active",
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

      router.push(`/listing/${docRef.id}`);
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
      // Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setImages([...images, data.secure_url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tải ảnh");
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
            <LinkButton href="/auth/login" className="mt-4">
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

              <TextField
                label="Địa điểm"
                placeholder="Nhập địa điểm bán"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
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
                <label className="block text-sm font-semibold text-stone-900">Ảnh</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-2 block w-full text-sm text-stone-500"
                />
                {images.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {images.map((img, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-lg border border-stone-200 p-2">
                        <span className="text-sm text-stone-700">Ảnh {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setImages(images.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-700"
                        >
                          Xóa
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
                <LinkButton href="/account/my-listings" variant="secondary" className="flex-1 text-center">
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
