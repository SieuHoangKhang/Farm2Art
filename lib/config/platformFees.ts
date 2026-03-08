/**
 * Farm2Art Platform Fee Configuration
 * Cấu hình toàn hệ thống cho commission, service fees
 */

export const PLATFORM_CONFIG = {
  // ======= COMMISSION =======
  defaultCommissionRate: 0.1, // 10% hoa hồng mặc định
  minCommissionRate: 0.05, // Tối thiểu 5%
  maxCommissionRate: 0.15, // Tối đa 15%

  // ======= PICKUP FEE =======
  pickupFeePerOrder: 50000, // Phí đi lấy: 50.000đ/đơn hàng

  // ======= SERVICE FEES (Tính theo kg) =======
  serviceFeesPerKg: {
    cleaning: 15000, // Phí sơ chế: 15.000đ/kg
    storagePerDay: 5000, // Phí lưu kho: 5.000đ/kg/ngày
    shipping: 0, // Phí vận chuyển được tính riêng theo đơn
  },

  // ======= WAREHOUSE STORAGE =======
  defaultStorageDays: 7, // Mặc định lưu 7 ngày
  maxStorageDays: 30, // Tối đa 30 ngày

  // ======= PAYMENT =======
  minimumOrderValue: 50000, // Đơn tối thiểu 50k
  maximumOrderValue: 100000000, // Đơn tối đa 100M

  // ======= PAYOUT SCHEDULE =======
  payoutAfterDaysOfDelivery: 3, // Seller nhận tiền sau 3 ngày xác nhận giao hàng
  autoPayoutEnabled: false, // Tắt auto-payout lúc sandbox
};

// Hàm tính commission
export const calculateCommission = (
  amount: number,
  rate: number = PLATFORM_CONFIG.defaultCommissionRate
): number => {
  return Math.round(amount * rate);
};

// Hàm tính phí dịch vụ kho
export const calculateServiceFee = (
  weight: number,
  storageDays: number,
  includeShipping: boolean = true,
  shippingFee: number = 0
): { cleaning: number; storage: number; shipping: number; total: number } => {
  const cleaning = Math.round(weight * PLATFORM_CONFIG.serviceFeesPerKg.cleaning);
  const storage = Math.round(weight * storageDays * PLATFORM_CONFIG.serviceFeesPerKg.storagePerDay);
  const shipping = includeShipping ? shippingFee : 0;
  const total = cleaning + storage + shipping;

  return {
    cleaning,
    storage,
    shipping,
    total,
  };
};

// Hàm tính payout cho seller
export const calculateSellerPayout = (
  grandTotal: number,
  commissionRate: number = PLATFORM_CONFIG.defaultCommissionRate
): { commission: number; payout: number } => {
  const commission = calculateCommission(grandTotal, commissionRate);
  const payout = grandTotal - commission;

  return {
    commission,
    payout,
  };
};

/**
 * 🆕 Tính tự động số ngày lưu kho
 * 
 * Timeline:
 * 1. pickupDate: Admin đi lấy hàng từ seller
 * 2. Sơ chế & lưu kho tại warehouse
 * 3. readyToShipDate: Xác nhận xong, sẳn vận chuyển
 * 
 * Công thức:
 * storageDays = (readyToShipDate - pickupDate) / (1000 × 60 × 60 × 24)
 * 
 * Ví dụ:
 * - Lấy: 1/3/2026 08:00
 * - Sẳn: 4/3/2026 18:00
 * - = 3.41 ngày → làm tròn lên 4 ngày
 */
export const calculateStorageDays = (pickupDate?: number, readyToShipDate?: number): number => {
  if (!pickupDate || !readyToShipDate) {
    return 3; // Default 3 ngày nếu chưa xác định
  }

  const pickupTime = new Date(pickupDate).getTime();
  const readyTime = new Date(readyToShipDate).getTime();
  const diffMs = readyTime - pickupTime;

  // Tính số ngày (làm tròn lên)
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Tối đa 30 ngày
  return Math.min(diffDays, 30);
};

/**
 * Tính fee breakdown cho order - để hiển thị trên invoice & notification
 */
export const calculateOrderFeeBreakdown = (params: {
  subTotal: number;
  weight?: number;
  storageDays?: number;
  pickupDate?: number;            // Khi lấy hàng
  readyToShipDate?: number;       // Khi sẳn vận chuyển (thay deliveredAt)
  processingMode?: "self" | "warehouse";
  commissionRate?: number;
}) => {
  const {
    subTotal,
    weight = 0,
    storageDays: providedStorageDays,
    pickupDate,
    readyToShipDate,
    processingMode = "warehouse",
    commissionRate = PLATFORM_CONFIG.defaultCommissionRate,
  } = params;

  // Tính tự động storageDays nếu có pickupDate & readyToShipDate
  const storageDays = providedStorageDays || calculateStorageDays(pickupDate, readyToShipDate);

  // Phí đi lấy (luôn có)
  const pickupFee = PLATFORM_CONFIG.pickupFeePerOrder;

  // Phí sơ chế & lưu kho (chỉ có nếu warehouse processing)
  let processingFee = 0;
  let storageFee = 0;

  if (processingMode === "warehouse" && weight > 0) {
    processingFee = Math.round(weight * PLATFORM_CONFIG.serviceFeesPerKg.cleaning);
    storageFee = Math.round(weight * (storageDays || 7) * PLATFORM_CONFIG.serviceFeesPerKg.storagePerDay);
  }

  // Hoa hồng platform (tính từ subTotal)
  const commissionAmount = calculateCommission(subTotal, commissionRate);

  // Tổng các khoản trừ (mà seller sẽ thấy trên invoice)
  const totalDeductions = pickupFee + processingFee + storageFee + commissionAmount;

  // Tiền seller sẽ nhận
  const sellerPayout = subTotal - totalDeductions;

  // Tiền customer thanh toán
  const grandTotal = subTotal;

  return {
    subTotal,
    pickupFee,
    processingFee,
    storageFee,
    weight, // Add weight to output
    storageDays, // Add storageDays to output
    commission: commissionRate * 100, // % dạng số
    commissionAmount,
    totalDeductions,
    platformTotal: commissionAmount, // Platform nhận hoa hồng
    sellerPayout,
    grandTotal,
  };
};
