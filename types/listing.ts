export type ListingType = "byproduct" | "art" | "fertilizer";

export type ProcessingPreference = "self" | "warehouse" | "buyer_choice";

export type ListingStatus = "draft" | "pending_approval" | "approved" | "rejected" | "archived" | "active" | "hidden" | "inactive";

export type ListingImage = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
};

export type ListingServiceFee = {
  weight?: number; // kg (cho tính phí dịch vụ)
  processingFee?: number; // Phí sơ chế theo giá thị trường (VNĐ/đơn)
  cleaningFee?: number; // Phí sơ chế (VNĐ/kg)
  storageFeePerDay?: number; // Phí lưu kho (VNĐ/kg/ngày)
  shippingFee?: number; // Phí vận chuyển (VNĐ/đơn hoặc VNĐ/kg)
};

export type ListingAgreement = {
  commissionRate: number; // Tỉ lệ hoa hồng admin hưởng sau bán (mặc định 20%)
  processingFee: number; // Không dùng trong luồng mới (giữ để tương thích dữ liệu cũ)
  shippingFee: number; // Tỉ lệ phí vận chuyển (0.05 = 5%, 0 = miễn phí)
  sellerAccepted: boolean; // Seller xác nhận đồng ý thỏa thuận
  sellerAcceptedAt?: number;
};

export type Listing = {
  id: string;
  type: ListingType;
  title: string;
  description?: string;
  price: number;
  quantity?: number;
  unit?: string;
  location?: string;
  sellerId: string;
  ownerId?: string;
  processingPreference?: ProcessingPreference;
  images: ListingImage[] | string[];
  status: ListingStatus;
  
  // ⭐ APPROVAL & COMMISSION (Mới)
  approvalStatus?: "draft" | "pending_approval" | "approved" | "rejected";
  rejectionReason?: string;
  approvedAt?: number;
  rejectedAt?: number;
  reviewedBy?: string; // Admin ID
  commissionRate?: number; // % hoa hồng (mặc định 20%)
  serviceFeeConfig?: ListingServiceFee; // Cấu hình phí dịch vụ
  agreement?: ListingAgreement;
  
  createdAt: number;
};
