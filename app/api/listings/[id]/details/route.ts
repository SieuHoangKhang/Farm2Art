/**
 * GET /api/listings/[id]/details
 * Lấy chi tiết listing + fee breakdown preview cho buyer & seller
 */

import { NextRequest, NextResponse } from "next/server";
import { Listing } from "@/types/listing";
import { calculateOrderFeeBreakdown } from "@/lib/config/platformFees";
import { getAdminDb } from "@/lib/firebase/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: listingId } = await params;
  const db = getAdminDb();
  try {
    // 1. Lấy listing
    const listingDoc = await db.collection("listings").doc(listingId).get();
    if (!listingDoc.exists) {
      return NextResponse.json(
        { error: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    const listing = listingDoc.data() as Listing;

    // 2. Check approval status
    // Nếu chưa approved, chỉ cho seller xem
    if (listing.approvalStatus !== "approved") {
      const userId = req.headers.get("x-user-id");
      if (userId !== listing.sellerId) {
        return NextResponse.json(
          { error: "Sản phẩm chưa được duyệt" },
          { status: 403 }
        );
      }
    }

    // 3. Lấy seller info
    const sellerDoc = await db.collection("users").doc(listing.sellerId).get();
    const seller = sellerDoc.data();

    // 3. Tính fee preview dựa theo lựa chọn sẵn của seller
    const actualProcessingMode =
      listing.processingPreference === "self" ? "self" : "warehouse";

    // Preview: không biết pickupDate/readyToShipDate nên dùng default
    const feePreview = calculateOrderFeeBreakdown({
      subTotal: listing.price,
      weight: listing.serviceFeeConfig?.weight || 0,
      // Không truyền dates - sẽ dùng default 3 ngày
      processingMode: actualProcessingMode,
      commissionRate: listing.commissionRate || 0.1,
    });

    // 4. Mapping description cho processingPreference
    const processingDescriptions: Record<string, string> = {
      self: "🚜 Người bán tự sơ chế - Platform chỉ đi lấy và giao",
      warehouse: "🏢 Platform sơ chế và lưu giữ tại kho",
      buyer_choice: "🤝 Khách hàng chọn cách xử lý (không dùng nữa)",
    };

    return NextResponse.json(
      {
        listing: {
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          images: listing.images,
          status: listing.status,
          sellerId: listing.sellerId,
          sellerName: seller?.name || seller?.email,
          processingPreference: listing.processingPreference,
        },
        processing: {
          // ✅ SIMPLIFIED: Seller đã chọn sẳn, buyer không chọn
          sellerChoice: listing.processingPreference,
          description: processingDescriptions[listing.processingPreference || "warehouse"],
          label:
            listing.processingPreference === "self"
              ? "🚜 Tự sơ chế"
              : "🏢 Platform sơ chế",
          // ❌ REMOVED: buyerCanChoose - người mua không chọn
        },
        feePreview: {
          // ✅ ONLY show actual fees (not multiple scenarios)
          basePrice: feePreview.subTotal,
          pickupFee: feePreview.pickupFee,
          processingFee: feePreview.processingFee,
          storageFee: feePreview.storageFee,
          commissionFee: feePreview.commissionAmount,
          totalFees: feePreview.totalDeductions,
          sellerReceives: feePreview.sellerPayout,
          commissionPercentage: (feePreview.commission * 100).toFixed(0),
          note: "Seller sẽ nhận khoản này sau khi xác nhận giao hàng",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Lỗi lấy chi tiết listing:", error);
    return NextResponse.json(
      { error: error.message || "Lỗi lấy chi tiết listing" },
      { status: 500 }
    );
  }
}
