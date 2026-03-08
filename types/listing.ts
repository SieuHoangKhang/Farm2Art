export type ListingType = "byproduct" | "art";

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
  cleaningFee?: number; // Phí sơ chế (VNĐ/kg)
  storageFeePerDay?: number; // Phí lưu kho (VNĐ/kg/ngày)
  shippingFee?: number; // Phí vận chuyển (VNĐ/đơn hoặc VNĐ/kg)
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
  commissionRate?: number; // % hoa hồng (mặc định 10%)
  serviceFeeConfig?: ListingServiceFee; // Cấu hình phí dịch vụ
  
  createdAt: number;
};
