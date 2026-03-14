"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { firebaseDb } from "@/lib/firebase/client";
import { MP_COLLECTIONS } from "@/lib/marketplace/collections";
import type { Product, Inventory } from "@/types/marketplace";

export default function MarketplaceProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [buyerId, setBuyerId] = useState(""); // Demo: nhập tay hoặc lấy từ auth
  const [shippingAddress, setShippingAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function loadProduct() {
    try {
      setLoading(true);
      const [pSnap, iSnap] = await Promise.all([
        getDoc(doc(firebaseDb, MP_COLLECTIONS.products, productId)),
        getDoc(doc(firebaseDb, MP_COLLECTIONS.inventories, productId)),
      ]);

      if (!pSnap.exists()) {
        showToast("Không tìm thấy sản phẩm.");
        return;
      }

      setProduct({ id: pSnap.id, ...pSnap.data() } as Product);
      if (iSnap.exists()) {
        setInventory({ id: iSnap.id, ...iSnap.data() } as Inventory);
      }
    } catch (e) {
      console.error(e);
      showToast("Lỗi tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  }

  async function handleOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !buyerId.trim() || !shippingAddress.trim()) {
      showToast("Vui lòng nhập đầy đủ thông tin mua hàng.");
      return;
    }

    if (quantity < 1) {
      showToast("Số lượng phải lớn hơn 0.");
      return;
    }

    if (inventory && quantity > inventory.quantityInStock) {
      showToast(`Chỉ còn ${inventory.quantityInStock} sản phẩm trong kho.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          buyerId: buyerId.trim(),
          quantity,
          shippingAddress: shippingAddress.trim(),
          buyerNote: buyerNote.trim() || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Đặt hàng thất bại.");
      }

      showToast(data?.message || "Đặt hàng thành công!");

      // Chuyển sang trang đơn hàng của buyer hoặc hiển thị mã đơn
      setTimeout(() => {
        router.push("/account/orders");
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Lỗi đặt hàng.";
      showToast(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n || 0);

  const totalPrice = product ? product.price * quantity : 0;

  // Tính phí dự kiến (hiển thị để buyer biết trước)
  const commissionFee = product ? Math.round(product.price * quantity * (product.defaultCommissionRate || 0.1)) : 0;
  const processingFee = product?.defaultProcessingFee || 0;
  const shippingFee = product?.defaultShippingFee || 0;
  const sellerReceives = totalPrice - commissionFee - processingFee - shippingFee;

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-500">Đang tải sản phẩm...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-stone-500">Sản phẩm không tồn tại.</div>
      </div>
    );
  }

  const canBuy = product.status === "ACTIVE" && !product.isDeleted && inventory && inventory.quantityInStock > 0;

  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl text-sm shadow-xl">
          {toast}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-800">{product.title}</h1>
          <p className="text-stone-500 mt-2">Mã sản phẩm: {product.id}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Thông tin sản phẩm */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sage-200">
            <h2 className="text-lg font-bold text-stone-700 mb-4">Thông tin sản phẩm</h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-stone-500">Giá bán</p>
                <p className="text-2xl font-extrabold text-emerald-600">{fmtMoney(product.price)}</p>
              </div>

              {product.description && (
                <div>
                  <p className="text-sm text-stone-500">Mô tả</p>
                  <p className="text-stone-700">{product.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-xs text-stone-500">Còn trong kho</p>
                  <p className="text-lg font-bold text-stone-800">
                    {inventory?.quantityInStock ?? 0}
                  </p>
                </div>
                <div className="bg-sage-50 rounded-xl p-3">
                  <p className="text-xs text-stone-500">Trạng thái</p>
                  <p className={`text-sm font-bold ${canBuy ? "text-emerald-600" : "text-red-500"}`}>
                    {canBuy ? "Còn hàng" : "Không khả dụng"}
                  </p>
                </div>
              </div>

              <div className="border-t border-sage-100 pt-4">
                <p className="text-xs text-stone-500 mb-2">Phí dịch vụ (tham khảo)</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Hoa hồng ({((product.defaultCommissionRate || 0.1) * 100).toFixed(0)}%)</span>
                    <span className="text-red-500">-{fmtMoney(commissionFee)}</span>
                  </div>
                  {processingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Phí sơ chế</span>
                      <span className="text-red-500">-{fmtMoney(processingFee)}</span>
                    </div>
                  )}
                  {shippingFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Phí vận chuyển</span>
                      <span className="text-red-500">-{fmtMoney(shippingFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-sage-100 pt-2 mt-2">
                    <span className="text-stone-700">Người bán nhận (ước tính)</span>
                    <span className="text-emerald-600">{fmtMoney(Math.max(sellerReceives, 0))}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form đặt hàng */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-sage-200">
            <h2 className="text-lg font-bold text-stone-700 mb-4">Đặt hàng</h2>

            <form onSubmit={handleOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Buyer ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={buyerId}
                  onChange={(e) => setBuyerId(e.target.value)}
                  placeholder="Nhập ID người mua (demo)"
                  className="w-full px-4 py-3 rounded-2xl border border-sage-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Số lượng <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={inventory?.quantityInStock || 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-2xl border border-sage-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Địa chỉ giao hàng <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Nhập địa chỉ đầy đủ..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-sage-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Ghi chú (tuỳ chọn)
                </label>
                <textarea
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="Ghi chú thêm cho đơn hàng..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl border border-sage-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Tổng tiền */}
              <div className="bg-emerald-50 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-stone-700 font-medium">Tổng tiền</span>
                  <span className="text-2xl font-extrabold text-emerald-700">{fmtMoney(totalPrice)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canBuy || submitting}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-lg shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? "Đang xử lý..." : "Đặt hàng ngay"}
              </button>

              {!canBuy && (
                <p className="text-center text-red-500 text-sm">
                  Sản phẩm hiện không thể đặt hàng.
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
