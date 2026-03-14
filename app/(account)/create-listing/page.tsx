"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button, LinkButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { useAuthUser } from "@/lib/auth/useAuthUser";
import { firebaseDb } from "@/lib/firebase/client";
import type { Listing, ProcessingPreference } from "@/types/listing";

const AGREEMENT_COMMISSION_RATE = 0.2;

export default function CreateListingPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useAuthUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState<"byproduct" | "art" | "fertilizer">("byproduct");
  const [processingPreference, setProcessingPreference] = useState<ProcessingPreference>("warehouse");
  const [sellerAcceptedAgreement, setSellerAcceptedAgreement] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [newListingId, setNewListingId] = useState<string | null>(null);
  const [vnpayWalletName, setVnpayWalletName] = useState("VNPAY");
  const [hasConfiguredVnpay, setHasConfiguredVnpay] = useState(false);

  useEffect(() => {
    async function loadPayoutAccount() {
      if (!user?.uid) return;
      try {
        const [userSnap, profileSnap] = await Promise.all([
          getDoc(doc(firebaseDb, "users", user.uid)),
          getDoc(doc(firebaseDb, "user_profiles", user.uid)),
        ]);

        const payout = userSnap.data()?.payoutAccount as
          | { bankName?: string; accountNumber?: string; accountHolder?: string }
          | undefined;

        const savedMethods = profileSnap.data()?.savedPaymentMethods as
          | Array<{ type?: string; name?: string }>
          | undefined;
        const vnpayMethodName = Array.isArray(savedMethods)
          ? (savedMethods.find((m) => m?.type === "ewallet" && /vnpay/i.test(String(m?.name || "")))?.name || "")
          : "";

        if (vnpayMethodName) {
          setVnpayWalletName(vnpayMethodName);
          setHasConfiguredVnpay(true);
        } else if (payout?.bankName && /vnpay/i.test(String(payout.bankName))) {
          setVnpayWalletName("VNPAY");
          setHasConfiguredVnpay(true);
        }
      } catch {
        // Ignore prefill failure to avoid blocking listing form.
      }
    }

    void loadPayoutAccount();
  }, [user?.uid]);

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

    const shippingFeeRate = processingPreference === "warehouse" ? 0.05 : 0;

    if (!sellerAcceptedAgreement) {
      setError("Bạn cần xác nhận đồng ý thỏa thuận phí trước khi gửi admin duyệt");
      return;
    }

    if (!hasConfiguredVnpay) {
      setError("Vui lòng vào trang cá nhân cập nhật phương thức thanh toán VNPAY trước khi đăng bán.");
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
        commissionRate: AGREEMENT_COMMISSION_RATE,
        serviceFeeConfig: {
          shippingFee: shippingFeeRate,
        },
        agreement: {
          commissionRate: AGREEMENT_COMMISSION_RATE,
          processingFee: 0,
          shippingFee: shippingFeeRate,
          sellerAccepted: true,
          sellerAcceptedAt: Date.now(),
        },
        createdAt: new Date().getTime(),
        };

      const listingsRef = collection(firebaseDb, "listings");
      const docRef = await addDoc(listingsRef, listing);

      await setDoc(
        doc(firebaseDb, "users", user.uid),
        {
          payoutAccount: {
            bankName: "VNPAY",
            accountNumber: `WALLET-${user.uid.slice(0, 8).toUpperCase()}`,
            accountHolder: user.displayName || user.email || user.uid,
            updatedAt: Date.now(),
          },
        },
        { merge: true }
      );

      // Đồng bộ về hồ sơ thanh toán cá nhân để admin payout có thể nhận diện ví VNPAY.
      const profileRef = doc(firebaseDb, "user_profiles", user.uid);
      const profileSnap = await getDoc(profileRef);
      const existingMethods = (profileSnap.data()?.savedPaymentMethods as
        | Array<{ id?: string; type?: string; name?: string; default?: boolean }>
        | undefined) || [];
      const hasVnpay = existingMethods.some(
        (m) => m?.type === "ewallet" && /vnpay/i.test(String(m?.name || ""))
      );

      if (!hasVnpay) {
        await setDoc(
          profileRef,
          {
            savedPaymentMethods: [
              ...existingMethods,
              {
                id: `vnpay-${Date.now()}`,
                type: "ewallet",
                name: vnpayWalletName.trim() || "VNPAY",
                default: existingMethods.length === 0,
              },
            ],
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // Update user's listing count
      const userRef = doc(firebaseDb, "users", user.uid);
      const snap = await getDoc(userRef);
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
                Sản phẩm &quot;{title}&quot; của bạn đã được tạo thành công.
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
                      onChange={(e) => setType(e.target.value as "byproduct" | "art" | "fertilizer")}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Sản phẩm phụ</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="fertilizer"
                      checked={type === "fertilizer"}
                      onChange={(e) => setType(e.target.value as "byproduct" | "art" | "fertilizer")}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Phân bón</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="art"
                      checked={type === "art"}
                      onChange={(e) => setType(e.target.value as "byproduct" | "art" | "fertilizer")}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Tác phẩm nghệ thuật</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-900">Phương án giao hàng</label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="warehouse"
                      checked={processingPreference === "warehouse"}
                      onChange={(e) => setProcessingPreference(e.target.value as ProcessingPreference)}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Web giữ hàng tại kho và giao cho khách (phí vận chuyển 5% tổng đơn)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="self"
                      checked={processingPreference === "self"}
                      onChange={(e) => setProcessingPreference(e.target.value as ProcessingPreference)}
                      className="rounded-full"
                    />
                    <span className="ml-2 text-sm text-stone-700">Người bán giao trực tiếp cho khách (không phí vận chuyển)</span>
                  </label>
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-amber-900">Thỏa thuận gửi admin duyệt</p>
                <p className="text-xs text-amber-800">
                  Hoa hồng admin sau khi bán thành công: <strong>{(AGREEMENT_COMMISSION_RATE * 100).toFixed(0)}%</strong> trên tổng hóa đơn.
                </p>
                <p className="text-xs text-amber-800">
                  Chính sách vận chuyển: <strong>{processingPreference === "warehouse" ? "5% tổng đơn hàng" : "0% (giao trực tiếp)"}</strong>.
                </p>

                <label className="flex items-start gap-2 rounded-lg border border-amber-300 bg-white p-3">
                  <input
                    type="checkbox"
                    checked={sellerAcceptedAgreement}
                    onChange={(e) => setSellerAcceptedAgreement(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-xs text-stone-700">
                    Tôi đồng ý mức hoa hồng 20% và chính sách vận chuyển đã chọn, đồng thời gửi bài đăng để admin xét duyệt theo thỏa thuận ban đầu.
                  </span>
                </label>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-900">Phương thức nhận tiền người bán (bắt buộc)</p>
                <p className="text-xs text-emerald-800">
                  Farm2Art chỉ hỗ trợ ví điện tử VNPAY cho luồng chi trả người bán.
                </p>
                <select
                  value={vnpayWalletName}
                  onChange={(e) => setVnpayWalletName(e.target.value)}
                  className="w-full rounded-lg border border-emerald-300 px-3 py-2 text-sm"
                  required
                >
                  <option value="VNPAY">VNPAY</option>
                </select>
                {!hasConfiguredVnpay ? (
                  <p className="text-xs text-red-600">
                    Bạn chưa cấu hình VNPAY trong trang cá nhân. Hãy cập nhật trước khi gửi đăng bán.
                  </p>
                ) : null}
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
                          {/* eslint-disable-next-line @next/next/no-img-element */}
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
