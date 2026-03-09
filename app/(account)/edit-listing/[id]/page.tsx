"use client";

import { useState, useEffect } from "react";
import { collection, doc, getDoc, updateDoc } from "firebase/firestore";
import { useRouter, useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing, ProcessingPreference } from "@/types/listing";

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const listingId = params.id as string;
  const { user, loading: userLoading } = useAuthUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<"byproduct" | "art" | "fertilizer">("byproduct");
  const [processingPreference, setProcessingPreference] = useState<ProcessingPreference>("buyer_choice");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    async function loadListing() {
      if (!user) return;

      try {
        const docRef = doc(firebaseDb, "listings", listingId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError("Không tìm thấy bài đăng");
          setLoading(false);
          return;
        }

        const data = { id: docSnap.id, ...docSnap.data() } as Listing;

        // Check ownership
        if (data.sellerId !== user.uid) {
          setError("Bạn không có quyền sửa bài đăng này");
          setLoading(false);
          return;
        }

        setListing(data);
        setTitle(data.title);
        setDescription(data.description || "");
        setPrice(data.price.toString());
        setType(data.type);
        setProcessingPreference(data.processingPreference || "buyer_choice");
        setImages(
          Array.isArray(data.images)
            ? data.images.map((img) =>
                typeof img === "string" ? img : img.secureUrl || ""
              )
            : []
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi tải bài đăng");
      } finally {
        setLoading(false);
      }
    }

    void loadListing();
  }, [listingId, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !listing) {
      setError("Lỗi xác thực người dùng");
      return;
    }

    if (!title || !description || !price) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const docRef = doc(firebaseDb, "listings", listing.id);
      await updateDoc(docRef, {
        title,
        description,
        price: parseInt(price),
        type,
        processingPreference,
        images,
      });

      router.push(`/listing/${listing.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi cập nhật bài đăng");
    } finally {
      setSaving(false);
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

  if (userLoading || loading) {
    return <div className="py-10 text-center text-stone-600">Đang tải...</div>;
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-stone-600">Vui lòng đăng nhập để sửa bài đăng.</p>
            <LinkButton href="/login" className="mt-4">
              Đăng nhập
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error && !listing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Card>
          <CardBody>
            <p className="text-red-600">{error}</p>
            <LinkButton href="/my-listings" className="mt-4">
              ← Quay lại
            </LinkButton>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sửa bài đăng" subtitle="Cập nhật thông tin sản phẩm" />

      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <Card>
          <CardBody>
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <TextField
                label="Tiêu đề"
                placeholder="Nhập tiêu đề sản phẩm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-stone-900">
                  Mô tả
                </label>
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
                <label className="block text-sm font-semibold text-stone-900">
                  Loại sản phẩm
                </label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="byproduct"
                      checked={type === "byproduct"}
                      onChange={(e) =>
                        setType(e.target.value as "byproduct" | "art" | "fertilizer")
                      }
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">
                      Sản phẩm phụ
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fertilizer"
                      checked={type === "fertilizer"}
                      onChange={(e) =>
                        setType(e.target.value as "byproduct" | "art" | "fertilizer")
                      }
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">
                      Phân bón
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="art"
                      checked={type === "art"}
                      onChange={(e) =>
                        setType(e.target.value as "byproduct" | "art" | "fertilizer")
                      }
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">
                      Tác phẩm nghệ thuật
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900">Phương án sơ chế</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="buyer_choice"
                      checked={processingPreference === "buyer_choice"}
                      onChange={(e) => setProcessingPreference(e.target.value as ProcessingPreference)}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Cho người mua chọn</span>
                  </label>
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
                    <span className="ml-2 text-sm text-stone-700">Kho Farm2Art sơ chế</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900">
                  Ảnh
                </label>
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Preview ${idx + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setImages(images.filter((_, i) => i !== idx))
                          }
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
                  disabled={saving}
                  className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-stone-400"
                >
                  {saving ? "Đang cập nhật..." : "Cập nhật"}
                </Button>
                <LinkButton
                  href="/my-listings"
                  variant="secondary"
                  className="flex-1 text-center"
                >
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
